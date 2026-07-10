import { z } from 'zod'

export function readLocalStorage<T>(
	key: string,
	schema: z.ZodType<T>,
): T | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = window.localStorage.getItem(key)
		if (!raw) return null
		const parsed: unknown = JSON.parse(raw)
		if (parsed && typeof parsed === 'object') {
			return schema.parse(parsed)
		}
		return null
	} catch {
		return null
	}
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
