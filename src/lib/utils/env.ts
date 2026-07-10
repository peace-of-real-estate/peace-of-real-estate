import { config } from 'dotenv'

type EnvSchema<T extends object> = {
	parse(input: unknown): T
}

function isUsableEnvValue(value: string | undefined): boolean {
	return value !== undefined && value.trim() !== ''
}

export function normalizeEnvironmentName(raw: string): string {
	return /(?:^|-)pr-\d+$/.test(raw) ? 'staging' : raw
}

export function getEnvironmentName(): string {
	const raw =
		process.env.RAILWAY_ENVIRONMENT_NAME ??
		(process.env.NODE_ENV === 'production' ? 'production' : 'development')
	return normalizeEnvironmentName(raw)
}

export function loadEnvFiles(
	environmentName = getEnvironmentName(),
): NodeJS.ProcessEnv {
	const fileEnvironment: NodeJS.ProcessEnv = {}

	config({
		path: [
			'.env',
			'.env.local',
			`.env.${environmentName}`,
			`.env.${environmentName}.local`,
		],
		quiet: true,
		override: true,
		processEnv: fileEnvironment,
	})

	return fileEnvironment
}

export function loadPublicEnvIntoProcess(environmentName?: string): void {
	const fileEnvironment = loadEnvFiles(environmentName)

	for (const [key, value] of Object.entries(fileEnvironment)) {
		if (key.startsWith('VITE_') && value !== undefined) {
			process.env[key] = value
		}
	}
}

export function createEnv<T extends object>(schema: EnvSchema<T>): T {
	const fileEnvironment = loadEnvFiles()

	let parsed: T | undefined

	function parseEnv() {
		if (parsed !== undefined) return parsed

		const env: NodeJS.ProcessEnv = {}

		for (const [key, value] of Object.entries(fileEnvironment)) {
			if (isUsableEnvValue(value)) env[key] = value
		}

		for (const [key, value] of Object.entries(process.env)) {
			if (isUsableEnvValue(value)) env[key] = value
		}

		parsed = schema.parse(env)
		return parsed
	}

	const handler: ProxyHandler<T> = {
		get(_target, property, receiver) {
			return Reflect.get(parseEnv(), property, receiver)
		},
		has(_target, property) {
			return property in parseEnv()
		},
		ownKeys() {
			return Reflect.ownKeys(parseEnv())
		},
		getOwnPropertyDescriptor(_target, property) {
			return Object.getOwnPropertyDescriptor(parseEnv(), property)
		},
	}

	return new Proxy<T>(Object.create(null), handler)
}
