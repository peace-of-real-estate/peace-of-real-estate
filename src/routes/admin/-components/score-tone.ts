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
		text: 'text-success',
		badge: 'border-success/30 bg-success/5 text-success',
		solid: 'bg-success',
	},
	mid: {
		text: 'text-amber-foreground',
		badge: 'border-amber/40 bg-amber/10 text-amber-foreground',
		solid: 'bg-amber',
	},
	low: {
		text: 'text-destructive',
		badge: 'border-destructive/30 bg-destructive/5 text-destructive',
		solid: 'bg-destructive',
	},
}
