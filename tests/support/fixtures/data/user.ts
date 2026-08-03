import { user } from '@/db/schema'

export type IntroUser = typeof user.$inferInsert

export function makeIntroUser(overrides: Partial<IntroUser> = {}): IntroUser {
	const id = overrides.id ?? crypto.randomUUID()
	return {
		id,
		name: 'Test User',
		email: `${id}@example.com`,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}
