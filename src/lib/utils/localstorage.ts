import { z } from 'zod'

export function readLocalStorage<T>(
	key: string,
	schema: z.ZodType<T>,
): T | null {
	if (typeof window === 'undefined') return null
	const raw = window.localStorage.getItem(key)
	if (!raw) return null
	const parsed: unknown = JSON.parse(raw)
	const result = schema.safeParse(parsed)
	if (!result.success) {
		throw new Error(
			`Stored draft for ${key} is invalid and was discarded: ${result.error.message}`,
		)
	}
	return result.data
}

export function writeLocalStorage(key: string, value: unknown) {
	if (typeof window === 'undefined') return
	window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeLocalStorage(key: string) {
	if (typeof window === 'undefined') return
	window.localStorage.removeItem(key)
}

export function createLocalStorage<T>(key: string, schema: z.ZodType<T>) {
	return {
		load: (): T | null => readLocalStorage(key, schema),
		save: (value: T) => writeLocalStorage(key, value),
		clear: () => removeLocalStorage(key),
	}
}
