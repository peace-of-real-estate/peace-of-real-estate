import { sql, type SQL, type SQLWrapper } from 'drizzle-orm'

export const INTRODUCTION_STATUSES: [
	'pending',
	'accepted',
	'declined',
	'withdrawn',
	'connected',
] = ['pending', 'accepted', 'declined', 'withdrawn', 'connected']

export type IntroductionStatus = (typeof INTRODUCTION_STATUSES)[number]

export const INTRODUCTION_NOTIFICATION_KINDS: ['sent', 'accepted', 'declined'] =
	['sent', 'accepted', 'declined']

export type IntroductionNotificationKind =
	(typeof INTRODUCTION_NOTIFICATION_KINDS)[number]

export type LifecycleTimestampField = 'acceptedAt' | 'connectedAt' | 'closedAt'

type StatusSpec = {
	/** timestamp columns that must be set in this status */
	required: readonly LifecycleTimestampField[]
	/** timestamp columns that must be null in this status */
	forbidden: readonly LifecycleTimestampField[]
	/** groups statuses that share one SQL check constraint */
	checkLabel: string
	/** counts against the client's active-intro slot cap */
	occupiesSlot: boolean
	/** blocks a new introduction for the same client/agent pair */
	blocksPair: boolean
	/** terminal state; closedAt is set */
	isClosed: boolean
}

const CLOSED_FIELDS = {
	required: ['closedAt'],
	forbidden: ['acceptedAt', 'connectedAt'],
} as const satisfies Pick<StatusSpec, 'required' | 'forbidden'>

export const STATUS_SPECS: Record<IntroductionStatus, StatusSpec> = {
	pending: {
		required: [],
		forbidden: ['acceptedAt', 'connectedAt', 'closedAt'],
		checkLabel: 'pending',
		occupiesSlot: true,
		blocksPair: true,
		isClosed: false,
	},
	accepted: {
		required: ['acceptedAt'],
		forbidden: ['connectedAt', 'closedAt'],
		checkLabel: 'accepted',
		occupiesSlot: true,
		blocksPair: true,
		isClosed: false,
	},
	connected: {
		required: ['acceptedAt', 'connectedAt'],
		forbidden: ['closedAt'],
		checkLabel: 'connected',
		occupiesSlot: false,
		blocksPair: true,
		isClosed: false,
	},
	declined: {
		...CLOSED_FIELDS,
		checkLabel: 'closed',
		occupiesSlot: false,
		blocksPair: false,
		isClosed: true,
	},
	withdrawn: {
		...CLOSED_FIELDS,
		checkLabel: 'closed',
		occupiesSlot: false,
		blocksPair: false,
		isClosed: true,
	},
}

function statusesWhere(
	predicate: (spec: StatusSpec) => boolean,
): IntroductionStatus[] {
	return INTRODUCTION_STATUSES.filter((status) =>
		predicate(STATUS_SPECS[status]),
	)
}

export const ACTIVE_STATUSES = statusesWhere((spec) => spec.occupiesSlot)
export const PAIR_BLOCKING_STATUSES = statusesWhere((spec) => spec.blocksPair)

export function isClosedStatus(status: IntroductionStatus): boolean {
	return STATUS_SPECS[status].isClosed
}

export function isActiveStatus(status: IntroductionStatus): boolean {
	return STATUS_SPECS[status].occupiesSlot
}

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

export function buildIntroductionDataChecks(
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

export function statusIn(
	column: SQLWrapper,
	statuses: readonly IntroductionStatus[],
): SQL {
	return sql`${column} in (${sql.join(
		statuses.map((status) => sql`${status}`),
		sql`, `,
	)})`.inlineParams()
}
