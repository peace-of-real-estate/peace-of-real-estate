import * as z from 'zod/mini'

import type {
	agentProfiles,
	buyerDetails,
	clientProfiles,
	sellerDetails,
} from '@/db/schema'
import type { ResolvedCity, ZipGeography } from '@/lib/geography/zip'
import { agentPriceBucketSchema, priceBoundSchema } from '@/lib/price-range'
import {
	agentQuestionIds,
	agentQuestions,
	buyerQuestions,
	enjoyedClientType,
	profileStatus,
	propertyType,
	representationSide,
	sellerQuestions,
	specialty,
	timeline,
	yearsLicensed,
} from '@/lib/profile/profile-fields'
import type {
	EnumDef,
	MultiQuestion,
	PreferencesFor,
	SingleQuestion,
} from '@/lib/profile/question-types'

// ===== Client-safe schema derivation =====
// This module must stay drizzle-free at runtime: pg-core table objects and
// classic zod (via drizzle-orm/zod) are server-only bundle weight. Schemas
// derive from the same profile-fields root the DB columns derive from;
// insert-schemas.server.ts re-derives the classic insert schemas from the
// tables, and schema-parity.unit.test.ts pins the two derivations together.

type Question = SingleQuestion<string, string> | MultiQuestion<string, string>

function enumSchema<TSlug extends string>(def: EnumDef<TSlug>) {
	return z.enum(def.slugs)
}

function questionSchema<TSlug extends string>(
	question: SingleQuestion<string, TSlug>,
) {
	return z.enum(question.options.slugs)
}

function multiQuestionSchema<TSlug extends string>(
	question: MultiQuestion<string, TSlug>,
) {
	return z.array(z.enum(question.options.slugs))
}

type QuestionSchema<TQuestion extends Question> =
	TQuestion extends MultiQuestion<string, infer TSlug>
		? ReturnType<typeof multiQuestionSchema<TSlug>>
		: TQuestion extends SingleQuestion<string, infer TSlug>
			? ReturnType<typeof questionSchema<TSlug>>
			: never

type QuestionFields<TQuestions extends Record<string, Question>> = {
	[K in keyof TQuestions]: QuestionSchema<TQuestions[K]>
}

function fieldsFromQuestions<const TQuestions extends Record<string, Question>>(
	questions: TQuestions,
): QuestionFields<TQuestions> {
	// fromEntries loses key/value correlation; the annotation restores what the
	// question record guarantees (same pattern as questionRecord).
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return Object.fromEntries(
		Object.entries(questions).map(([id, question]) => [
			id,
			question.kind === 'multi'
				? multiQuestionSchema(question)
				: questionSchema(question),
		]),
	) as QuestionFields<TQuestions>
}

const zipCodesField = z._default(z.array(z.string()), [])

const clientProfileFields = {
	status: z.optional(enumSchema(profileStatus)),
	cityId: z.uuid(),
	timeline: enumSchema(timeline),
	priceMin: priceBoundSchema,
	priceMax: priceBoundSchema,
	propertyTypes: z.array(enumSchema(propertyType)),
	zipCodes: zipCodesField,
}

// situationSpecialties/enjoyedClients/specialties columns carry a DB default,
// so drizzle-zod marks them optional in the insert schemas — mirrored here via
// extend-overrides to keep parity (see schema-parity.unit.test.ts).
const optionalSpecialtiesField = z.optional(z.array(enumSchema(specialty)))

const buyerSchema = z.extend(
	z.object({
		...clientProfileFields,
		...fieldsFromQuestions(buyerQuestions),
	}),
	{ situationSpecialties: optionalSpecialtiesField },
)

const sellerSchema = z.extend(
	z.object({
		...clientProfileFields,
		...fieldsFromQuestions(sellerQuestions),
	}),
	{ situationSpecialties: optionalSpecialtiesField },
)

const agentSchema = z.extend(
	z.object({
		representationSide: enumSchema(representationSide),
		cityId: z.uuid(),
		typicalPriceRange: agentPriceBucketSchema,
		brokerageName: z.string(),
		licenseNumberState: z.string(),
		yearsLicensed: z.optional(z.nullable(enumSchema(yearsLicensed))),
		...fieldsFromQuestions(agentQuestions),
		zipCodes: zipCodesField,
	}),
	{
		enjoyedClients: z.optional(z.array(enumSchema(enjoyedClientType))),
		specialties: optionalSpecialtiesField,
	},
)

export const buyerDraftSchema = z.partial(buyerSchema)
export const sellerDraftSchema = z.partial(sellerSchema)
export const agentDraftSchema = z.partial(agentSchema)

const buyerCompletedBaseSchema = z.omit(buyerSchema, { status: true })
const sellerCompletedBaseSchema = z.omit(sellerSchema, { status: true })

function hasOrderedPriceRange({
	priceMin,
	priceMax,
}: {
	priceMin: number
	priceMax: number
}) {
	return priceMin <= priceMax
}

export const buyerCompletedDraftSchema = buyerCompletedBaseSchema.check(
	z.refine(hasOrderedPriceRange),
)
export const sellerCompletedDraftSchema = sellerCompletedBaseSchema.check(
	z.refine(hasOrderedPriceRange),
)
export const agentCompletedDraftSchema = agentSchema

type ResolvedGeography = {
	city: ResolvedCity
	geography: ZipGeography
}

export type ClientRole = (typeof representationSide.slugs)[number]

export type ProfileRole = ClientRole | 'agent'

export const dashboardPaths = {
	agent: '/agent/introductions',
	buyer: '/buyer/matches',
	seller: '/seller/matches',
} as const satisfies Record<ProfileRole, string>

export function resolveDashboardTarget(roles: ProfileRole[]): string {
	const [first] = roles
	if (!first) return '/signup/buyer'
	if (roles.length > 1) return '/choose-role'
	return dashboardPaths[first]
}

type ClientProfileBase = Omit<
	(typeof clientProfiles)['$inferSelect'],
	'role' | 'cityId'
>

export type BuyerProfile = ClientProfileBase &
	Omit<(typeof buyerDetails)['$inferSelect'], 'clientProfileId' | 'role'> &
	ResolvedGeography & { role: 'buyer' }

export type SellerProfile = ClientProfileBase &
	Omit<(typeof sellerDetails)['$inferSelect'], 'clientProfileId' | 'role'> &
	ResolvedGeography & { role: 'seller' }

export type AgentProfile = Omit<
	(typeof agentProfiles)['$inferSelect'],
	'cityId'
> &
	ResolvedGeography

export type ClientProfile = BuyerProfile | SellerProfile

export type ClientWorkStyle = Pick<
	ClientProfile,
	| 'decisionStyle'
	| 'contactStyle'
	| 'riskComfort'
	| 'commissionPlan'
	| 'situationSpecialties'
>

export type BuyerDraft = z.infer<typeof buyerDraftSchema>

export type SellerDraft = z.infer<typeof sellerDraftSchema>

export type AgentDraft = z.infer<typeof agentDraftSchema>

export type AgentWorkStyle = PreferencesFor<AgentDraft, typeof agentQuestionIds>

const previewPropertyTypesSchema = z
	.array(enumSchema(propertyType))
	.check(z.minLength(1))

export const buyerPreviewProfileSchema = z
	.extend(buyerCompletedBaseSchema, {
		role: z.literal('buyer'),
		propertyTypes: previewPropertyTypesSchema,
	})
	.check(z.refine(hasOrderedPriceRange))

export const sellerPreviewProfileSchema = z
	.extend(sellerCompletedBaseSchema, {
		role: z.literal('seller'),
		propertyTypes: previewPropertyTypesSchema,
	})
	.check(z.refine(hasOrderedPriceRange))

export const agentPreviewProfileSchema = z.extend(agentSchema, {
	zipCodes: z.array(z.string()),
})

export type BuyerPreviewProfile = z.infer<typeof buyerPreviewProfileSchema>

export type SellerPreviewProfile = z.infer<typeof sellerPreviewProfileSchema>

export type AgentPreviewProfile = z.infer<typeof agentPreviewProfileSchema>

export type ClientPreviewProfile = BuyerPreviewProfile | SellerPreviewProfile
