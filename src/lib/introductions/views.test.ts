import { describe, expect, test } from 'vitest'

import { COOLDOWN_MS, WITHDRAW_MIN_AGE_MS } from './guards'
import type { Introduction, IntroductionStatus } from './types'
import {
	anonymizeName,
	buildAgentStates,
	toAgentIntroView,
	toClientIntroductionsPayload,
	toClientIntroView,
	type AgentIntroAgentInput,
	type AgentIntroClientInput,
} from './views'

const NOW = new Date('2026-06-01T12:00:00Z')

function timestampsFor(
	status: IntroductionStatus,
	at: Date = NOW,
): Pick<Introduction, 'acceptedAt' | 'connectedAt' | 'closedAt'> {
	switch (status) {
		case 'pending':
			return { acceptedAt: null, connectedAt: null, closedAt: null }
		case 'accepted':
			return { acceptedAt: at, connectedAt: null, closedAt: null }
		case 'connected':
			return { acceptedAt: at, connectedAt: at, closedAt: null }
		case 'declined':
		case 'withdrawn':
			return { acceptedAt: null, connectedAt: null, closedAt: at }
	}
}

function makeIntro(overrides: Partial<Introduction> = {}): Introduction {
	const status = overrides.status ?? 'pending'
	return {
		id: 'intro-1',
		clientProfileId: 'client-1',
		agentProfileId: 'agent-1',
		status,
		...timestampsFor(status),
		createdAt: NOW,
		updatedAt: NOW,
		...overrides,
	}
}

const agentInput: AgentIntroAgentInput = {
	profileId: 'agent-1',
	name: 'Avery Stone',
	contact: {
		email: 'avery@example.com',
		brokerageName: 'Stone Realty',
		licenseNumberState: 'MD 12345',
	},
}

const clientInput: AgentIntroClientInput = {
	fullName: 'Jane Doe',
	email: 'jane@example.com',
	role: 'buyer',
	city: 'Baltimore',
	state: 'MD',
	timeline: 'exploring',
	priceRange: '$400k – $600k',
	propertyTypes: ['singleFamily'],
	workStyle: {
		decisionStyle: 'middleGround',
		contactStyle: 'regularCheckins',
		riskComfort: 'lowRisk',
		commissionPlan: 'discussThenDecide',
		situationSpecialties: [],
	},
	fitScore: 82,
}

describe('anonymizeName', () => {
	test('keeps the first name and initials the last', () => {
		expect(anonymizeName('Jane Doe')).toBe('Jane D.')
		expect(anonymizeName('Jane Mary Doe')).toBe('Jane D.')
	})

	test('handles single names and blanks', () => {
		expect(anonymizeName('Jane')).toBe('Jane')
		expect(anonymizeName('   ')).toBe('')
	})
})

const hiddenStatuses = ['pending', 'accepted', 'declined', 'withdrawn'] as const

describe('toClientIntroView', () => {
	for (const status of hiddenStatuses) {
		test(`${status} view has no agent contact info`, () => {
			const view = toClientIntroView(makeIntro({ status }), agentInput)
			expect(view.agent).not.toHaveProperty('contact')
			expect(JSON.stringify(view)).not.toContain('avery@example.com')
		})
	}

	test('connected view exposes agent contact info', () => {
		const view = toClientIntroView(
			makeIntro({ status: 'connected' }),
			agentInput,
		)
		expect(view.agent.contact).toEqual({
			email: 'avery@example.com',
			brokerageName: 'Stone Realty',
			licenseNumberState: 'MD 12345',
		})
	})

	test('withdrawableAt is 24h after creation', () => {
		const view = toClientIntroView(makeIntro(), agentInput)
		expect(view.withdrawableAt.getTime()).toBe(
			NOW.getTime() + WITHDRAW_MIN_AGE_MS,
		)
	})
})

describe('toAgentIntroView', () => {
	for (const status of hiddenStatuses) {
		test(`${status} view has no client contact info`, () => {
			const view = toAgentIntroView(makeIntro({ status }), clientInput)
			expect(view.client).not.toHaveProperty('contact')
			expect(JSON.stringify(view)).not.toContain('jane@example.com')
			expect(JSON.stringify(view)).not.toContain('Jane Doe')
		})
	}

	test('pre-connected display name is anonymized', () => {
		const view = toAgentIntroView(makeIntro(), clientInput)
		expect(view.client.displayName).toBe('Jane D.')
	})

	test('connected view exposes full name and email', () => {
		const view = toAgentIntroView(
			makeIntro({ status: 'connected' }),
			clientInput,
		)
		expect(view.client.contact).toEqual({
			fullName: 'Jane Doe',
			email: 'jane@example.com',
		})
	})
})

describe('buildAgentStates', () => {
	test('pending and accepted intros map to active', () => {
		expect(
			buildAgentStates(
				[{ agentProfileId: 'a', status: 'pending', closedAt: null }],
				NOW,
			),
		).toEqual([{ agentProfileId: 'a', state: 'active', retryAt: null }])
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'accepted',
						closedAt: null,
					},
				],
				NOW,
			),
		).toEqual([{ agentProfileId: 'a', state: 'active', retryAt: null }])
	})

	test('connected intros map to connected', () => {
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'connected',
						closedAt: null,
					},
				],
				NOW,
			),
		).toEqual([{ agentProfileId: 'a', state: 'connected', retryAt: null }])
	})

	test('recent terminal intros map to cooldown with retryAt', () => {
		const closedAt = new Date(NOW.getTime() - 10 * 86_400_000)
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'declined',
						closedAt: closedAt,
					},
				],
				NOW,
			),
		).toEqual([
			{
				agentProfileId: 'a',
				state: 'cooldown',
				retryAt: new Date(closedAt.getTime() + COOLDOWN_MS),
			},
		])
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'withdrawn',
						closedAt: closedAt,
					},
				],
				NOW,
			),
		).toEqual([
			{
				agentProfileId: 'a',
				state: 'cooldown',
				retryAt: new Date(closedAt.getTime() + COOLDOWN_MS),
			},
		])
	})

	test('terminal intros older than the cooldown map to available', () => {
		const closedAt = new Date(NOW.getTime() - 31 * 86_400_000)
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'declined',
						closedAt: closedAt,
					},
				],
				NOW,
			),
		).toEqual([{ agentProfileId: 'a', state: 'available', retryAt: null }])
	})

	test('active beats cooldown for the same agent', () => {
		const closedAt = new Date(NOW.getTime() - 10 * 86_400_000)
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'declined',
						closedAt: closedAt,
					},
					{ agentProfileId: 'a', status: 'pending', closedAt: null },
				],
				NOW,
			),
		).toEqual([{ agentProfileId: 'a', state: 'active', retryAt: null }])
	})

	test('the latest terminal close drives the cooldown window', () => {
		const older = new Date(NOW.getTime() - 31 * 86_400_000)
		const recent = new Date(NOW.getTime() - 5 * 86_400_000)
		expect(
			buildAgentStates(
				[
					{
						agentProfileId: 'a',
						status: 'declined',
						closedAt: older,
					},
					{
						agentProfileId: 'a',
						status: 'withdrawn',
						closedAt: recent,
					},
				],
				NOW,
			),
		).toEqual([
			{
				agentProfileId: 'a',
				state: 'cooldown',
				retryAt: new Date(recent.getTime() + COOLDOWN_MS),
			},
		])
	})
})

describe('toClientIntroductionsPayload', () => {
	const accepted = toClientIntroView(
		makeIntro({ status: 'accepted' }),
		agentInput,
	)
	const pending = toClientIntroView(makeIntro(), agentInput)

	test('slots and window pass through', () => {
		const payload = toClientIntroductionsPayload({
			introductions: [pending],
			activeCount: 1,
			windowEndsAt: null,
			agentStates: [],
		})
		expect(payload.slots).toEqual({ used: 1, max: 3 })
		expect(payload.window).toEqual({ endsAt: null })
	})

	test('canPurchase requires an accepted intro and no active window', () => {
		expect(
			toClientIntroductionsPayload({
				introductions: [accepted],
				activeCount: 1,
				windowEndsAt: null,
				agentStates: [],
			}).canPurchase,
		).toBe(true)
		expect(
			toClientIntroductionsPayload({
				introductions: [accepted],
				activeCount: 1,
				windowEndsAt: new Date(NOW.getTime() + 86_400_000),
				agentStates: [],
			}).canPurchase,
		).toBe(false)
		expect(
			toClientIntroductionsPayload({
				introductions: [pending],
				activeCount: 1,
				windowEndsAt: null,
				agentStates: [],
			}).canPurchase,
		).toBe(false)
	})
})
