import { Resend } from 'resend'

import { serverEnv as env } from '@/env.server'

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

const RESERVED_TEST_DOMAINS =
	/(^|\.)(example\.(com|org|net)|test|invalid|example|localhost)$/i

function isReservedTestRecipient(to: string): boolean {
	const domain = to.split('@')[1]
	return domain ? RESERVED_TEST_DOMAINS.test(domain) : false
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
	if (!isProductionLike && isReservedTestRecipient(to)) {
		console.log(`${subject} (development, reserved test recipient):`)
		console.log(`To: ${to}`)
		console.log(message.devSummary)
		return
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
