import type { introAccessWindows, introductions } from '@/db/tables'
import type { ClientRole } from '@/lib/profile/types'

export type { ClientRole } from '@/lib/profile/types'

export type Introduction = typeof introductions.$inferSelect
export type IntroductionStatus = Introduction['status']
export type IntroAccessWindow = typeof introAccessWindows.$inferSelect

export type TransactionSide = 'buying' | 'selling'

export function transactionSide(role: ClientRole): TransactionSide {
	return role === 'buyer' ? 'buying' : 'selling'
}
