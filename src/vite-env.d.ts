/// <reference types="vite-plus/client" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
	readonly VITE_PUBLIC_POSTHOG_KEY?: string
}
