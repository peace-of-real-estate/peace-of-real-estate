import type { Icon } from '@phosphor-icons/react'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/ui'

export function StepProgressHeader({
	stepNumber,
	totalSteps,
	title,
	items,
	activeIndex,
	titleIcon: TitleIcon,
	showTitle = true,
}: {
	stepNumber: number
	totalSteps: number
	title: string
	items: boolean[]
	activeIndex?: number
	titleIcon?: Icon
	showTitle?: boolean
}) {
	const completedCount = items.filter(Boolean).length
	const total = items.length
	const isComplete = completedCount === total

	return (
		<div className="space-y-2">
			{showTitle && (
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
							Step {stepNumber} of {totalSteps}
						</p>
						<h2 className="font-heading flex items-center gap-2 text-xl font-semibold tracking-tight">
							{TitleIcon && <TitleIcon className="h-5 w-5" />}
							{title}
						</h2>
					</div>
				</div>
			)}
			<div className="flex flex-col items-center gap-1.5">
				<div className="flex items-center gap-2.5">
					{Array.from({ length: total }).map((_, index) => {
						const isActive = activeIndex === index
						const isCompleted = index < completedCount
						return (
							<div
								key={index}
								className={cn(
									'h-2.5 w-2.5 rounded-full transition-all duration-300',
									isCompleted ? 'bg-primary' : 'bg-muted',
									isActive &&
										'ring-primary ring-2 ring-offset-2 ring-offset-background scale-110',
								)}
							/>
						)
					})}
				</div>
				<span
					className={cn(
						'text-xs font-bold transition-colors',
						isComplete ? 'text-primary' : 'text-muted-foreground',
					)}
				>
					{Math.max(completedCount, 1)} of {total}
				</span>
			</div>
		</div>
	)
}

export function AnimatedStatusIcon({
	complete,
	icon: Icon,
	className,
}: {
	complete: boolean
	icon: React.ElementType
	className?: string
}) {
	return (
		<span
			className={cn(
				'relative flex h-5 w-5 items-center justify-center',
				className,
			)}
		>
			<span
				className={cn(
					'absolute inset-0 flex items-center justify-center rounded-full border transition-all duration-300',
					'border-foreground/20 bg-foreground/5 text-foreground/70',
					complete ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
				)}
			>
				<Icon className="h-3 w-3" weight="duotone" />
			</span>
			<span
				className={cn(
					'absolute inset-0 flex items-center justify-center rounded-full border transition-all duration-300',
					'border-primary bg-primary/[0.04] text-primary',
					complete ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
				)}
			>
				<Check className="h-3 w-3" />
			</span>
		</span>
	)
}

const cardVariants = {
	enter: {
		y: '2rem',
		opacity: 0,
		scale: 0.96,
	},
	center: {
		y: 0,
		opacity: 1,
		scale: 1,
	},
	exit: {
		y: '-1rem',
		opacity: 0,
		scale: 0.96,
	},
}

export function AnimatedStepCard({
	children,
	stepKey,
}: {
	children: ReactNode
	stepKey: string
}) {
	return (
		<div className="relative overflow-hidden">
			<AnimatePresence mode="wait">
				<motion.div
					key={stepKey}
					variants={cardVariants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						y: { type: 'spring', stiffness: 320, damping: 30 },
						opacity: { duration: 0.25 },
						scale: { duration: 0.25 },
					}}
				>
					{children}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

export function FlowIntakeProgress({
	steps,
	current,
	currentStepProgress = 1,
}: {
	steps: { id: string; label: string }[]
	current: string
	currentStepProgress?: number
}) {
	const currentIndex = steps.findIndex((step) => step.id === current)
	const clampedCurrentStepProgress = Math.min(
		Math.max(currentStepProgress, 0),
		1,
	)

	return (
		<div
			className="grid gap-3"
			style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
			aria-label={`Step ${currentIndex + 1} of ${steps.length}`}
		>
			{steps.map((step, index) => {
				const isCurrent = index === currentIndex
				const isComplete = index < currentIndex
				const fillPercent = isComplete
					? 100
					: isCurrent
						? clampedCurrentStepProgress * 100
						: 0

				return (
					<div
						key={step.id}
						className={cn(
							'space-y-2 transition-opacity',
							isCurrent || isComplete ? 'opacity-100' : 'opacity-45',
						)}
					>
						<div className="bg-muted-foreground/15 h-1.5 overflow-hidden rounded-full">
							<div
								className={cn(
									'h-full origin-left rounded-full transition-all duration-700 ease-out',
									isComplete ? 'bg-primary/70' : 'bg-primary',
								)}
								style={{ width: `${fillPercent}%` }}
							/>
						</div>
						<p
							className={cn(
								'flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase transition-colors',
								isCurrent
									? 'text-primary'
									: isComplete
										? 'text-primary/75'
										: 'text-muted-foreground',
							)}
						>
							<span
								className={cn(
									'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
									isCurrent
										? 'bg-primary text-primary-foreground'
										: isComplete
											? 'bg-primary/15 text-primary'
											: 'bg-muted text-muted-foreground',
								)}
							>
								{index + 1}
							</span>
							<span>{step.label}</span>
						</p>
					</div>
				)
			})}
		</div>
	)
}
