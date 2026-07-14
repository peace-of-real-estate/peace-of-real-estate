export type ScoreTone = 'high' | 'mid' | 'low'

/** Tone for a 0–1 dimension score. For 0–100 fit scores use `fitScoreTone`. */
export function scoreTone(score: number): ScoreTone {
	if (score >= 0.75) return 'high'
	if (score >= 0.4) return 'mid'
	return 'low'
}

export function fitScoreTone(fitScore: number): ScoreTone {
	return scoreTone(fitScore / 100)
}

export const scoreToneClasses: Record<
	ScoreTone,
	{ text: string; badge: string; solid: string }
> = {
	high: {
		text: 'text-emerald-700 dark:text-emerald-300',
		badge:
			'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
		solid: 'bg-emerald-500',
	},
	mid: {
		text: 'text-amber-700 dark:text-amber-300',
		badge:
			'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
		solid: 'bg-amber-500',
	},
	low: {
		text: 'text-red-700 dark:text-red-300',
		badge: 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300',
		solid: 'bg-red-500',
	},
}
