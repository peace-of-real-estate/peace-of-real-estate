import { Resend } from 'resend'

import { serverEnv as env } from '@/env.server'

type SendPasswordResetEmailOptions = {
	to: string
	resetUrl: string
}

export async function sendPasswordResetEmail({
	to,
	resetUrl,
}: SendPasswordResetEmailOptions) {
	const isProductionLike =
		env.APP_ENV === 'production' || env.APP_ENV === 'staging'

	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
		if (isProductionLike) {
			throw new Error(
				'Reset password emails require RESEND_API_KEY and FROM_EMAIL to be configured.',
			)
		}

		console.log('Password reset email (development):')
		console.log(`To: ${to}`)
		console.log(`Reset URL: ${resetUrl}`)
		return
	}

	const resend = new Resend(env.RESEND_API_KEY)
	const { error } = await resend.emails.send({
		from: env.FROM_EMAIL,
		to,
		subject: 'Reset your Peace of Real Estate password',
		html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
		text: `Reset your password: ${resetUrl}`,
	})

	if (error) {
		throw error
	}
}
