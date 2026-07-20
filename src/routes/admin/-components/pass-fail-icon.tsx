import {
	CheckIcon as Check,
	MinusIcon as Minus,
	XIcon as X,
} from '@phosphor-icons/react'

import { cn } from '@/lib/utils/ui'

/** Semantic text color for a pass/fail state, matching score-tone.ts's tokens. */
export function passFailTextClass(pass: boolean): string {
	return pass ? 'text-success' : 'text-destructive'
}

/** Shared Check/X (or Minus for an inapplicable/neutral state) glyph. */
export function PassFailIcon({
	pass,
	className,
}: {
	pass: boolean | null
	className?: string
}) {
	if (pass === null) {
		return <Minus className={cn('text-muted-foreground', className)} />
	}
	return pass ? (
		<Check className={cn(passFailTextClass(true), className)} />
	) : (
		<X className={cn(passFailTextClass(false), className)} />
	)
}
