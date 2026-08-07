import { AnimatePresence, m } from 'framer-motion'

import { cn } from '@/lib/utils/ui'

const tickVariants = {
	enter: (direction: number) => ({ opacity: 0, y: direction * 8 }),
	center: { opacity: 1, y: 0 },
	exit: (direction: number) => ({ opacity: 0, y: direction * -8 }),
}

export function QuizProgress({
	current,
	total,
	direction,
	className,
}: {
	current: number
	total: number
	direction: number
	className?: string | undefined
}) {
	return (
		<output
			className={cn('flex items-center gap-3', className)}
			aria-label={`Question ${current} of ${total}`}
		>
			<div
				className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
				aria-hidden="true"
			>
				<div
					className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
					style={{ width: `${(current / total) * 100}%` }}
				/>
			</div>
			<span className="text-muted-foreground flex items-baseline gap-1 text-xs font-semibold whitespace-nowrap tabular-nums">
				<span className="inline-flex overflow-hidden">
					<AnimatePresence mode="popLayout" custom={direction} initial={false}>
						<m.span
							key={current}
							custom={direction}
							variants={tickVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.15, ease: 'easeOut' }}
						>
							{current}
						</m.span>
					</AnimatePresence>
				</span>
				of {total}
			</span>
		</output>
	)
}
