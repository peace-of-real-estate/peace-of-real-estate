import { nitro } from 'nitro/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import svgr from 'vite-plugin-svgr'
import { resolve } from 'node:path'
import { defineConfig, type UserConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

const fmt = {
	singleQuote: true,
	semi: false,
	useTabs: true,
	experimentalTailwindcss: {},
	printWidth: 80,
	experimentalSortPackageJson: false,
	proseWrap: 'always',
	ignorePatterns: [
		'**/.output',
		'**/dist/**',
		'pnpm-lock.yaml',
		'**/routeTree.gen.ts',
	],
	overrides: [
		{
			files: ['*.{yaml,yml}'],
			options: { useTabs: false },
		},
	],
} satisfies UserConfig['fmt']

const lint = {
	plugins: [
		'eslint',
		'unicorn',
		'typescript',
		'oxc',
		'react',
		'react-perf',
		'import',
		'jsdoc',
		'jsx-a11y',
		'node',
		'promise',
	],
	categories: {},
	options: {
		typeAware: true,
		typeCheck: true,
	},
	rules: {
		'no-empty-pattern': 'off',
		'no-console': ['error', { allow: ['warn', 'error'] }],
	},
	overrides: [
		{
			files: ['scripts/**', '**/*.server.ts'],
			rules: {
				'no-console': 'off',
			},
		},
	],
	settings: {
		'jsx-a11y': { components: {}, attributes: {} },
		react: { formComponents: [], linkComponents: [] },
		jsdoc: {
			ignorePrivate: false,
			ignoreInternal: false,
			ignoreReplacesDocs: true,
			overrideReplacesDocs: true,
			augmentsExtendsReplacesDocs: false,
			implementsReplacesDocs: false,
			exemptDestructuredRootsFromChecks: false,
			tagNamePreference: {},
		},
	},
	env: { builtin: true },
	globals: {},
	ignorePatterns: ['**/dist/**'],
} satisfies UserConfig['lint']

const root = import.meta.dirname

export default defineConfig({
	root,
	resolve: {
		tsconfigPaths: true,
		dedupe: ['react', 'react-dom'],
		alias: [
			{ find: '@', replacement: resolve(root, 'src') },
			{ find: '@tests', replacement: resolve(root, 'tests') },
		],
	},
	optimizeDeps: {
		include: [
			'vite-plus/test',
			'vite-plus/test/browser',
			'vitest-browser-react',
		],
	},
	plugins: [
		tanstackStart({
			router: { routeFileIgnorePattern: '(\\.test\\.tsx$|__screenshots__)' },
		}),
		...(process.env.VITEST === 'true'
			? []
			: [devtools({ injectSource: { enabled: false } }), nitro()]),
		tailwindcss(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
		svgr({
			include: '**/*.svg',
			svgrOptions: { exportType: 'default' },
		}),
	],
	fmt: fmt,
	lint: lint,
	staged: {
		'*': 'vp check --fix',
	},
	test: {
		passWithNoTests: true,
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'server',
					include: ['src/**/*.{server,db}.ts'],
					testTimeout: 5_000,
					fileParallelism: false,
				},
			},
			{
				extends: true,
				test: {
					name: 'browser',
					include: ['src/**/*.test.tsx', 'tests/pages/**/*.test.tsx'],
					setupFiles: ['./tests/support/mocks/styles.ts'],
					bail: 1,
					testTimeout: process.env.CI ? 60_000 : 20_000,
					browser: {
						instances: [{ browser: 'chromium' }],
						provider: playwright(),
						enabled: true,
						headless: true,
					},
				},
			},
		],
	},
})
