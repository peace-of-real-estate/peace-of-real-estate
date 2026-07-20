import { Resend } from 'resend'

import { serverEnv as env } from '@/env.server'
import type { ClientRole } from '@/lib/profile/types'

type EmailMessage = {
	to: string
	subject: string
	html: string
	text: string
	devSummary: string
	idempotencyKey?: string
}

const HTML_ENTITIES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

export function escapeEmailHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(character) => HTML_ENTITIES[character] ?? character,
	)
}

function appUrl(path: string): string {
	return `${new URL(env.BETTER_AUTH_URL).origin}${path}`
}

const RESERVED_TEST_DOMAINS =
	/(^|\.)(example\.(com|org|net)|test|invalid|example|localhost)$/i

function isReservedTestRecipient(to: string): boolean {
	const domain = to.split('@')[1]
	return domain ? RESERVED_TEST_DOMAINS.test(domain) : false
}

function clientIntroductionsPath(role: ClientRole): string {
	return role === 'buyer' ? '/buyer/introductions' : '/seller/introductions'
}

async function deliver(message: EmailMessage) {
	const isProductionLike =
		env.APP_ENV === 'production' || env.APP_ENV === 'staging'

	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
		if (isProductionLike) {
			throw new Error(
				`${message.subject} requires RESEND_API_KEY and FROM_EMAIL to be configured.`,
			)
		}

		console.log(`${message.subject} (development):`)
		console.log(`To: ${message.to}`)
		console.log(message.devSummary)
		return
	}

	let to = message.to
	let subject = message.subject
	let html = message.html
	let text = message.text
	if (!isProductionLike) {
		if (env.DEV_EMAIL_OVERRIDE && to !== env.DEV_EMAIL_OVERRIDE) {
			subject = `[for ${to}] ${subject}`
			html = `<p><em>Intended recipient: ${escapeEmailHtml(to)}</em></p>${html}`
			text = `Intended recipient: ${to}\n\n${text}`
			to = env.DEV_EMAIL_OVERRIDE
		} else if (isReservedTestRecipient(to)) {
			console.log(`${subject} (development, reserved test recipient):`)
			console.log(`To: ${to}`)
			console.log(message.devSummary)
			return
		}
	}

	const resend = new Resend(env.RESEND_API_KEY)
	const { error } = await resend.emails.send(
		{
			from: env.FROM_EMAIL,
			to,
			subject,
			html,
			text,
		},
		message.idempotencyKey
			? { idempotencyKey: message.idempotencyKey }
			: undefined,
	)

	if (error) {
		throw error
	}
}

export async function sendPasswordResetEmail({
	to,
	resetUrl,
}: {
	to: string
	resetUrl: string
}) {
	await deliver({
		to,
		subject: 'Reset your Peace of Real Estate password',
		html: `<p>Click the link below to reset your password:</p><p><a href="${escapeEmailHtml(resetUrl)}">${escapeEmailHtml(resetUrl)}</a></p>`,
		text: `Reset your password: ${resetUrl}`,
		devSummary: `Reset URL: ${resetUrl}`,
	})
}

export async function sendIntroSentEmail({
	to,
	clientDisplayName,
	role,
	city,
	state,
	idempotencyKey,
}: {
	to: string
	clientDisplayName: string
	role: ClientRole
	city: string
	state: string
	idempotencyKey: string
}) {
	const url = appUrl('/agent/introductions')
	await deliver({
		to,
		subject: 'New introduction request on Peace of Real Estate',
		html: `<p>${escapeEmailHtml(clientDisplayName)}, a ${escapeEmailHtml(role)} in ${escapeEmailHtml(city)}, ${escapeEmailHtml(state)}, wants to connect with you.</p><p>Review the request: <a href="${url}">${url}</a></p>`,
		text: `${clientDisplayName}, a ${role} in ${city}, ${state}, wants to connect with you. Review the request: ${url}`,
		devSummary: `Intro from ${clientDisplayName} (${role}, ${city}, ${state}): ${url}`,
		idempotencyKey,
	})
}

export async function sendIntroAcceptedEmail({
	to,
	agentName,
	role,
	idempotencyKey,
}: {
	to: string
	agentName: string
	role: ClientRole
	idempotencyKey: string
}) {
	const url = appUrl(clientIntroductionsPath(role))
	await deliver({
		to,
		subject: `${agentName} accepted your introduction`,
		html: `<p>${escapeEmailHtml(agentName)} accepted your introduction request.</p><p>Unlock their contact info: <a href="${url}">${url}</a></p>`,
		text: `${agentName} accepted your introduction request. Unlock their contact info: ${url}`,
		devSummary: `${agentName} accepted: ${url}`,
		idempotencyKey,
	})
}

export async function sendIntroDeclinedEmail({
	to,
	role,
	idempotencyKey,
}: {
	to: string
	role: ClientRole
	idempotencyKey: string
}) {
	const url = appUrl(clientIntroductionsPath(role))
	await deliver({
		to,
		subject: 'An update on your introduction request',
		html: `<p>One of the agents you reached out to is unable to take on new clients right now, so they declined your introduction request.</p><p>A slot has freed up, so you can send a request to another agent: <a href="${url}">${url}</a></p>`,
		text: `One of the agents you reached out to declined your introduction request. A slot has freed up to reach out to another agent: ${url}`,
		devSummary: `Introduction declined, slot freed: ${url}`,
		idempotencyKey,
	})
}

export async function sendConnectedAgentEmail({
	to,
	clientName,
	clientEmail,
	idempotencyKey,
}: {
	to: string
	clientName: string
	clientEmail: string
	idempotencyKey: string
}) {
	await deliver({
		to,
		subject: `You're connected with ${clientName}`,
		html: `<p>You're now connected with ${escapeEmailHtml(clientName)} on Peace of Real Estate.</p><p>Reach them directly at <a href="mailto:${escapeEmailHtml(clientEmail)}">${escapeEmailHtml(clientEmail)}</a>.</p>`,
		text: `You're now connected with ${clientName} on Peace of Real Estate. Reach them directly at ${clientEmail}.`,
		devSummary: `Connected with ${clientName} <${clientEmail}>`,
		idempotencyKey,
	})
}

export async function sendConnectedClientEmail({
	to,
	agentName,
	agentEmail,
	agentPhone,
	role,
	idempotencyKey,
}: {
	to: string
	agentName: string
	agentEmail: string
	agentPhone: string | null
	role: ClientRole
	idempotencyKey: string
}) {
	const url = appUrl(clientIntroductionsPath(role))
	const phoneLine = agentPhone ? ` or ${agentPhone}` : ''
	const htmlPhoneLine = agentPhone ? ` or ${escapeEmailHtml(agentPhone)}` : ''
	await deliver({
		to,
		subject: `You're connected with ${agentName}`,
		html: `<p>You're now connected with ${escapeEmailHtml(agentName)} on Peace of Real Estate.</p><p>Reach them directly at <a href="mailto:${escapeEmailHtml(agentEmail)}">${escapeEmailHtml(agentEmail)}</a>${htmlPhoneLine}.</p><p>Your introductions: <a href="${url}">${url}</a></p>`,
		text: `You're now connected with ${agentName} on Peace of Real Estate. Reach them directly at ${agentEmail}${phoneLine}. Your introductions: ${url}`,
		devSummary: `Connected with ${agentName} <${agentEmail}>${phoneLine}: ${url}`,
		idempotencyKey,
	})
}
