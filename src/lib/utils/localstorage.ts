import * as z from 'zod/mini'

function readLocalStorage<T>(key: string, schema: z.ZodMiniType<T>): T | null {
	if (typeof window === 'undefined') return null
	const raw = window.localStorage.getItem(key)
	if (!raw) return null
	const parsed: unknown = JSON.parse(raw)
	const result = z.safeParse(schema, parsed)
	if (!result.success) {
		throw new Error(
			`Stored draft for ${key} is invalid and was discarded: ${result.error.message}`,
		)
	}
	return result.data
}

function writeLocalStorage(key: string, value: unknown) {
	if (typeof window === 'undefined') return
	window.localStorage.setItem(key, JSON.stringify(value))
}

function removeLocalStorage(key: string) {
	if (typeof window === 'undefined') return
	window.localStorage.removeItem(key)
}

export function createLocalStorage<T>(key: string, schema: z.ZodMiniType<T>) {
	return {
		load: (): T | null => readLocalStorage(key, schema),
		save: (value: T) => writeLocalStorage(key, value),
		clear: () => removeLocalStorage(key),
	}
}
