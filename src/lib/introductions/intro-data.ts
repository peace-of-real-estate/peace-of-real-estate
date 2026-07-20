import { z } from 'zod'

import type { IntroductionStatus } from './types'

const pendingDataSchema = z.object({})

const acceptedDataSchema = z.object({
	acceptedAt: z.iso.datetime(),
})

const connectedDataSchema = acceptedDataSchema.extend({
	connectedAt: z.iso.datetime(),
})

const closedDataSchema = z.object({
	closedAt: z.iso.datetime(),
})

export type IntroductionData =
	| z.infer<typeof pendingDataSchema>
	| z.infer<typeof acceptedDataSchema>
	| z.infer<typeof connectedDataSchema>
	| z.infer<typeof closedDataSchema>

export type DecodedIntroData = {
	acceptedAt: Date | null
	connectedAt: Date | null
	closedAt: Date | null
}

export function decodeData(
	status: IntroductionStatus,
	data: unknown,
): DecodedIntroData {
	switch (status) {
		case 'pending': {
			pendingDataSchema.parse(data)
			return { acceptedAt: null, connectedAt: null, closedAt: null }
		}
		case 'accepted': {
			const parsed = acceptedDataSchema.parse(data)
			return {
				acceptedAt: new Date(parsed.acceptedAt),
				connectedAt: null,
				closedAt: null,
			}
		}
		case 'connected': {
			const parsed = connectedDataSchema.parse(data)
			return {
				acceptedAt: new Date(parsed.acceptedAt),
				connectedAt: new Date(parsed.connectedAt),
				closedAt: null,
			}
		}
		case 'declined':
		case 'withdrawn': {
			const parsed = closedDataSchema.parse(data)
			return {
				acceptedAt: null,
				connectedAt: null,
				closedAt: new Date(parsed.closedAt),
			}
		}
	}
}

export const encodeData = {
	pending: (): IntroductionData => ({}),
	accepted: (now: Date): IntroductionData => ({
		acceptedAt: now.toISOString(),
	}),
	connected: (now: Date): IntroductionData => ({
		acceptedAt: now.toISOString(),
		connectedAt: now.toISOString(),
	}),
	closed: (now: Date): IntroductionData => ({
		closedAt: now.toISOString(),
	}),
}
