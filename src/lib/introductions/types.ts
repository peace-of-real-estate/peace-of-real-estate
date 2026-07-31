import type { introAccessWindows, introductions } from '@/db/tables'

export type { ClientRole } from '@/lib/profile/types'

export type { IntroductionStatus } from './intro-data'
export type Introduction = typeof introductions.$inferSelect
export type IntroAccessWindow = typeof introAccessWindows.$inferSelect
