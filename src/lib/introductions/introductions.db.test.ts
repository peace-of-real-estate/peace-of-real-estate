import {
	daysAgo,
	hoursAgo,
	makeAccessWindow,
	makeIntroduction,
	seedAgent,
	seedClient,
} from '@tests/support/fixtures/data/introductions'
import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'
import { geoOf } from '@tests/support/fixtures/geography'
import { eq } from 'drizzle-orm'

import { introAccessWindows, introductions } from '@/db/schema'
import { Agent, Client } from '@/lib/introductions/db'

async function getIntro(db: Database, id: string) {
	const [row] = await db
		.select()
		.from(introductions)
		.where(eq(introductions.id, id))
		.limit(1)
	return row
}

async function seedWithdrawnHistory(
	db: Database,
	clientProfileId: string,
	count: number,
	createdAt: Date,
): Promise<void> {
	for (let index = 0; index < count; index++) {
		const agent = await seedAgent(db)
		await db.insert(introductions).values(
			makeIntroduction({
				clientProfileId,
				agentProfileId: agent.profile.id,
				overrides: {
					status: 'withdrawn',
					createdAt,
					closedAt: createdAt,
				},
			}),
		)
	}
}

describe('sendIntroductions guards', () => {
	test('allows exactly 3 active intros', async ({ db }) => {
		const client = await seedClient(db)
		const agents = await Promise.all([
			seedAgent(db),
			seedAgent(db),
			seedAgent(db),
		])
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: agents.map((agent) => agent.profile.id),
		})
		expect(result).toMatchObject({ ok: true })
		if (result.ok) expect(result.ids).toHaveLength(3)
	})

	test('rejects a single send of 4 agents', async ({ db }) => {
		const client = await seedClient(db)
		const agents = await Promise.all([
			seedAgent(db),
			seedAgent(db),
			seedAgent(db),
			seedAgent(db),
		])
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: agents.map((agent) => agent.profile.id),
		})
		expect(result).toMatchObject({ ok: false, error: { code: 'SLOT_CAP' } })
	})

	test('rejects a send that would exceed 3 active intros', async ({ db }) => {
		const client = await seedClient(db)
		const first = await Promise.all([
			seedAgent(db),
			seedAgent(db),
			seedAgent(db),
		])
		await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: first.map((agent) => agent.profile.id),
		})
		const fourth = await seedAgent(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [fourth.profile.id],
		})
		expect(result).toMatchObject({ ok: false, error: { code: 'SLOT_CAP' } })
	})

	test('allows the 10th send within 30 days', async ({ db }) => {
		const client = await seedClient(db)
		await seedWithdrawnHistory(db, client.profile.id, 9, daysAgo(1))
		const agent = await seedAgent(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({ ok: true })
	})

	test('rejects the 11th send within 30 days', async ({ db }) => {
		const client = await seedClient(db)
		await seedWithdrawnHistory(db, client.profile.id, 10, daysAgo(1))
		const agent = await seedAgent(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({ ok: false, error: { code: 'VELOCITY' } })
	})

	test('rejects a batch that would exceed 10 sends within 30 days', async ({
		db,
	}) => {
		const client = await seedClient(db)
		await seedWithdrawnHistory(db, client.profile.id, 9, daysAgo(1))
		const agents = await Promise.all([seedAgent(db), seedAgent(db)])
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: agents.map((agent) => agent.profile.id),
		})
		expect(result).toMatchObject({ ok: false, error: { code: 'VELOCITY' } })
	})

	test('ignores sends older than 30 days for velocity', async ({ db }) => {
		const client = await seedClient(db)
		await seedWithdrawnHistory(db, client.profile.id, 10, daysAgo(31))
		const agent = await seedAgent(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({ ok: true })
	})

	test('blocks re-send 29 days after a decline', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const closedAt = daysAgo(29)
		await db.insert(introductions).values(
			makeIntroduction({
				clientProfileId: client.profile.id,
				agentProfileId: agent.profile.id,
				overrides: {
					status: 'declined',
					createdAt: closedAt,
					closedAt: closedAt,
				},
			}),
		)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({ ok: false, error: { code: 'COOLDOWN' } })
	})

	test('allows re-send 30 days after a decline', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const closedAt = daysAgo(30)
		await db.insert(introductions).values(
			makeIntroduction({
				clientProfileId: client.profile.id,
				agentProfileId: agent.profile.id,
				overrides: {
					status: 'declined',
					createdAt: closedAt,
					closedAt: closedAt,
				},
			}),
		)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({ ok: true })
	})

	test('rejects a draft profile', async ({ db }) => {
		const client = await seedClient(db, { status: 'draft' })
		const agent = await seedAgent(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'PROFILE_INCOMPLETE' },
		})
	})

	test('rejects a disqualified agent', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db, {
			city: {
				id: '00000000-0000-4000-8000-0000000000ca',
				name: 'Los Angeles',
				state: 'CA',
				center: { lat: 34.0522, lng: -118.2437 },
			},
			geography: geoOf({ '90001': { lat: 33.9731, lng: -118.2479 } }),
		})
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'AGENT_INELIGIBLE' },
		})
	})

	test('rejects an unknown agent', async ({ db }) => {
		const client = await seedClient(db)
		const result = await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: [crypto.randomUUID()],
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'AGENT_NOT_FOUND' },
		})
	})

	test('rejects a second active intro to the same agent', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const input = {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		}
		await Client.send(db, input)
		const result = await Client.send(db, input)
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'ALREADY_ACTIVE' },
		})
	})
})

describe('transitions', () => {
	test('accept marks the intro accepted when no window is active', async ({
		db,
	}) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		const result = await Agent.accept(db, {
			introductionId: intro.id,
		})
		expect(result).toEqual({ ok: true, status: 'accepted' })

		const row = await getIntro(db, intro.id)
		expect(row?.status).toBe('accepted')
		expect(row?.acceptedAt).toEqual(expect.any(Date))
		expect(row?.connectedAt).toBeNull()
		expect(row?.closedAt).toBeNull()
	})

	test('accept connects immediately during an active window', async ({
		db,
	}) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		await db
			.insert(introAccessWindows)
			.values(makeAccessWindow(client.profile.id))
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		const result = await Agent.accept(db, {
			introductionId: intro.id,
		})
		expect(result).toEqual({ ok: true, status: 'connected' })

		const row = await getIntro(db, intro.id)
		expect(row?.status).toBe('connected')
		expect(row?.acceptedAt).toEqual(expect.any(Date))
		expect(row?.connectedAt).toEqual(expect.any(Date))
		expect(row?.closedAt).toBeNull()
	})

	test('accept rejects an already-resolved intro', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		await Agent.accept(db, { introductionId: intro.id })
		const result = await Agent.accept(db, {
			introductionId: intro.id,
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'NOT_PENDING' },
		})
	})

	test('decline sets closedAt', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		const result = await Agent.decline(db, {
			introductionId: intro.id,
		})
		expect(result).toEqual({ ok: true })

		const row = await getIntro(db, intro.id)
		expect(row?.status).toBe('declined')
		expect(row?.closedAt).toEqual(expect.any(Date))
		expect(row?.acceptedAt).toBeNull()

		const again = await Agent.decline(db, {
			introductionId: intro.id,
		})
		expect(again).toMatchObject({
			ok: false,
			error: { code: 'NOT_PENDING' },
		})
	})

	test('withdraw blocks intros younger than 24h', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const createdAt = hoursAgo(23)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
			overrides: { createdAt },
		})
		await db.insert(introductions).values(intro)

		const result = await Client.withdraw(db, {
			introductionId: intro.id,
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'WITHDRAW_TOO_EARLY' },
		})
	})

	test('withdraw allows intros at least 24h old', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const createdAt = hoursAgo(24)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
			overrides: { createdAt },
		})
		await db.insert(introductions).values(intro)

		const result = await Client.withdraw(db, {
			introductionId: intro.id,
		})
		expect(result).toEqual({ ok: true })

		const row = await getIntro(db, intro.id)
		expect(row?.status).toBe('withdrawn')
		expect(row?.closedAt).toEqual(expect.any(Date))
		expect(row?.acceptedAt).toBeNull()
	})

	test('withdraw rejects non-pending intros', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const createdAt = hoursAgo(48)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
			overrides: {
				status: 'accepted',
				createdAt,
				acceptedAt: hoursAgo(24),
			},
		})
		await db.insert(introductions).values(intro)

		const result = await Client.withdraw(db, {
			introductionId: intro.id,
		})
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'NOT_WITHDRAWABLE' },
		})
	})
})

describe('concurrent sends', () => {
	test('two tabs sending to the same agent: only one wins', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const input = {
			clientProfileId: client.profile.id,
			agentProfileIds: [agent.profile.id],
		}
		const [a, b] = await Promise.all([
			Client.send(db, input),
			Client.send(db, input),
		])
		expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1)
		const loser = a.ok ? b : a
		expect(loser).toMatchObject({
			ok: false,
			error: { code: 'ALREADY_ACTIVE' },
		})
	})

	test('two tabs race for the last open slot', async ({ db }) => {
		const client = await seedClient(db)
		const first = await Promise.all([seedAgent(db), seedAgent(db)])
		await Client.send(db, {
			clientProfileId: client.profile.id,
			agentProfileIds: first.map((agent) => agent.profile.id),
		})
		const contenderA = await seedAgent(db)
		const contenderB = await seedAgent(db)
		const [a, b] = await Promise.all([
			Client.send(db, {
				clientProfileId: client.profile.id,
				agentProfileIds: [contenderA.profile.id],
			}),
			Client.send(db, {
				clientProfileId: client.profile.id,
				agentProfileIds: [contenderB.profile.id],
			}),
		])
		expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1)
		const loser = a.ok ? b : a
		expect(loser).toMatchObject({ ok: false, error: { code: 'SLOT_CAP' } })
	})
})

describe('list views', () => {
	test('pre-connected views hide contact info', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		await db.insert(introductions).values(
			makeIntroduction({
				clientProfileId: client.profile.id,
				agentProfileId: agent.profile.id,
			}),
		)

		const payload = await Client.list(db, client.profile.id)
		expect(payload.slots).toEqual({ used: 1, max: 3 })
		expect(payload.introductions).toHaveLength(1)
		expect(payload.introductions[0]?.agent).not.toHaveProperty('contact')
		expect(payload.agentStates).toEqual([
			{ agentProfileId: agent.profile.id, state: 'active', retryAt: null },
		])

		const agentViews = await Agent.list(db, agent.profile.id)
		expect(agentViews).toHaveLength(1)
		expect(agentViews[0]?.client.displayName).toBe('Test U.')
		expect(agentViews[0]?.client).not.toHaveProperty('contact')
	})

	test('connected views expose contact info', async ({ db }) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		await db.insert(introductions).values(
			makeIntroduction({
				clientProfileId: client.profile.id,
				agentProfileId: agent.profile.id,
				overrides: { status: 'connected' },
			}),
		)

		const payload = await Client.list(db, client.profile.id)
		expect(payload.introductions[0]?.agent.contact).toEqual({
			email: agent.user.email,
			brokerageName: 'Harborline Realty',
			licenseNumberState: 'LIC-123456-MD',
		})
		expect(payload.agentStates).toEqual([
			{ agentProfileId: agent.profile.id, state: 'connected', retryAt: null },
		])

		const agentViews = await Agent.list(db, agent.profile.id)
		expect(agentViews[0]?.client.contact).toEqual({
			fullName: 'Test User',
			email: client.user.email,
		})
	})
})
