import { describe, expect, it } from 'vitest'

import {
	getAnswerSummary,
	getMultiSelectSummary,
	isFreeForm,
	isMultiSelect,
	questionOptionLabel,
	questionOptionSlugs,
	type Question,
} from '@/lib/matching/questions'

const sampleQuestion: Question = {
	id: 'preferredContactMethod',
	title: 'Preferred method of communication?',
	options: {
		text: 'Text',
		call: 'Call',
		email: 'Email',
	},
}

const multiQuestion: Question = {
	id: 'bestClientTypes',
	title: 'Where do you do your best work?',
	multiple: true,
	options: {
		firstTime: 'First-time buyers',
		luxury: 'Luxury transactions',
	},
}

const freeFormQuestion: Question = {
	id: 'notFitFor',
	title: 'Who are you NOT the right fit for?',
	freeForm: true,
	options: {},
}

describe('question helpers', () => {
	it('lists option slugs', () => {
		expect(questionOptionSlugs(sampleQuestion)).toEqual([
			'text',
			'call',
			'email',
		])
	})

	it('returns option labels', () => {
		expect(questionOptionLabel(sampleQuestion, 'text')).toBe('Text')
		expect(questionOptionLabel(sampleQuestion, 'missing')).toBe('missing')
	})

	it('summarizes single answers', () => {
		expect(getAnswerSummary(sampleQuestion, 'text')).toBe('Text')
		expect(getAnswerSummary(sampleQuestion, undefined)).toBe('Not answered')
	})

	it('summarizes multi-select answers', () => {
		expect(getAnswerSummary(multiQuestion, ['firstTime', 'luxury'])).toBe(
			'First-time buyers, Luxury transactions',
		)
	})

	it('summarizes free-form answers', () => {
		expect(getAnswerSummary(freeFormQuestion, 'Busy clients')).toBe(
			'Busy clients',
		)
	})

	it('returns multi-select summaries as arrays', () => {
		expect(getMultiSelectSummary(sampleQuestion, 'text')).toEqual(['Text'])
		expect(getMultiSelectSummary(sampleQuestion, ['text', 'call'])).toEqual([
			'Text',
			'Call',
		])
	})

	it('detects question types', () => {
		expect(isMultiSelect(multiQuestion)).toBe(true)
		expect(isMultiSelect(sampleQuestion)).toBe(false)
		expect(isFreeForm(freeFormQuestion)).toBe(true)
		expect(isFreeForm(sampleQuestion)).toBe(false)
	})
})
