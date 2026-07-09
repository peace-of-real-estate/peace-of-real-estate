import type { Icon } from '@phosphor-icons/react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/ui'

export type SignupWizardStep<TStep extends string = string> = {
	id: TStep
	label: string
	icon: Icon
	description?: string
}

export type SignupWizardContext<TDraft, TStep extends string> = {
	state: TDraft
	updateState: (patch: Partial<TDraft>) => void
	goToStep: (step: TStep) => void
}

type DraftStorage<TDraft> = {
	load: () => TDraft | null
	save: (value: TDraft) => void
	clear: () => void
}

const SignupWizardContextValue = createContext<unknown>(null)

export function useSignupWizardContext<TDraft, TStep extends string>() {
	const context = useContext(SignupWizardContextValue)
	if (!context) {
		throw new Error(
			'useSignupWizardContext must be used inside SignupWizardShell',
		)
	}
	return context as SignupWizardContext<TDraft, TStep>
}

export function SignupWizardShell<TDraft extends object, TStep extends string>({
	steps,
	currentStepId,
	basePath,
	getStepPath,
	draftStorage,
	initialDraft,
	getHasDraft,
	getCompletedStepIds,
}: {
	steps: SignupWizardStep<Exclude<TStep, 'preview'>>[]
	currentStepId: Exclude<TStep, 'preview'>
	basePath: '/signup/buyer' | '/signup/seller' | '/signup/agent'
	getStepPath: (step: TStep) => string
	draftStorage: DraftStorage<TDraft>
	initialDraft: TDraft
	getHasDraft: (draft: TDraft) => boolean
	getCompletedStepIds: (draft: TDraft) => Exclude<TStep, 'preview'>[]
}) {
	const navigate = useNavigate()
	const [showLeaveDialog, setShowLeaveDialog] = useState(false)
	const [state, setState] = useState<TDraft>(() => ({
		...initialDraft,
		...draftStorage.load(),
	}))

	const goToStep = (step: TStep) => {
		const stepPath = getStepPath(step)
		void navigate({
			to: (stepPath.startsWith('/')
				? stepPath
				: `${basePath}/${stepPath}`) as never,
		})
	}
	const updateState = (patch: Partial<TDraft>) => {
		setState((current) => {
			const next = { ...current, ...patch }
			draftStorage.save(next)
			return next
		})
	}
	const hasDraft = getHasDraft(state)
	const completedStepIds = getCompletedStepIds(state)

	return (
		<SignupWizardContextValue.Provider value={{ state, updateState, goToStep }}>
			<WizardChrome
				steps={steps}
				currentStepId={currentStepId}
				progress={<FlowIntakeProgress steps={steps} current={currentStepId} />}
				onHomeClick={() =>
					hasDraft ? setShowLeaveDialog(true) : void navigate({ to: '/' })
				}
				onStepClick={(step) => goToStep(step)}
				completedStepIds={completedStepIds}
			>
				<Outlet />
			</WizardChrome>
			<LeaveDialog
				open={showLeaveDialog}
				onConfirm={() => {
					setShowLeaveDialog(false)
					void navigate({ to: '/' })
				}}
				onOpenChange={setShowLeaveDialog}
			/>
		</SignupWizardContextValue.Provider>
	)
}

function StepDot({
	isComplete,
	isCurrent,
	index,
}: {
	isComplete: boolean
	isCurrent: boolean
	index: number
}) {
	return (
		<div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center">
			{isCurrent ? (
				<span className="bg-gold/40 absolute h-9 w-9 animate-ping rounded-full" />
			) : null}
			<div
				className={cn(
					'relative flex h-full w-full items-center justify-center rounded-full transition-all duration-300',
					isCurrent
						? 'bg-primary-foreground text-primary shadow-[0_0_8px_2px_rgba(212,175,55,0.55)]'
						: isComplete
							? 'bg-gold text-primary'
							: 'bg-primary-foreground/25 text-primary-foreground',
				)}
			>
				<span className="text-[10px] font-bold">{index + 1}</span>
			</div>
		</div>
	)
}

export function WizardChrome<TStep extends string>({
	steps,
	currentStepId,
	progress,
	children,
	onHomeClick,
	onStepClick,
	completedStepIds,
}: {
	steps: SignupWizardStep<TStep>[]
	currentStepId: TStep
	progress?: ReactNode
	children: ReactNode
	onHomeClick?: () => void
	onStepClick?: (stepId: TStep) => void
	completedStepIds?: TStep[]
}) {
	const currentIndex = steps.findIndex((step) => step.id === currentStepId)
	const homeContent = (
		<>
			<img src="/logomark-light.svg" alt="" className="h-8 w-auto" />
			<span className="font-heading text-base font-semibold">
				Peace of Real Estate
			</span>
		</>
	)

	return (
		<div className="flex flex-1 flex-col lg:grid lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
			<aside className="bg-primary text-primary-foreground hidden flex-col justify-between px-7 py-10 lg:sticky lg:top-0 lg:flex lg:min-h-dvh">
				<div>
					{onHomeClick ? (
						<button
							type="button"
							onClick={onHomeClick}
							className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100"
						>
							{homeContent}
						</button>
					) : (
						<Link
							to="/"
							className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100"
						>
							{homeContent}
						</Link>
					)}

					<nav className="mt-10" aria-label="Setup steps">
						<ol>
							{steps.map((step, index) => {
								const isCurrent = index === currentIndex
								const isCompleteByPosition = index < currentIndex
								const isCompleteByData =
									completedStepIds?.includes(step.id) ?? false
								const isComplete =
									(isCompleteByData || isCompleteByPosition) && !isCurrent
								const isUpcoming = !isCurrent && !isComplete
								const isLast = index === steps.length - 1
								const isClickable = onStepClick !== undefined && isComplete
								const stepClassName = cn(
									'grid grid-cols-[auto_1fr] gap-3 rounded-xl px-3 py-3 transition-colors',
									isCurrent && 'bg-white/10',
									isComplete && 'opacity-90',
									isUpcoming && 'opacity-55',
									isClickable && 'hover:bg-white/5',
								)
								const stepContent = (
									<>
										<div className="relative flex flex-col items-center">
											<StepDot
												isComplete={isComplete}
												isCurrent={isCurrent}
												index={index}
											/>
											{!isLast && (
												<div
													className={cn(
														'absolute top-[0.875rem] left-1/2 h-[calc(100%+0.75rem)] w-0.5 -translate-x-1/2',
														isComplete ? 'bg-gold' : 'bg-primary-foreground/40',
													)}
												/>
											)}
										</div>
										<div className="flex min-w-0 flex-col justify-center">
											<p
												className={cn(
													'text-sm font-semibold leading-tight',
													isCurrent
														? 'text-white'
														: 'text-primary-foreground/90',
												)}
											>
												<step.icon
													className={cn(
														'-mt-0.5 mr-1.5 inline-block h-4 w-4',
														isCurrent
															? 'text-white'
															: 'text-primary-foreground/80',
													)}
													weight="duotone"
												/>
												{step.label}
											</p>
											{step.description ? (
												<p className="text-primary-foreground/60 mt-0.5 text-xs leading-snug">
													{step.description}
												</p>
											) : null}
										</div>
									</>
								)

								return (
									<li key={step.id}>
										{isClickable ? (
											<button
												type="button"
												onClick={() => onStepClick(step.id)}
												className={cn(stepClassName, 'w-full text-left')}
											>
												{stepContent}
											</button>
										) : (
											<div
												className={stepClassName}
												aria-current={isCurrent ? 'step' : undefined}
											>
												{stepContent}
											</div>
										)}
									</li>
								)
							})}
						</ol>
					</nav>
				</div>
			</aside>

			{progress ? (
				<div className="bg-card border-b px-4 py-4 lg:hidden">{progress}</div>
			) : null}

			<main className="flex flex-1 flex-col overflow-y-auto">
				<div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12 xl:py-16">
					{children}
				</div>
			</main>
		</div>
	)
}

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

const cardVariants = {
	enter: { y: '2rem', opacity: 0, scale: 0.96 },
	center: { y: 0, opacity: 1, scale: 1 },
	exit: { y: '-1rem', opacity: 0, scale: 0.96 },
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

function FlowIntakeProgress({
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

function LeaveDialog({
	open,
	onOpenChange,
	onConfirm,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<TriangleAlert className="text-destructive h-5 w-5" />
						Leave this page?
					</DialogTitle>
					<DialogDescription>
						Your answers are saved in this browser, but you will leave the quiz.
						You can come back and continue any time.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Keep going
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						Leave
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export function StepHeader({
	stepNumber,
	totalSteps,
	title,
	icon: Icon,
}: {
	stepNumber: number
	totalSteps: number
	title: string
	icon?: Icon
}) {
	return (
		<div className="space-y-1">
			<p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
				Step {stepNumber} of {totalSteps}
			</p>
			<h2 className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
				{Icon ? <Icon className="h-4 w-4" weight="duotone" /> : null}
				{title}
			</h2>
		</div>
	)
}

export function StepLabel({
	children,
	complete,
	error,
}: {
	children: React.ReactNode
	complete?: boolean
	error?: boolean
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-2 text-sm font-semibold tracking-wide uppercase leading-none',
				error
					? 'text-destructive'
					: complete
						? 'text-primary'
						: 'text-muted-foreground',
			)}
		>
			{children}
		</div>
	)
}
