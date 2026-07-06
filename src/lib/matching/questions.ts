import { z } from 'zod'

export type Question = {
	id: string
	title: string
	options: Record<string, string>
	multiple?: boolean
	freeForm?: boolean
	allowSkip?: boolean
}

export type AnswerValue = string | string[] | null

export type Answers = Record<string, AnswerValue>

export const answerValueSchema: z.ZodType<AnswerValue> = z.union([
	z.string(),
	z.array(z.string()),
	z.null(),
])

export const answersSchema: z.ZodType<Answers> = z.record(
	z.string(),
	answerValueSchema,
)

export type QuestionFlow = {
	label: string
	questions: Question[]
}

export function questionOptionEntries(question: Question): [string, string][] {
	return Object.entries(question.options)
}

export function questionOptionSlugs(question: Question): string[] {
	return Object.keys(question.options)
}

export function questionOptionLabel(question: Question, slug: string): string {
	return question.options[slug] ?? slug
}

export function getAnswerSummary(
	question: Question,
	answer: AnswerValue | undefined,
): string {
	if (answer === undefined || answer === '' || answer === null) {
		return 'Not answered'
	}

	if (question.freeForm && typeof answer === 'string') {
		return answer.trim() || 'Not answered'
	}

	if (Array.isArray(answer)) {
		const labels = answer.map((slug) => question.options[slug]).filter(Boolean)
		return labels.length > 0 ? labels.join(', ') : 'Not answered'
	}

	return question.options[answer] ?? 'Not answered'
}

export function getMultiSelectSummary(
	question: Question,
	answer: AnswerValue | undefined,
): string[] {
	if (answer === undefined || answer === null) return []
	if (Array.isArray(answer)) {
		return answer
			.map((slug) => question.options[slug])
			.filter((label): label is string => typeof label === 'string')
	}
	const label = question.options[answer]
	return label ? [label] : []
}

export function isMultiSelect(question: Question): boolean {
	return question.multiple === true
}

export function isFreeForm(question: Question): boolean {
	return question.freeForm === true
}

export function hasOptions(question: Question): boolean {
	return Object.keys(question.options).length > 0
}

export const clientAnswerLabels: Record<
	string,
	{ title: string; label: string; options: Record<string, string> }
> = {
	preferredContactMethod: {
		title: 'Preferred method of communication?',
		label: 'Communication',
		options: {
			text: 'Text',
			call: 'Call',
			email: 'Email',
		},
	},
	involvementLevel: {
		title: 'Involvement level?',
		label: 'Involvement',
		options: {
			veryInvolved: 'Very involved',
			keyDetails: 'Key details only',
			handsOff: 'Mostly hands off',
		},
	},
	representationPreference: {
		title: 'When it comes to choosing an agent, which matters more to you?',
		label: 'Exclusivity',
		options: {
			access: 'More access and connections',
			exclusive: 'Exclusive representation',
		},
	},
	commissionComfort: {
		title: 'How do you plan to handle commissions with your agent?',
		label: 'Negotiation',
		options: {
			negotiate: "I'm comfortable negotiating",
			explain: "I'm new, explain it to me",
		},
	},
	experienceLevel: {
		title: 'How familiar does this process feel?',
		label: 'Experience',
		options: {
			firstTime: "First time; I'll want guidance",
			experienced: "I've done this before, but want help staying on track",
			veryExperienced: 'I know the process and want a strong operator',
		},
	},
}

export const bestClientTypeLabels: Record<string, string> = {
	firstTime: 'First-time buyers who need guidance through the entire process',
	moveUp: 'Move-up or downsizing buyers navigating a transition',
	relocation: 'Relocation clients on tight timelines',
	luxury: 'Luxury transactions with high-touch expectations',
	investor: 'Investors focused on numbers and execution',
	landMultiFamily: 'Land or multi-family transactions',
	seller: 'Sellers and listings',
	condoTownhome: 'Condos and townhomes',
	other: 'Other',
}

export const propertyTypeOptions = {
	singleFamily: 'Single-Family',
	condoTownhome: 'Condo/Townhome',
	multiFamily: 'Multi-family',
	land: 'Land',
} as const
