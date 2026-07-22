import { sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import { z } from 'zod'

export const INTRODUCTION_STATUSES: [
	'pending',
	'accepted',
	'declined',
	'withdrawn',
	'connected',
] = ['pending', 'accepted', 'declined', 'withdrawn', 'connected']

export type IntroductionStatus = (typeof INTRODUCTION_STATUSES)[number]

type TimestampField = 'acceptedAt' | 'connectedAt' | 'closedAt'

const pendingDataSchema = z.object({})

const acceptedDataSchema = z.object({
	acceptedAt: z.iso.datetime(),
})

const connectedDataSchema = acceptedDataSchema.extend({
	connectedAt: z.iso.datetime(),
})

const closedDataSchema = z.object({
	closedAt: z.iso.datetime(),
})

export type IntroductionData =
	| z.infer<typeof pendingDataSchema>
	| z.infer<typeof acceptedDataSchema>
	| z.infer<typeof connectedDataSchema>
	| z.infer<typeof closedDataSchema>

type StatusSpec = {
	/** zod schema for the jsonb payload */
	schema: z.ZodType<Partial<Record<TimestampField, string>>>
	/** timestamp fields the payload must contain (the schema's keys) */
	required: readonly TimestampField[]
	/** timestamp fields the payload must not contain */
	forbidden: readonly TimestampField[]
	/** groups statuses that share one SQL check constraint */
	checkLabel: string
	/** payload must be exactly '{}' rather than merely lack forbidden keys */
	emptyExact?: boolean
	/** counts against the client's active-intro slot cap */
	occupiesSlot: boolean
	/** blocks a new introduction for the same client/agent pair */
	blocksPair: boolean
	/** terminal state; payload carries closedAt */
	isClosed: boolean
}

export const STATUS_SPECS: Record<IntroductionStatus, StatusSpec> = {
	pending: {
		schema: pendingDataSchema,
		required: [],
		forbidden: [],
		checkLabel: 'pending',
		emptyExact: true,
		occupiesSlot: true,
		blocksPair: true,
		isClosed: false,
	},
	accepted: {
		schema: acceptedDataSchema,
		required: ['acceptedAt'],
		forbidden: ['connectedAt', 'closedAt'],
		checkLabel: 'accepted',
		occupiesSlot: true,
		blocksPair: true,
		isClosed: false,
	},
	connected: {
		schema: connectedDataSchema,
		required: ['acceptedAt', 'connectedAt'],
		forbidden: ['closedAt'],
		checkLabel: 'connected',
		occupiesSlot: false,
		blocksPair: true,
		isClosed: false,
	},
	declined: {
		schema: closedDataSchema,
		required: ['closedAt'],
		forbidden: ['connectedAt'],
		checkLabel: 'closed',
		occupiesSlot: false,
		blocksPair: false,
		isClosed: true,
	},
	withdrawn: {
		schema: closedDataSchema,
		required: ['closedAt'],
		forbidden: ['connectedAt'],
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

function quotedLiteral(value: string): SQL {
	return sql.raw(`'${value}'`)
}

function statusList(statuses: readonly string[]): SQL {
	return sql.raw(statuses.map((status) => `'${status}'`).join(', '))
}

function dataCheckPredicate(data: SQLWrapper, spec: StatusSpec): SQL {
	if (spec.emptyExact) return sql`${data} = '{}'::jsonb`
	const parts = [
		...spec.required.map((field) => sql`${data} ? ${quotedLiteral(field)}`),
		...spec.forbidden.map(
			(field) => sql`NOT (${data} ? ${quotedLiteral(field)})`,
		),
	]
	return sql`(${sql.join(parts, sql` AND `)})`
}

export function buildIntroductionDataChecks(table: {
	status: SQLWrapper
	data: SQLWrapper
}): { name: string; predicate: SQL }[] {
	const byLabel = new Map<string, IntroductionStatus[]>()
	for (const status of INTRODUCTION_STATUSES) {
		const label = STATUS_SPECS[status].checkLabel
		const group = byLabel.get(label)
		if (group) group.push(status)
		else byLabel.set(label, [status])
	}
	return [...byLabel.entries()].map(([label, statuses]) => {
		const first = statuses[0]!
		const statusCondition =
			statuses.length === 1
				? sql`${table.status} <> ${quotedLiteral(first)}`
				: sql`${table.status} NOT IN (${statusList(statuses)})`
		return {
			name: `introductions_${label}_data_check`,
			predicate: sql`${statusCondition} OR ${dataCheckPredicate(table.data, STATUS_SPECS[first])}`,
		}
	})
}

export function statusIn(column: SQLWrapper, statuses: readonly string[]): SQL {
	return sql`${column} in (${statusList(statuses)})`
}

export type DecodedIntroData = {
	acceptedAt: Date | null
	connectedAt: Date | null
	closedAt: Date | null
}

function toDate(value: string | undefined): Date | null {
	return value === undefined ? null : new Date(value)
}

export function decodeData(
	status: IntroductionStatus,
	data: unknown,
): DecodedIntroData {
	const parsed = STATUS_SPECS[status].schema.parse(data)
	return {
		acceptedAt: toDate(parsed.acceptedAt),
		connectedAt: toDate(parsed.connectedAt),
		closedAt: toDate(parsed.closedAt),
	}
}

function encodeFields(
	fields: readonly TimestampField[],
	now: Date,
): IntroductionData {
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return Object.fromEntries(
		fields.map((field) => [field, now.toISOString()]),
	) as IntroductionData
}

export const encodeData = {
	pending: (): IntroductionData => ({}),
	accepted: (now: Date): IntroductionData =>
		encodeFields(STATUS_SPECS.accepted.required, now),
	connected: (now: Date): IntroductionData =>
		encodeFields(STATUS_SPECS.connected.required, now),
	closed: (now: Date): IntroductionData =>
		encodeFields(STATUS_SPECS.declined.required, now),
}
