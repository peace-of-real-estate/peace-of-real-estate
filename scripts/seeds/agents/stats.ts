import { STREETS } from './mocks'
import type { City } from './mocks'

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

export function buildAddress(location: City, zip: string): string {
	const streetNum = randInt(100, 9999)
	const street = pick(STREETS)
	return `${streetNum} ${street}, ${location.city}, ${location.state} ${zip}`
}

export function buildPhone(): string {
	const area = String(randInt(200, 999))
	const prefix = String(randInt(200, 999))
	const line = String(randInt(1000, 9999))
	return `(${area}) ${prefix}-${line}`
}
