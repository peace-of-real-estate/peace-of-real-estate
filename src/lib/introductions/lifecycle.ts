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

export type StatusSpec = {
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

export const DAY_MS = 86_400_000
export const HOUR_MS = 3_600_000

export const MAX_ACTIVE_INTROS = 3
export const VELOCITY_LIMIT = 10
export const VELOCITY_WINDOW_MS = 30 * DAY_MS
export const COOLDOWN_MS = 30 * DAY_MS
export const WITHDRAW_MIN_AGE_MS = 24 * HOUR_MS
