// Client-safe barrel. Server functions live in './server' and must be
// imported from '@/lib/profile/server' directly — re-exporting them here
// would drag the db/drizzle import chain into every client chunk.
export * from './types'
export * from './profile-fields'
export * from './question-types'
export { getQuestionIcon } from './question-icons'
