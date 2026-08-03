import { sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import {
	check,
	foreignKey,
	index,
	pgEnum,
	snakeCase,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import {
	ACTIVE_STATUSES,
	INTRODUCTION_NOTIFICATION_KINDS,
	INTRODUCTION_STATUSES,
	type IntroductionStatus,
	type LifecycleTimestampField,
	PAIR_BLOCKING_STATUSES,
	STATUS_SPECS,
	type StatusSpec,
} from '@/lib/introductions/intro-data'

import { agentProfiles, clientProfiles } from './profiles'

function sameFields(
	a: readonly LifecycleTimestampField[],
	b: readonly LifecycleTimestampField[],
): boolean {
	return a.length === b.length && a.every((field) => b.includes(field))
}

function timestampCheckPredicate(
	table: Record<LifecycleTimestampField, SQLWrapper>,
	spec: StatusSpec,
): SQL {
	const parts = [
		...spec.required.map((field) => sql`${table[field]} IS NOT NULL`),
		...spec.forbidden.map((field) => sql`${table[field]} IS NULL`),
	]
	return sql`(${sql.join(parts, sql` AND `)})`
}

function buildIntroductionDataChecks(
	table: {
		status: SQLWrapper
	} & Record<LifecycleTimestampField, SQLWrapper>,
): { name: string; predicate: SQL }[] {
	const byLabel = new Map<string, IntroductionStatus[]>()
	for (const status of INTRODUCTION_STATUSES) {
		const label = STATUS_SPECS[status].checkLabel
		const group = byLabel.get(label)
		if (group) group.push(status)
		else byLabel.set(label, [status])
	}
	return [...byLabel.entries()].map(([label, statuses]) => {
		const first = statuses[0]!
		const spec = STATUS_SPECS[first]
		for (const status of statuses.slice(1)) {
			const other = STATUS_SPECS[status]
			if (
				!sameFields(spec.required, other.required) ||
				!sameFields(spec.forbidden, other.forbidden)
			) {
				throw new Error(
					`Statuses grouped under check "${label}" must share required/forbidden timestamp fields: ${first} diverges from ${status}.`,
				)
			}
		}
		const statusCondition =
			statuses.length === 1
				? sql`${table.status} <> ${first}`
				: sql`${table.status} NOT IN (${sql.join(
						statuses.map((status) => sql`${status}`),
						sql`, `,
					)})`
		return {
			name: `introductions_${label}_data_check`,
			predicate:
				sql`${statusCondition} OR ${timestampCheckPredicate(table, spec)}`.inlineParams(),
		}
	})
}

function statusIn(
	column: SQLWrapper,
	statuses: readonly IntroductionStatus[],
): SQL {
	return sql`${column} in (${sql.join(
		statuses.map((status) => sql`${status}`),
		sql`, `,
	)})`.inlineParams()
}

export const introductionStatus = pgEnum(
	'introduction_status',
	INTRODUCTION_STATUSES,
)

export const introductionNotificationKind = pgEnum(
	'introduction_notification_kind',
	INTRODUCTION_NOTIFICATION_KINDS,
)

export const introductions = snakeCase.table(
	'introductions',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		agentProfileId: text().notNull(),
		status: introductionStatus().default('pending').notNull(),
		acceptedAt: timestamp({ withTimezone: true }),
		connectedAt: timestamp({ withTimezone: true }),
		closedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'introductions_client_profile_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.agentProfileId],
			foreignColumns: [agentProfiles.id],
			name: 'introductions_agent_profile_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('introductions_active_pair_index')
			.on(table.agentProfileId, table.clientProfileId)
			.where(statusIn(table.status, PAIR_BLOCKING_STATUSES)),
		index('introductions_client_active_index')
			.on(table.clientProfileId)
			.where(statusIn(table.status, ACTIVE_STATUSES)),
		index('introductions_client_created_index').on(
			table.clientProfileId,
			table.createdAt,
		),
		index('introductions_agent_status_index').on(
			table.agentProfileId,
			table.status,
		),
		...buildIntroductionDataChecks(table).map(({ name, predicate }) =>
			check(name, predicate),
		),
	],
)

export const connectionNotificationJobs = snakeCase.table(
	'connection_notification_jobs',
	{
		introductionId: text().primaryKey().notNull(),
		agentSentAt: timestamp({ withTimezone: true }),
		clientSentAt: timestamp({ withTimezone: true }),
		canceledAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.introductionId],
			foreignColumns: [introductions.id],
			name: 'connection_notification_jobs_introduction_id_fk',
		}).onDelete('cascade'),
	],
)

export const introductionNotificationJobs = snakeCase.table(
	'introduction_notification_jobs',
	{
		id: text().primaryKey().notNull(),
		introductionId: text().notNull(),
		kind: introductionNotificationKind().notNull(),
		sentAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.introductionId],
			foreignColumns: [introductions.id],
			name: 'introduction_notification_jobs_introduction_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('introduction_notification_jobs_intro_kind_index').on(
			table.introductionId,
			table.kind,
		),
		index('introduction_notification_jobs_pending_index')
			.on(table.kind)
			.where(sql`${table.sentAt} is null`),
	],
)

export const introAccessWindows = snakeCase.table(
	'intro_access_windows',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		stripePaymentIntentId: text().notNull(),
		startsAt: timestamp({ withTimezone: true }).notNull(),
		endsAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'intro_access_windows_client_profile_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('intro_access_windows_profile_index').on(table.clientProfileId),
		uniqueIndex('intro_access_windows_payment_intent_index').on(
			table.stripePaymentIntentId,
		),
		check(
			'intro_access_windows_range_check',
			sql`${table.endsAt} > ${table.startsAt}`,
		),
	],
)
