import { CalendarBlankIcon, ClockIcon } from '@phosphor-icons/react'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { AnimatedStepCard } from '@/components/signup/shared'
import { FieldSection } from '@/components/signup/field-section'
import { SelectionCard } from '@/components/signup/selection-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils/ui'
import type { ConsumerDraft, RepresentationSide } from '@/lib/matching/profile'
import { StepHeader } from '@/components/signup/step-header'
import {
	consumerConfig,
	getIntentIcon,
	getIntentLabel,
	timelineOptions,
} from './shared'

export function ConsumerSituation({
	state,
	onUpdate,
	onContinue,
}: {
	state: ConsumerDraft
	onUpdate: (patch: Partial<ConsumerDraft>) => void
	onContinue: () => void
}) {
	const [intent, setIntent] = useState<RepresentationSide | ''>(
		state.intent ?? '',
	)
	const [hasDeadline, setHasDeadline] = useState(
		state.timeline ? state.timeline !== 'exploring' : false,
	)
	const deadlineOptions = timelineOptions.filter(
		(option) => option.slug !== 'exploring',
	)
	const [deadlineIndex, setDeadlineIndex] = useState(() => {
		if (!state.timeline || state.timeline === 'exploring') return 0
		const index = deadlineOptions.findIndex(
			(option) => option.slug === state.timeline,
		)
		return Math.max(index, 0)
	})
	const timeline = hasDeadline
		? deadlineOptions[deadlineIndex]!.slug
		: 'exploring'
	const intentComplete = intent.length > 0
	const canContinue = intentComplete

	const handleContinue = () => {
		if (!canContinue || !intent) return
		onUpdate({ intent, timeline })
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="intro">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={1}
						totalSteps={4}
						title="Situation"
						icon={ClockIcon}
					/>

					<div className="space-y-8">
						<FieldSection
							title="Your move"
							description="Choose how you want to use the property."
							icon={ClockIcon}
						>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{consumerConfig.intentOptions.map((option) => {
									const isSelected = intent === option
									const IntentIcon = getIntentIcon(option)
									const label = getIntentLabel(option)

									return (
										<SelectionCard
											key={option}
											icon={IntentIcon}
											title={label}
											selected={isSelected}
											variant="solid"
											layout="vertical"
											onClick={() => setIntent(option)}
										/>
									)
								})}
							</div>
						</FieldSection>

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
								<div className="space-y-1">
									<Slider
										value={[deadlineIndex]}
										min={0}
										max={deadlineOptions.length - 1}
										step={1}
										onValueChange={([index]) => setDeadlineIndex(index ?? 0)}
										disabled={!hasDeadline}
									/>
									<div className="text-muted-foreground flex justify-between px-1">
										{deadlineOptions.map((option, index) => (
											<span
												key={option.slug}
												className={cn(
													'h-2 w-0.5 rounded-full transition-colors',
													index === deadlineIndex && hasDeadline
														? 'bg-primary'
														: 'bg-muted',
												)}
											/>
										))}
									</div>
								</div>
								<div className="text-muted-foreground flex justify-between text-xs font-medium">
									<span>{deadlineOptions[0]!.label}</span>
									<span>
										{deadlineOptions[deadlineOptions.length - 1]!.label}
									</span>
								</div>
							</div>
						</FieldSection>
					</div>

					<div>
						<Button
							onClick={handleContinue}
							disabled={!canContinue}
							size="lg"
							className={cn(
								'w-full gap-2 rounded-4xl px-8 py-6 text-base transition-all duration-300',
								canContinue
									? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg'
									: 'bg-muted text-muted-foreground',
							)}
						>
							Continue
							<ArrowRight className="h-5 w-5" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
