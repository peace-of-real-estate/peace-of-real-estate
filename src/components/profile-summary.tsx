import type { ElementType } from 'react'

import { formatPriceRange, parseSerializedPriceRange } from '@/lib/price-range'
import {
	averageTransactions,
	bestClientType,
	buyerQuestionIds,
	buyerQuestions,
	propertyType,
	getQuestionIcon,
	representationSide,
	sellerQuestionIds,
	sellerQuestions,
	yearsLicensed,
} from '@/lib/profile'
import {
	BriefcaseIcon,
	HouseIcon,
	MoneyIcon,
	ShieldIcon,
	StarIcon,
	UserIcon,
} from '@phosphor-icons/react'

export interface ClientSummaryProfile {
	city?: string | null | undefined
	state?: string | null | undefined
	priceRange?: string | null | undefined
	propertyTypes?: string[] | undefined
	[key: string]: unknown
}

export interface AgentSummaryProfile {
	typicalPriceRange?: string | null | undefined
	representationSide?: string | null | undefined
	zipCodes?: string[] | undefined
	bestClientTypes?: string[] | undefined
	yearsLicensed?: string | null | undefined
	averageTransactions?: string | null | undefined
	eoInsuranceStatus?: string | null | undefined
}

export type SummaryRole = 'buyer' | 'seller' | 'agent'

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
	| { role: 'buyer'; profile: ClientSummaryProfile | null | undefined }
	| { role: 'seller'; profile: ClientSummaryProfile | null | undefined }
	| { role: 'agent'; profile: AgentSummaryProfile | null | undefined }

export function getProfileSummary(input: ProfileSummaryInput): SummaryItem[] {
	const { role, profile } = input
	if (!profile) return []

	switch (role) {
		case 'agent':
			return getAgentSummaryItems(profile)
		case 'buyer':
		case 'seller':
			return getClientSummaryItems(role, profile)
	}
}

function getClientSummaryItems(
	role: 'buyer' | 'seller',
	profile: ClientSummaryProfile,
): SummaryItem[] {
	const priceRange = parseSerializedPriceRange(profile.priceRange)
	const items: (SummaryItem | null | undefined)[] = [
		priceRange
			? {
					label: 'Budget',
					value: formatPriceRange(priceRange),
					icon: MoneyIcon,
				}
			: null,
		profile.propertyTypes?.length
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
	const typicalPriceRange = parseSerializedPriceRange(profile.typicalPriceRange)
	const items: (SummaryItem | null | undefined)[] = [
		typicalPriceRange
			? {
					label: 'Typical price range',
					value: formatPriceRange(typicalPriceRange),
					icon: MoneyIcon,
				}
			: null,
		profile.representationSide
			? {
					label: 'Representation',
					value: getEnumLabel(
						representationSide.labels,
						profile.representationSide,
					),
					icon: BriefcaseIcon,
				}
			: null,
		profile.zipCodes?.length
			? {
					label: 'Service areas',
					value: profile.zipCodes.slice(0, 3).join(', '),
					icon: BriefcaseIcon,
				}
			: null,
		profile.bestClientTypes?.length
			? {
					label: 'Best clients',
					value: profile.bestClientTypes
						.map((slug) => getEnumLabel(bestClientType.labels, slug))
						.join(', '),
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
		profile.averageTransactions
			? {
					label: 'Transaction volume',
					value: getEnumLabel(
						averageTransactions.labels,
						profile.averageTransactions,
					),
					icon: HouseIcon,
				}
			: null,
		profile.eoInsuranceStatus
			? {
					label: 'E&O insurance',
					value: profile.eoInsuranceStatus,
					icon: ShieldIcon,
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
