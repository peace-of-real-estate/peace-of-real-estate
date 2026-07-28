import {
	BriefcaseIcon,
	HouseIcon,
	MoneyIcon,
	StarIcon,
	UserIcon,
} from '@phosphor-icons/react'
import type { ElementType } from 'react'

import {
	AGENT_PRICE_BUCKET_LABELS,
	formatPriceRange,
	type AgentPriceBucket,
} from '@/lib/price-range'
import {
	bestClientType,
	buyerQuestionIds,
	buyerQuestions,
	propertyType,
	getQuestionIcon,
	representationSide,
	sellerQuestionIds,
	sellerQuestions,
	yearsLicensed,
	type BestClientTypeSlug,
	type ClientRole,
	type PropertyTypeSlug,
	type RepresentationSide,
	type YearsLicensed,
} from '@/lib/profile'

export interface ClientSummaryProfile {
	priceMin: number
	priceMax: number
	propertyTypes: PropertyTypeSlug[]
	[key: string]: unknown
}

export interface AgentSummaryProfile {
	typicalPriceRange: AgentPriceBucket
	representationSide: RepresentationSide
	zipCodes: string[]
	bestClientType: BestClientTypeSlug
	yearsLicensed?: YearsLicensed | null | undefined
}

export type SummaryItem = {
	label: string
	value: string
	icon: ElementType
}

function getEnumLabel(
	labels: Readonly<Record<string, string>>,
	key: string,
): string {
	return labels[key] ?? key
}

export type ProfileSummaryInput =
	| { role: 'buyer'; profile: ClientSummaryProfile }
	| { role: 'seller'; profile: ClientSummaryProfile }
	| { role: 'agent'; profile: AgentSummaryProfile }

export function getProfileSummary(input: ProfileSummaryInput): SummaryItem[] {
	const { role, profile } = input

	switch (role) {
		case 'agent':
			return getAgentSummaryItems(profile)
		case 'buyer':
		case 'seller':
			return getClientSummaryItems(role, profile)
	}
}

function getClientSummaryItems(
	role: ClientRole,
	profile: ClientSummaryProfile,
): SummaryItem[] {
	const items: (SummaryItem | null | undefined)[] = [
		{
			label: 'Budget',
			value: formatPriceRange({
				min: profile.priceMin,
				max: profile.priceMax,
			}),
			icon: MoneyIcon,
		},
		profile.propertyTypes.length
			? {
					label: 'Home Type',
					value: profile.propertyTypes
						.map((type) => getEnumLabel(propertyType.labels, type))
						.join(', '),
					icon: HouseIcon,
				}
			: null,
	]

	const answerItems =
		role === 'buyer'
			? getBuyerAnswerSummaryItems(profile)
			: getSellerAnswerSummaryItems(profile)

	for (const item of answerItems) {
		if (item) items.push(item)
	}

	const result: SummaryItem[] = []
	for (const item of items) {
		if (item !== null && item !== undefined) {
			result.push(item)
		}
	}
	return result
}

function getBuyerAnswerSummaryItems(
	profile: ClientSummaryProfile,
): SummaryItem[] {
	const items: SummaryItem[] = []
	for (const id of buyerQuestionIds) {
		const answer = getAnswer(profile, id)
		const item = formatQuestionSummary(buyerQuestions[id], answer)
		if (item) items.push(item)
	}
	return items
}

function getSellerAnswerSummaryItems(
	profile: ClientSummaryProfile,
): SummaryItem[] {
	const items: SummaryItem[] = []
	for (const id of sellerQuestionIds) {
		const answer = getAnswer(profile, id)
		const item = formatQuestionSummary(sellerQuestions[id], answer)
		if (item) items.push(item)
	}
	return items
}

function getAnswer(
	profile: ClientSummaryProfile,
	id: string,
): string | string[] | null | undefined {
	const value = profile[id]
	if (
		typeof value === 'string' ||
		Array.isArray(value) ||
		value === null ||
		value === undefined
	) {
		return value
	}
	return undefined
}

type SummaryQuestion =
	| {
			kind: 'single'
			id: string
			label: string
			options: {
				slugs: readonly string[]
				labels: Readonly<Record<string, string>>
			}
	  }
	| {
			kind: 'multi'
			id: string
			label: string
			options: {
				slugs: readonly string[]
				labels: Readonly<Record<string, string>>
			}
	  }
	| { kind: 'freeForm'; id: string; label: string }

function formatQuestionSummary(
	question: SummaryQuestion,
	answer: string | string[] | null | undefined,
): SummaryItem | null {
	if (answer === null || answer === undefined) return null

	const icon = getQuestionIcon(question.id)

	switch (question.kind) {
		case 'single': {
			const slug = question.options.slugs.find((slug) => slug === answer)
			if (slug === undefined) return null
			const value = question.options.labels[slug]
			return value ? { label: question.label, value, icon } : null
		}
		case 'multi': {
			const selected = question.options.slugs.filter((slug) =>
				answer.includes(slug),
			)
			const value = selected
				.map((slug) => question.options.labels[slug])
				.join(', ')
			return value ? { label: question.label, value, icon } : null
		}
		case 'freeForm': {
			return null
		}
	}
}

function getAgentSummaryItems(profile: AgentSummaryProfile): SummaryItem[] {
	const items: (SummaryItem | null | undefined)[] = [
		{
			label: 'Typical price range',
			value: AGENT_PRICE_BUCKET_LABELS[profile.typicalPriceRange],
			icon: MoneyIcon,
		},
		{
			label: 'Representation',
			value: getEnumLabel(
				representationSide.labels,
				profile.representationSide,
			),
			icon: BriefcaseIcon,
		},
		profile.zipCodes.length
			? {
					label: 'Service areas',
					value: profile.zipCodes.slice(0, 3).join(', '),
					icon: BriefcaseIcon,
				}
			: null,
		profile.bestClientType
			? {
					label: 'Best clients',
					value: getEnumLabel(bestClientType.labels, profile.bestClientType),
					icon: UserIcon,
				}
			: null,
		profile.yearsLicensed
			? {
					label: 'Experience',
					value: getEnumLabel(yearsLicensed.labels, profile.yearsLicensed),
					icon: StarIcon,
				}
			: null,
	]

	const result: SummaryItem[] = []
	for (const item of items) {
		if (item !== null && item !== undefined) {
			result.push(item)
		}
	}
	return result
}

export function ProfileSummaryGrid({
	items,
	variant = 'preview',
}: {
	items: SummaryItem[]
	variant?: 'preview' | 'dashboard'
}) {
	const gridClass =
		variant === 'dashboard'
			? 'grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3'
			: 'grid grid-cols-1 gap-3 sm:grid-cols-2'

	const iconContainerClass = 'text-muted-foreground mt-0.5 flex shrink-0'

	const iconSize = 'h-4 w-4'

	const labelClass =
		'text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase'

	const valueClass =
		variant === 'dashboard'
			? 'truncate text-sm font-semibold'
			: 'text-foreground text-sm font-semibold'

	const itemClass =
		variant === 'dashboard'
			? 'flex min-w-0 items-start gap-3'
			: 'flex items-start gap-3'

	const innerClass = variant === 'dashboard' ? 'min-w-0' : 'min-w-0 flex-1'

	return (
		<div className={gridClass}>
			{items.map((item) => {
				const Icon = item.icon
				return (
					<div key={item.label} className={itemClass}>
						<div className={iconContainerClass}>
							<Icon className={iconSize} />
						</div>
						<div className={innerClass}>
							<p className={labelClass}>{item.label}</p>
							<p className={valueClass}>{item.value}</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}
