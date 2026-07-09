import {
	CalendarBlankIcon,
	ClockIcon,
	HouseLineIcon,
	MapPinIcon,
	UserIcon,
} from '@phosphor-icons/react'
import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	Check,
	Globe,
	Home,
	Lock,
	Mail,
	MessageSquare,
	Phone,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	useEffect,
	useRef,
	useState,
	type ElementType,
	type ReactNode,
} from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { parseCityState } from '@/lib/geography/zip'
import {
	formatPriceRange,
	parsePriceRange,
	PRICE_MAX,
	PRICE_MIN,
	serializePriceRange,
} from '@/lib/matching/price-range'
import type {
	BuyerDraft,
	ClientProfile,
	SellerDraft,
} from '@/lib/matching/profile'
import {
	answerValueSchema,
	buyerAnswerLabels,
	optionKeys,
	propertyTypeOptions,
	propertyTypesSchema,
	questionOptionEntries,
	sellerAnswerLabels,
	type AnswerLabelConfig,
	type AnswerValue,
	type Question,
} from '@/lib/matching/questions'
import type { z } from 'zod'
import { cn } from '@/lib/utils/ui'
import {
	AnimatedStepCard,
	StepHeader,
	StepProgressHeader,
} from './signup-wizard-shell'
import { CityZipSelector } from './city-zip-selector'
import { PriceInput } from './price-input'

export type ClientSignupStep = 'location' | 'home' | 'preferences' | 'preview'
export type ClientDraft = BuyerDraft | SellerDraft
export type ClientQuizProfile = ClientProfile

const timelineOptions = [
	{ slug: 'exploring', label: 'Just exploring' },
	{ slug: '1month', label: '1 month' },
	{ slug: '2months', label: '2 months' },
	{ slug: '3months', label: '3 months' },
	{ slug: '4months', label: '4 months' },
	{ slug: '5months', label: '5 months' },
	{ slug: '6months', label: '6 months' },
	{ slug: '7months', label: '7 months' },
	{ slug: '8months', label: '8 months' },
	{ slug: '9months', label: '9 months' },
	{ slug: '10months', label: '10 months' },
	{ slug: '11months', label: '11 months' },
	{ slug: '12monthsPlus', label: '12+ months' },
] as const

const buyerQuizFields = [
	'experienceLevel',
	'idealAgentRelationship',
	'decisionMakingNeed',
	'biddingWarResponse',
	'quickCommunicationChannel',
	'updateDeliveryMethod',
	'involvementLevel',
	'responseTimeExpectation',
	'commissionComfort',
] as const satisfies readonly (keyof BuyerDraft)[]

const sellerQuizFields = [
	'saleMotivation',
	'successfulSaleLooksLike',
	'involvementLevel',
	'quickCommunicationChannel',
	'updateDeliveryMethod',
	'agentDeliveryExpectations',
	'homeConnection',
	'agentSilencePreference',
	'representationPreference',
	'responseTimeExpectation',
	'commissionComfort',
] as const satisfies readonly (keyof SellerDraft)[]

const buyerQuestions = Object.entries(buyerAnswerLabels).map(
	([id, config]: [string, AnswerLabelConfig]) => ({
		id,
		title: config.title,
		options: config.options,
		multiple: config.multiple,
	}),
) satisfies Question[]

const sellerQuestions = Object.entries(sellerAnswerLabels).map(
	([id, config]: [string, AnswerLabelConfig]) => ({
		id,
		title: config.title,
		options: config.options,
		multiple: config.multiple,
	}),
) satisfies Question[]

export function ClientLocationFields({
	state,
	onUpdate,
	onContinue,
}: {
	state: ClientDraft
	onUpdate: (patch: Partial<ClientDraft>) => void
	onContinue: () => void
}) {
	const rawInitialLocation = state.city ?? ''
	const [committedLocation, setCommittedLocation] = useState(rawInitialLocation)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(
		state.zipCodes ?? [],
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const canContinue = committedLocation.trim().length >= 2
	const cityState = parseCityState(committedLocation)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={1}
						totalSteps={3}
						title="Location"
						icon={MapPinIcon}
					/>
					<FieldSection
						title="City"
						description="Search for the city where you want to buy or sell."
						icon={MapPinIcon}
					>
						<CityZipSelector
							id="client-location"
							value={rawInitialLocation}
							onChange={(location, zipCodes) => {
								setCommittedLocation(location)
								setSelectedZipCodes(zipCodes)
							}}
							zipCodes={selectedZipCodes}
							label={null}
						/>
						{hasTriedContinue && !canContinue ? (
							<p className="text-destructive text-xs">Enter a city.</p>
						) : null}
					</FieldSection>
					<ContinueButton
						disabled={!canContinue}
						onClick={() => {
							if (!canContinue) {
								setHasTriedContinue(true)
								return
							}
							onUpdate({
								city: cityState?.city ?? committedLocation.trim(),
								...(cityState?.state ? { state: cityState.state } : {}),
								zipCodes: selectedZipCodes,
							})
							onContinue()
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}

export function ClientHomeFields({
	state,
	priceLabel,
	onUpdate,
	onContinue,
}: {
	state: ClientDraft
	priceLabel: string
	onUpdate: (patch: Partial<ClientDraft>) => void
	onContinue: () => void
}) {
	const [priceRange, setPriceRange] = useState(
		parsePriceRange(state.priceRange),
	)
	const [propertyTypes, setPropertyTypes] = useState<
		z.infer<typeof propertyTypesSchema>
	>(state.propertyTypes ?? [])
	const [hasDeadline, setHasDeadline] = useState(
		state.timeline ? state.timeline !== 'exploring' : false,
	)
	const deadlineOptions = timelineOptions.filter(
		(option) => option.slug !== 'exploring',
	)
	const [deadlineIndex, setDeadlineIndex] = useState(() =>
		Math.max(
			deadlineOptions.findIndex((option) => option.slug === state.timeline),
			0,
		),
	)
	const priceComplete =
		priceRange.min >= PRICE_MIN && priceRange.max <= PRICE_MAX
	const propertyComplete = propertyTypes.length > 0
	const canContinue = priceComplete && propertyComplete
	const timeline = hasDeadline
		? deadlineOptions[deadlineIndex]!.slug
		: 'exploring'

	return (
		<AnimatedStepCard stepKey="home">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={2}
						totalSteps={3}
						title="Home"
						icon={HouseLineIcon}
					/>
					<div className="space-y-8">
						<FieldSection
							title="Timeline"
							description="Let agents know how urgent your search is."
							icon={CalendarBlankIcon}
						>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<SelectionCard
									icon={ClockIcon}
									title="Just exploring"
									description="No firm timeline yet."
									selected={!hasDeadline}
									variant="subtle"
									onClick={() => setHasDeadline(false)}
								/>
								<SelectionCard
									icon={CalendarBlankIcon}
									title="I have a deadline"
									description="Select when you need to move."
									selected={hasDeadline}
									variant="subtle"
									onClick={() => setHasDeadline(true)}
								/>
							</div>
							<div
								className={cn(
									'space-y-3 overflow-hidden transition-all duration-300',
									hasDeadline ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
								)}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										When do you need to move?
									</span>
									<span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold">
										{deadlineOptions[deadlineIndex]!.label}
									</span>
								</div>
								<Slider
									value={[deadlineIndex]}
									min={0}
									max={deadlineOptions.length - 1}
									step={1}
									onValueChange={([index]) => setDeadlineIndex(index ?? 0)}
									disabled={!hasDeadline}
								/>
								<div className="text-muted-foreground flex justify-between text-xs font-medium">
									<span>{deadlineOptions[0]!.label}</span>
									<span>
										{deadlineOptions[deadlineOptions.length - 1]!.label}
									</span>
								</div>
							</div>
						</FieldSection>
						<FieldSection
							title="Home type"
							description="Select all that apply."
							icon={Home}
							action={
								propertyComplete ? (
									<span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
										{propertyTypes.length} selected
									</span>
								) : null
							}
						>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{optionKeys(propertyTypeOptions).map((option) => (
									<SelectionCard
										key={option}
										icon={Home}
										title={propertyTypeOptions[option]}
										selected={propertyTypes.includes(option)}
										variant="solid"
										layout="vertical"
										indicator="none"
										onClick={() =>
											setPropertyTypes((current) =>
												current.includes(option)
													? current.filter((item) => item !== option)
													: [...current, option],
											)
										}
									/>
								))}
							</div>
						</FieldSection>
						<div className="bg-muted/30 border-border/60 rounded-2xl border p-5">
							<FieldSection
								title={priceLabel}
								description="Set your minimum and maximum."
								icon={Banknote}
								action={
									<span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap">
										{formatPriceRange(priceRange)}
									</span>
								}
							>
								<div className="grid grid-cols-2 gap-3">
									<PriceInput
										id="price-min"
										label="Low"
										value={priceRange.min}
										onChange={(nextMin) =>
											setPriceRange((current) => ({
												...current,
												min: Math.min(nextMin, current.max),
											}))
										}
									/>
									<PriceInput
										id="price-max"
										label="High"
										value={priceRange.max}
										onChange={(nextMax) =>
											setPriceRange((current) => ({
												...current,
												max: Math.max(nextMax, current.min),
											}))
										}
									/>
								</div>
							</FieldSection>
						</div>
					</div>
					<ContinueButton
						disabled={!canContinue}
						onClick={() => {
							if (!canContinue) return
							onUpdate({
								priceRange: serializePriceRange(priceRange),
								propertyTypes,
								timeline,
							})
							onContinue()
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}

export function ClientPreferencesFields({
	state,
	onUpdate,
	onComplete,
	clientRole,
}: {
	state: ClientDraft
	onUpdate: (patch: Partial<ClientDraft>) => void
	onComplete: () => void
	clientRole: 'buyer' | 'seller'
}) {
	const isBuyer = clientRole === 'buyer'
	const questions = isBuyer ? buyerQuestions : sellerQuestions
	const answers = extractAnswers(state, questions)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
		getNextUnansweredQuestionIndex(questions, answers),
	)
	return (
		<AnimatedStepCard stepKey="preferences">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={3}
						totalSteps={3}
						title="Preferences"
						icon={UserIcon}
					/>
					<StepProgressHeader
						stepNumber={3}
						totalSteps={3}
						title="Preferences"
						activeIndex={currentQuestionIndex}
						items={questions.map(
							(q) => answers[q.id] !== undefined && answers[q.id] !== null,
						)}
						showTitle={false}
					/>
					<QuestionFlow
						questions={questions}
						answers={answers}
						currentQuestionIndex={currentQuestionIndex}
						onAnswersChange={(nextAnswers) =>
							onUpdate(answersToProfileUpdate(nextAnswers, questions))
						}
						onQuestionIndexChange={setCurrentQuestionIndex}
						onComplete={onComplete}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}

export function isBuyerPreferencesComplete(state: BuyerDraft): boolean {
	return buyerQuizFields.every((field) => state[field] !== undefined)
}

export function isSellerPreferencesComplete(state: SellerDraft): boolean {
	return sellerQuizFields.every((field) => state[field] !== undefined)
}

function ContinueButton({
	disabled,
	onClick,
}: {
	disabled: boolean
	onClick: () => void
}) {
	return (
		<Button
			onClick={onClick}
			disabled={disabled}
			size="lg"
			className={cn(
				'w-full gap-2 rounded-4xl px-8 py-6 text-base transition-all duration-300',
				disabled
					? 'bg-muted text-muted-foreground'
					: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
			)}
		>
			Continue
			<ArrowRight className="h-5 w-5" />
		</Button>
	)
}

function FieldSection({
	icon: Icon,
	title,
	description,
	action,
	children,
	className,
}: {
	icon?: ElementType
	title: ReactNode
	description?: ReactNode
	action?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<div className={cn('space-y-4', className)}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-heading flex items-center gap-2 text-base font-semibold tracking-tight">
						{Icon ? (
							<Icon
								className="text-muted-foreground h-4 w-4"
								weight="duotone"
							/>
						) : null}
						{title}
					</h3>
					{description ? (
						<p className="text-muted-foreground mt-0.5 text-sm">
							{description}
						</p>
					) : null}
				</div>
				{action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
			</div>
			{children}
		</div>
	)
}

function extractAnswers(
	draft: ClientDraft,
	questions: Question[],
): Record<string, AnswerValue> {
	const answers: Record<string, AnswerValue> = {}
	for (const question of questions) {
		if (!Object.hasOwn(draft, question.id)) continue
		const value = Reflect.get(draft, question.id)
		const parsed = answerValueSchema.safeParse(value)
		if (parsed.success) answers[question.id] = parsed.data
	}
	return answers
}

function answersToProfileUpdate(
	answers: Record<string, AnswerValue>,
	questions: Question[],
): Partial<ClientDraft> {
	const update: Partial<ClientDraft> & Record<string, AnswerValue> = {}
	for (const question of questions) {
		const value = answers[question.id]
		if (value !== undefined && value !== null) update[question.id] = value
	}
	return update
}

function getNextUnansweredQuestionIndex(
	questionList: Question[],
	answers: Record<string, AnswerValue>,
) {
	const nextIndex = questionList.findIndex((q) => answers[q.id] === undefined)
	return nextIndex === -1 ? Math.max(questionList.length - 1, 0) : nextIndex
}

type SelectionCardLayout = 'vertical' | 'horizontal'
type SelectionCardVariant = 'solid' | 'subtle'

type SelectionCardProps = {
	icon?: ElementType | undefined
	media?: ReactNode
	title: ReactNode
	description?: ReactNode
	selected?: boolean
	disabled?: boolean
	layout?: SelectionCardLayout
	variant?: SelectionCardVariant
	indicator?: 'check' | 'none'
	className?: string
	onClick?: () => void
}

function SelectionCard({
	icon: Icon,
	media,
	title,
	description,
	selected = false,
	disabled = false,
	layout = 'horizontal',
	variant = 'subtle',
	indicator = 'check',
	className,
	onClick,
}: SelectionCardProps) {
	const isVertical = layout === 'vertical'

	const iconContent = media ? (
		media
	) : Icon ? (
		<Icon className={cn('h-5 w-5', isVertical && 'h-4 w-4')} />
	) : null

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-pressed={selected}
			className={cn(
				'group relative flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-150',
				isVertical && 'flex-col justify-center gap-2 py-5 text-center',
				selected && variant === 'solid'
					? 'border-primary bg-primary text-primary-foreground shadow-sm'
					: selected && variant === 'subtle'
						? 'border-primary/60 bg-primary/[0.06] text-foreground shadow-sm'
						: 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-background hover:shadow-sm',
				disabled && 'cursor-not-allowed opacity-50',
				className,
			)}
		>
			{selected && indicator === 'check' ? (
				<span
					className={cn(
						'absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full',
						variant === 'solid'
							? 'bg-primary-foreground text-primary'
							: 'bg-primary text-primary-foreground',
					)}
				>
					<Check className="h-3 w-3" strokeWidth={3} />
				</span>
			) : null}

			{iconContent ? (
				<span
					className={cn(
						'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
						selected
							? variant === 'solid'
								? 'border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground'
								: 'border-primary/30 bg-primary/10 text-primary'
							: 'border-muted-foreground/20 bg-muted/30 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary',
						isVertical && 'h-9 w-9',
					)}
				>
					{iconContent}
				</span>
			) : null}

			<div className={cn('min-w-0', isVertical && 'w-full')}>
				<div
					className={cn(
						'font-semibold leading-snug',
						isVertical ? 'text-sm' : 'text-base',
					)}
				>
					{title}
				</div>
				{description ? (
					<div
						className={cn(
							'mt-0.5 text-sm leading-snug',
							selected && variant === 'solid'
								? 'text-primary-foreground/80'
								: 'text-muted-foreground',
						)}
					>
						{description}
					</div>
				) : null}
			</div>
		</button>
	)
}

type Answers = Record<string, AnswerValue>

type ClientQuestionFlowProps = {
	questions: Question[]
	answers: Answers
	currentQuestionIndex: number
	onAnswersChange: (answers: Answers) => void
	onQuestionIndexChange: (index: number) => void
	onComplete: () => void
}

export function QuestionFlow({
	questions,
	answers,
	currentQuestionIndex,
	onAnswersChange,
	onQuestionIndexChange,
	onComplete,
}: ClientQuestionFlowProps) {
	const [direction, setDirection] = useState(1)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [poppedOption, setPoppedOption] = useState<string | null>(null)
	const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const topRef = useRef<HTMLDivElement>(null)

	const currentQuestion = questions[currentQuestionIndex] ?? questions[0]
	const totalSteps = questions.length
	const currentStepIndex = Math.min(currentQuestionIndex, totalSteps - 1)
	const isLastQuestion = currentStepIndex === totalSteps - 1
	const isFirstQuestion = currentStepIndex === 0
	const currentAnswer = currentQuestion
		? answers[currentQuestion.id]
		: undefined
	const canAdvance = currentAnswer !== undefined && currentAnswer !== null

	useEffect(() => {
		return () => {
			;[autoAdvanceTimer, transitionTimer, completeTimer, popTimer].forEach(
				(ref) => {
					if (ref.current) {
						clearTimeout(ref.current)
						ref.current = null
					}
				},
			)
		}
	}, [])

	const updateAnswers = (updater: (prev: Answers) => Answers) => {
		const next = updater(answers)
		onAnswersChange(next)
	}

	const advance = () => {
		if (currentStepIndex < totalSteps - 1) {
			setDirection(1)
			setIsTransitioning(true)
			if (transitionTimer.current) clearTimeout(transitionTimer.current)
			transitionTimer.current = setTimeout(() => {
				onQuestionIndexChange(currentStepIndex + 1)
				setIsTransitioning(false)
			}, 120)
		}
	}

	const goBack = () => {
		if (currentStepIndex > 0) {
			setDirection(-1)
			onQuestionIndexChange(currentStepIndex - 1)
		}
	}

	const complete = () => {
		setIsTransitioning(true)
		if (completeTimer.current) clearTimeout(completeTimer.current)
		completeTimer.current = setTimeout(() => {
			onComplete()
		}, 100)
	}

	const advanceAfterAnswer = () => {
		if (autoAdvanceTimer.current) {
			clearTimeout(autoAdvanceTimer.current)
		}
		autoAdvanceTimer.current = setTimeout(() => {
			if (isLastQuestion) {
				complete()
			} else {
				advance()
			}
		}, 120)
	}

	const toggleOption = (questionId: string, slug: string) => {
		if (isTransitioning) return

		const question = questions.find((q) => q.id === questionId)
		if (!question) return

		const isMultipleChoice = question.multiple === true
		const previousAnswer = answers[questionId]

		if (!isMultipleChoice) {
			if (previousAnswer === slug) {
				updateAnswers((prev) => {
					const next = { ...prev }
					delete next[questionId]
					return next
				})
				return
			}

			updateAnswers((prev) => ({ ...prev, [questionId]: slug }))
			setPoppedOption(slug)
			if (popTimer.current) clearTimeout(popTimer.current)
			popTimer.current = setTimeout(() => setPoppedOption(null), 100)
			advanceAfterAnswer()
			return
		}

		const existing = Array.isArray(previousAnswer) ? previousAnswer : []
		const isSelected = existing.includes(slug)
		const next = isSelected
			? existing.filter((s) => s !== slug)
			: [...existing, slug]

		updateAnswers((prev) => {
			const updated = { ...prev }
			if (next.length > 0) {
				updated[questionId] = next
			} else {
				delete updated[questionId]
			}
			return updated
		})
	}

	if (!currentQuestion) return null

	return (
		<div className="space-y-6">
			<div ref={topRef} className="scroll-mt-4" />

			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={goBack}
					disabled={isFirstQuestion || isTransitioning}
					className="border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-25"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="sr-only">Previous question</span>
				</button>

				<button
					type="button"
					onClick={isLastQuestion ? complete : advance}
					disabled={!canAdvance || isTransitioning}
					className="border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-25"
				>
					<ArrowRight className="h-4 w-4" />
					<span className="sr-only">
						{isLastQuestion ? 'Finish' : 'Next question'}
					</span>
				</button>
			</div>

			<AnimatePresence mode="wait" custom={direction}>
				<motion.div
					key={currentStepIndex}
					custom={direction}
					initial={{ opacity: 0, x: direction * 24 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: direction * -24 }}
					transition={{ duration: 0.2, ease: 'easeInOut' }}
					className="min-h-[280px] space-y-4"
				>
					<p className="font-medium">{currentQuestion.title}</p>
					<QuestionInput
						question={currentQuestion}
						answer={currentAnswer}
						poppedOption={poppedOption}
						disabled={isTransitioning}
						onToggle={(slug) => toggleOption(currentQuestion.id, slug)}
						onFreeFormChange={(value) =>
							updateAnswers((prev) => ({
								...prev,
								[currentQuestion.id]: value,
							}))
						}
					/>
					{currentQuestion.allowSkip ? (
						<button
							type="button"
							onClick={() => {
								updateAnswers((prev) => ({
									...prev,
									[currentQuestion.id]: null,
								}))
								if (isLastQuestion) {
									complete()
								} else {
									advance()
								}
							}}
							className="text-muted-foreground hover:text-foreground text-xs underline"
						>
							Skip
						</button>
					) : null}
					{currentQuestion.freeForm ? (
						<Button
							onClick={isLastQuestion ? complete : advance}
							disabled={isTransitioning}
							size="lg"
							className={cn(
								'w-full gap-2 rounded-4xl px-8 py-6 text-base transition-all duration-300',
								canAdvance
									? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg'
									: 'bg-muted text-muted-foreground',
							)}
						>
							{isLastQuestion ? 'Finish' : 'Continue'}
							<ArrowRight className="h-5 w-5" />
						</Button>
					) : null}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

function QuestionInput({
	question,
	answer,
	poppedOption,
	disabled,
	onToggle,
	onFreeFormChange,
}: {
	question: Question
	answer: AnswerValue | undefined
	poppedOption: string | null
	disabled: boolean
	onToggle: (slug: string) => void
	onFreeFormChange: (value: string) => void
}) {
	if (question.freeForm) {
		return (
			<Textarea
				value={typeof answer === 'string' ? answer : ''}
				onChange={(event) => onFreeFormChange(event.target.value)}
				placeholder="Share a few details"
				rows={4}
			/>
		)
	}

	const options = questionOptionEntries(question)
	if (options.length === 0) return null

	const isMultiSelect = question.multiple === true
	const selected = Array.isArray(answer) ? answer : []
	const isInvolvementQuestion = question.title
		.toLowerCase()
		.includes('involvement')

	return (
		<div className="space-y-3">
			{options.map(([slug, label], optionIndex) => {
				const isSelected = isMultiSelect
					? selected.includes(slug)
					: answer === slug
				const isPopped = poppedOption === slug
				const OptionIcon = getOptionIcon(question, label)
				const involvementLevel = isInvolvementQuestion
					? getInvolvementLevel(label)
					: null

				return (
					<motion.div
						key={slug}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay: optionIndex * 0.04,
							type: 'spring',
							stiffness: 500,
							damping: 25,
						}}
					>
						<SelectionCard
							title={renderOptionText(label)}
							icon={OptionIcon ?? undefined}
							media={
								involvementLevel ? (
									<motion.span
										animate={isPopped ? { scale: 1.2 } : { scale: 1 }}
										transition={{
											type: 'spring',
											stiffness: 600,
											damping: 12,
										}}
										className="flex h-full w-full items-center justify-center"
									>
										<span className="flex items-end justify-center gap-0.5 pb-1.5">
											{[1, 2, 3].map((bar) => (
												<span
													key={bar}
													className={cn(
														'w-1 rounded-full',
														bar === 1 && 'h-2',
														bar === 2 && 'h-3.5',
														bar === 3 && 'h-5',
														bar <= involvementLevel
															? 'bg-current'
															: 'bg-current/25',
													)}
												/>
											))}
										</span>
									</motion.span>
								) : undefined
							}
							selected={isSelected}
							variant="subtle"
							layout="horizontal"
							indicator="none"
							disabled={disabled}
							onClick={() => onToggle(slug)}
							className="w-full"
						/>
					</motion.div>
				)
			})}
		</div>
	)
}

function getOptionIcon(question: Question, label: string) {
	const prompt = question.title.toLowerCase()
	const text = label.toLowerCase()
	if (text.startsWith('text')) return MessageSquare
	if (text.startsWith('phone')) return Phone
	if (text.startsWith('email')) return Mail
	if (prompt.includes('documents') && text.startsWith('scheduled')) return Phone
	if (prompt.includes('representation') && text.includes('broad')) return Globe
	if (prompt.includes('representation') && text.includes('exclusive'))
		return Lock
	return null
}

function getInvolvementLevel(label: string) {
	const text = label.toLowerCase()
	if (text.includes('very involved')) return 3
	if (
		text.includes('keep me informed') ||
		text.includes('key details') ||
		text.includes('details only')
	)
		return 2
	if (text.includes('hands off')) return 1
	return 1
}

function renderOptionText(label: string) {
	const separator = label.indexOf(' - ')
	if (separator === -1) return label

	return (
		<>
			<span>{label.slice(0, separator)}</span>
			<span className="text-muted-foreground font-normal">
				{' '}
				- {label.slice(separator + 3)}
			</span>
		</>
	)
}
