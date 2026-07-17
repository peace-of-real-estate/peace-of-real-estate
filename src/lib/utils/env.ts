import { config } from 'dotenv'

function getUsableEnvValue(value: string | undefined): string | undefined {
	return value !== undefined && value.trim() !== '' ? value : undefined
}

export function normalizeEnvironmentName(raw: string): string {
	return /(?:^|-)pr-\d+$/.test(raw) ? 'staging' : raw
}

export function getEnvironmentName(): string {
	const raw =
		process.env.RAILWAY_ENVIRONMENT_NAME ??
		process.env.APP_ENV ??
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

export function getRuntimeEnv(): Record<string, string> {
	const fileEnvironment = loadEnvFiles()
	const runtimeEnvironment: Record<string, string> = {}

	for (const [key, value] of Object.entries(fileEnvironment)) {
		const usableValue = getUsableEnvValue(value)
		if (usableValue !== undefined) runtimeEnvironment[key] = usableValue
	}

	for (const [key, value] of Object.entries(process.env)) {
		const usableValue = getUsableEnvValue(value)
		if (usableValue !== undefined) runtimeEnvironment[key] = usableValue
	}

	// Always expose the normalized name used to select the dotenv files.
	runtimeEnvironment.APP_ENV = getEnvironmentName()
	return runtimeEnvironment
}
