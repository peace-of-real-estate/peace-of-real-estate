import type { IntroductionStatus } from '@/lib/introductions/types'

export type IntroGroupKey = 'pending' | 'accepted' | 'connected' | 'history'

export type IntroGroups<T> = Record<IntroGroupKey, T[]>

export function groupIntroductions<T extends { status: IntroductionStatus }>(
	introductions: T[],
): IntroGroups<T> {
	const groups: IntroGroups<T> = {
		pending: [],
		accepted: [],
		connected: [],
		history: [],
	}
	for (const introduction of introductions) {
		if (introduction.status === 'pending') groups.pending.push(introduction)
		else if (introduction.status === 'accepted')
			groups.accepted.push(introduction)
		else if (introduction.status === 'connected')
			groups.connected.push(introduction)
		else groups.history.push(introduction)
	}
	return groups
}

export function formatIntroductionDate(value: Date | string): string {
	return new Date(value).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}
