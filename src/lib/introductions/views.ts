import type { ClientWorkStyle } from '@/lib/profile/types'

import { COOLDOWN_MS, MAX_ACTIVE_INTROS, WITHDRAW_MIN_AGE_MS } from './guards'
import { decodeData } from './intro-data'
import type { ClientRole, Introduction } from './types'

/** Client's view of an agent. contact is present ⟺ status === 'connected' */
export type ClientIntroView = Pick<
	Introduction,
	'id' | 'status' | 'createdAt'
> & {
	acceptedAt: Date | null
	withdrawableAt: Date
	agent: {
		profileId: string
		name: string
		contact?: {
			email: string
			phone: string | null
			brokerageName: string
			licenseNumberState: string
			businessAddress: string | null
		}
	}
}

export type AgentState = 'available' | 'active' | 'connected' | 'cooldown'

export type ClientIntroductionsPayload = {
	introductions: ClientIntroView[]
	slots: { used: number; max: number }
	window: { endsAt: Date | null }
	canPurchase: boolean
	agentStates: Array<{
		agentProfileId: string
		state: AgentState
		retryAt: Date | null
	}>
}

/** Agent's view of a client. contact is present ⟺ status === 'connected' */
export type AgentIntroView = Pick<
	Introduction,
	'id' | 'status' | 'createdAt'
> & {
	client: {
		displayName: string
		role: ClientRole
		city: string
		state: string
		timeline: string
		priceRange: string
		propertyTypes: string[]
		workStyle: ClientWorkStyle
		fitScore: number
		contact?: { fullName: string; email: string }
	}
}

export type AgentIntroAgentInput = {
	profileId: string
	name: string
	contact: {
		email: string
		phone: string | null
		brokerageName: string
		licenseNumberState: string
		businessAddress: string | null
	}
}

export type AgentIntroClientInput = {
	fullName: string
	email: string
	role: ClientRole
	city: string
	state: string
	timeline: string
	priceRange: string
	propertyTypes: string[]
	workStyle: ClientWorkStyle
	fitScore: number
}

export function anonymizeName(fullName: string): string {
	const parts = fullName.trim().split(/\s+/).filter(Boolean)
	const first = parts[0]
	const last = parts.length > 1 ? parts[parts.length - 1] : undefined
	if (!first) return ''
	if (!last) return first
	return `${first} ${last.charAt(0)}.`
}

export function agentDisplayName(agent: {
	firstName: string
	lastName: string
}): string {
	return `${agent.firstName} ${agent.lastName}`
}

export function toClientIntroView(
	intro: Pick<Introduction, 'id' | 'status' | 'createdAt' | 'data'>,
	agent: AgentIntroAgentInput,
): ClientIntroView {
	const { acceptedAt } = decodeData(intro.status, intro.data)
	return {
		id: intro.id,
		status: intro.status,
		createdAt: intro.createdAt,
		acceptedAt,
		withdrawableAt: new Date(intro.createdAt.getTime() + WITHDRAW_MIN_AGE_MS),
		agent: {
			profileId: agent.profileId,
			name: agent.name,
			...(intro.status === 'connected' ? { contact: agent.contact } : {}),
		},
	}
}

export function toAgentIntroView(
	intro: Pick<Introduction, 'id' | 'status' | 'createdAt'>,
	client: AgentIntroClientInput,
): AgentIntroView {
	return {
		id: intro.id,
		status: intro.status,
		createdAt: intro.createdAt,
		client: {
			displayName: anonymizeName(client.fullName),
			role: client.role,
			city: client.city,
			state: client.state,
			timeline: client.timeline,
			priceRange: client.priceRange,
			propertyTypes: client.propertyTypes,
			workStyle: client.workStyle,
			fitScore: client.fitScore,
			...(intro.status === 'connected'
				? { contact: { fullName: client.fullName, email: client.email } }
				: {}),
		},
	}
}

export function buildAgentStates(
	intros: Pick<Introduction, 'agentProfileId' | 'status' | 'data'>[],
	now: Date,
): ClientIntroductionsPayload['agentStates'] {
	const byAgent = new Map<
		string,
		Pick<Introduction, 'agentProfileId' | 'status' | 'data'>[]
	>()
	for (const intro of intros) {
		const rows = byAgent.get(intro.agentProfileId)
		if (rows) rows.push(intro)
		else byAgent.set(intro.agentProfileId, [intro])
	}

	return [...byAgent.entries()].map(([agentProfileId, rows]) => {
		if (
			rows.some((row) => row.status === 'pending' || row.status === 'accepted')
		) {
			return { agentProfileId, state: 'active' as const, retryAt: null }
		}
		if (rows.some((row) => row.status === 'connected')) {
			return { agentProfileId, state: 'connected' as const, retryAt: null }
		}
		let latest: Date | undefined
		for (const row of rows) {
			if (row.status !== 'declined' && row.status !== 'withdrawn') {
				continue
			}
			const { closedAt } = decodeData(row.status, row.data)
			if (closedAt !== null && (latest === undefined || closedAt > latest)) {
				latest = closedAt
			}
		}
		if (latest) {
			const retryAt = new Date(latest.getTime() + COOLDOWN_MS)
			if (retryAt > now) {
				return { agentProfileId, state: 'cooldown' as const, retryAt }
			}
		}
		return { agentProfileId, state: 'available' as const, retryAt: null }
	})
}

export function toClientIntroductionsPayload(input: {
	introductions: ClientIntroView[]
	activeCount: number
	windowEndsAt: Date | null
	agentStates: ClientIntroductionsPayload['agentStates']
}): ClientIntroductionsPayload {
	return {
		introductions: input.introductions,
		slots: { used: input.activeCount, max: MAX_ACTIVE_INTROS },
		window: { endsAt: input.windowEndsAt },
		canPurchase:
			input.windowEndsAt === null &&
			input.introductions.some((intro) => intro.status === 'accepted'),
		agentStates: input.agentStates,
	}
}
