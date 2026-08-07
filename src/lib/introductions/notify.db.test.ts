import {
	makeIntroduction,
	hoursAgo,
	seedAgent,
	seedClient,
} from '@tests/support/fixtures/data/introductions'
import { beforeEach, expect, test } from '@tests/support/fixtures/db'
import { eq } from 'drizzle-orm'
import { vi } from 'vite-plus/test'

import {
	connectionNotificationJobs,
	introductionNotificationJobs,
	introductions,
} from '@/db/schema'
import { Client } from '@/lib/introductions/db'
import {
	notifyConnected,
	retryIntroductionNotifications,
} from '@/lib/introductions/notify'

const mocks = vi.hoisted(() => ({
	sendConnectedAgentEmail: vi.fn(),
	sendConnectedClientEmail: vi.fn(),
	sendIntroAcceptedEmail: vi.fn(),
	sendIntroDeclinedEmail: vi.fn(),
	sendIntroSentEmail: vi.fn(),
}))

vi.mock('@/lib/email.server', () => ({
	sendConnectedAgentEmail: mocks.sendConnectedAgentEmail,
	sendConnectedClientEmail: mocks.sendConnectedClientEmail,
	sendIntroAcceptedEmail: mocks.sendIntroAcceptedEmail,
	sendIntroDeclinedEmail: mocks.sendIntroDeclinedEmail,
	sendIntroSentEmail: mocks.sendIntroSentEmail,
}))

beforeEach(() => {
	mocks.sendConnectedAgentEmail.mockReset()
	mocks.sendConnectedClientEmail.mockReset()
	mocks.sendIntroAcceptedEmail.mockReset()
	mocks.sendIntroDeclinedEmail.mockReset()
	mocks.sendIntroSentEmail.mockReset()
})

test('does not deliver a queued sent email after withdrawal', async ({
	db,
}) => {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: {
			status: 'withdrawn',
		},
	})
	await db.insert(introductions).values(intro)
	await db.insert(introductionNotificationJobs).values({
		id: crypto.randomUUID(),
		introductionId: intro.id,
		kind: 'sent',
	})

	await retryIntroductionNotifications(db, { introductionIds: [intro.id] })

	expect(mocks.sendIntroSentEmail).not.toHaveBeenCalled()
	const [job] = await db
		.select()
		.from(introductionNotificationJobs)
		.where(eq(introductionNotificationJobs.introductionId, intro.id))
	expect(job?.sentAt).toEqual(expect.any(Date))
})

test('withdrawal cancels an unsent introduction email', async ({ db }) => {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: { createdAt: hoursAgo(25) },
	})
	await db.insert(introductions).values(intro)
	await db.insert(introductionNotificationJobs).values({
		id: crypto.randomUUID(),
		introductionId: intro.id,
		kind: 'sent',
	})

	await expect(
		Client.withdraw(db, { introductionId: intro.id }),
	).resolves.toEqual({ ok: true })
	const jobs = await db
		.select()
		.from(introductionNotificationJobs)
		.where(eq(introductionNotificationJobs.introductionId, intro.id))
	expect(jobs).toHaveLength(0)
})

test('failed lifecycle email remains queued and can be retried', async ({
	db,
}) => {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: { status: 'accepted' },
	})
	await db.insert(introductions).values(intro)
	await db.insert(introductionNotificationJobs).values({
		id: crypto.randomUUID(),
		introductionId: intro.id,
		kind: 'accepted',
	})
	mocks.sendIntroAcceptedEmail.mockRejectedValueOnce(new Error('temporary'))
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

	await retryIntroductionNotifications(db, { introductionIds: [intro.id] })
	expect(consoleError).toHaveBeenCalledWith(
		'Intro notification failed (accepted-pending):',
		expect.any(AggregateError),
	)
	consoleError.mockRestore()
	expect(mocks.sendIntroAcceptedEmail).toHaveBeenCalledTimes(1)
	let [job] = await db
		.select()
		.from(introductionNotificationJobs)
		.where(eq(introductionNotificationJobs.introductionId, intro.id))
	expect(job?.sentAt).toBeNull()

	mocks.sendIntroAcceptedEmail.mockResolvedValue(undefined)
	await retryIntroductionNotifications(db, { introductionIds: [intro.id] })
	;[job] = await db
		.select()
		.from(introductionNotificationJobs)
		.where(eq(introductionNotificationJobs.introductionId, intro.id))
	expect(job?.sentAt).toEqual(expect.any(Date))
	expect(mocks.sendIntroAcceptedEmail).toHaveBeenLastCalledWith(
		expect.objectContaining({ idempotencyKey: `intro-accepted-${intro.id}` }),
	)
})

test('checkpoints each recipient independently with stable idempotency keys', async ({
	db,
}) => {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: { status: 'connected' },
	})
	await db.insert(introductions).values(intro)
	await db
		.insert(connectionNotificationJobs)
		.values({ introductionId: intro.id })
	mocks.sendConnectedAgentEmail.mockRejectedValue(new Error('invalid agent'))
	mocks.sendConnectedClientEmail.mockResolvedValue(undefined)

	await expect(
		notifyConnected(db, { introductionIds: [intro.id] }),
	).rejects.toThrow('Connection notification delivery failed.')

	expect(mocks.sendConnectedAgentEmail).toHaveBeenCalledWith(
		expect.objectContaining({
			idempotencyKey: `intro-connected-agent-${intro.id}`,
		}),
	)
	expect(mocks.sendConnectedClientEmail).toHaveBeenCalledWith(
		expect.objectContaining({
			idempotencyKey: `intro-connected-client-${intro.id}`,
		}),
	)
	const [job] = await db
		.select()
		.from(connectionNotificationJobs)
		.where(eq(connectionNotificationJobs.introductionId, intro.id))
	expect(job?.agentSentAt).toBeNull()
	expect(job?.clientSentAt).toEqual(expect.any(Date))

	mocks.sendConnectedAgentEmail.mockResolvedValue(undefined)
	await notifyConnected(db, { introductionIds: [intro.id] })
	expect(mocks.sendConnectedAgentEmail).toHaveBeenCalledTimes(2)
	expect(mocks.sendConnectedClientEmail).toHaveBeenCalledTimes(1)
})

test('cancels a connection job whose introduction is not connected', async ({
	db,
}) => {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: { status: 'accepted' },
	})
	await db.insert(introductions).values(intro)
	await db
		.insert(connectionNotificationJobs)
		.values({ introductionId: intro.id })

	await notifyConnected(db, { introductionIds: [intro.id] })

	expect(mocks.sendConnectedAgentEmail).not.toHaveBeenCalled()
	expect(mocks.sendConnectedClientEmail).not.toHaveBeenCalled()
	const [job] = await db
		.select()
		.from(connectionNotificationJobs)
		.where(eq(connectionNotificationJobs.introductionId, intro.id))
	expect(job?.canceledAt).toEqual(expect.any(Date))
	expect(job?.agentSentAt).toBeNull()
	expect(job?.clientSentAt).toBeNull()

	await expect(
		notifyConnected(db, { introductionIds: [intro.id] }),
	).resolves.toBeUndefined()
	expect(mocks.sendConnectedAgentEmail).not.toHaveBeenCalled()
	expect(mocks.sendConnectedClientEmail).not.toHaveBeenCalled()
})
