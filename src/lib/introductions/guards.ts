import type { ProfileStatus } from '@/lib/profile/profile-fields'

import type { IntroductionStatus } from './types'

export type GuardErrorCode =
	| 'AGENT_INELIGIBLE'
	| 'AGENT_NOT_FOUND'
	| 'ALREADY_ACTIVE'
	| 'COOLDOWN'
	| 'NOT_FOUND'
	| 'NOT_PENDING'
	| 'NOT_WITHDRAWABLE'
	| 'NO_AGENTS'
	| 'PROFILE_INCOMPLETE'
	| 'PROFILE_NOT_FOUND'
	| 'SLOT_CAP'
	| 'VELOCITY'
	| 'WITHDRAW_TOO_EARLY'

export type GuardError = { code: GuardErrorCode; message: string }

export const DAY_MS = 86_400_000
export const HOUR_MS = 3_600_000

export const MAX_ACTIVE_INTROS = 3
export const VELOCITY_LIMIT = 10
export const VELOCITY_WINDOW_MS = 30 * DAY_MS
export const COOLDOWN_MS = 30 * DAY_MS
export const WITHDRAW_MIN_AGE_MS = 24 * HOUR_MS

export function checkSlotCap(
	active: number,
	requested: number,
): GuardError | null {
	if (active + requested > MAX_ACTIVE_INTROS) {
		return { code: 'SLOT_CAP', message: 'Active intros cannot exceed 3.' }
	}
	return null
}

export function checkCooldown(
	terminalRow: { closedAt: Date } | null,
	now: Date,
): GuardError | null {
	if (!terminalRow) return null
	const elapsedMs = now.getTime() - terminalRow.closedAt.getTime()
	const remainingMs = COOLDOWN_MS - elapsedMs
	if (remainingMs > 0) {
		return {
			code: 'COOLDOWN',
			message: `Wait ${Math.ceil(remainingMs / DAY_MS)} more day(s).`,
		}
	}
	return null
}

export function checkVelocity(
	sentLast30Days: number,
	requested: number,
): GuardError | null {
	if (sentLast30Days + requested > VELOCITY_LIMIT) {
		return { code: 'VELOCITY', message: 'Monthly intro limit reached.' }
	}
	return null
}

export function checkProfileEligible(status: ProfileStatus): GuardError | null {
	if (status === 'draft') {
		return {
			code: 'PROFILE_INCOMPLETE',
			message: 'Finish your profile basics before sending introductions.',
		}
	}
	return null
}

export function checkAgentEligible(disqualified: boolean): GuardError | null {
	if (disqualified) {
		return {
			code: 'AGENT_INELIGIBLE',
			message: 'This agent is not an eligible match for your profile.',
		}
	}
	return null
}

export function checkPending(status: IntroductionStatus): GuardError | null {
	if (status !== 'pending') {
		return {
			code: 'NOT_PENDING',
			message: 'This introduction has already been resolved.',
		}
	}
	return null
}

export function checkWithdrawable(
	intro: { status: IntroductionStatus; createdAt: Date },
	now: Date,
): GuardError | null {
	if (intro.status !== 'pending') {
		return {
			code: 'NOT_WITHDRAWABLE',
			message: 'Only pending introductions can be withdrawn.',
		}
	}
	const remainingMs =
		WITHDRAW_MIN_AGE_MS - (now.getTime() - intro.createdAt.getTime())
	if (remainingMs > 0) {
		return {
			code: 'WITHDRAW_TOO_EARLY',
			message: `You can withdraw in ${Math.ceil(remainingMs / HOUR_MS)} more hour(s).`,
		}
	}
	return null
}
