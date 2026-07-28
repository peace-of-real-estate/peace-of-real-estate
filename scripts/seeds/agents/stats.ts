export type WeightedOption<T> = { value: T; weight: number }

export function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]!
}

export function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pickWeighted<T>(options: readonly WeightedOption<T>[]): T {
	const total = options.reduce((sum, option) => sum + option.weight, 0)
	let random = Math.random() * total
	for (const option of options) {
		random -= option.weight
		if (random <= 0) return option.value
	}
	return options[options.length - 1]!.value
}

export function sample<T>(arr: readonly T[], count: number): T[] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5)
	return shuffled.slice(0, count)
}
