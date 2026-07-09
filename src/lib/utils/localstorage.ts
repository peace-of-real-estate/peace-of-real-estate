export function readLocalStorage<T>(key: string): T | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = window.localStorage.getItem(key)
		if (!raw) return null
		const parsed: unknown = JSON.parse(raw)
		if (parsed && typeof parsed === 'object') {
			// oxlint-disable-next-line typescript/consistent-type-assertions
			return parsed as T
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

export function createLocalStorage<T>(key: string) {
	return {
		load: (): T | null => readLocalStorage<T>(key),
		save: (value: T) => writeLocalStorage(key, value),
		clear: () => removeLocalStorage(key),
	}
}
