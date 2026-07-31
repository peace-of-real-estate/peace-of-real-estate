import type { introAccessWindows, introductions } from '@/db/schema'

export type { ClientRole } from '@/lib/profile/types'

export type { IntroductionStatus } from './intro-data'
export type Introduction = typeof introductions.$inferSelect
export type IntroAccessWindow = typeof introAccessWindows.$inferSelect
