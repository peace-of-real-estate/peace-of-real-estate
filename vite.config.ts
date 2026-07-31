import { resolve } from 'node:path'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { varlockVitePlugin } from '@varlock/vite-integration'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig, type UserConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

const fmt = {
	singleQuote: true,
	semi: false,
	useTabs: true,
	experimentalTailwindcss: {},
	experimentalSortImports: {},
	printWidth: 80,
	experimentalSortPackageJson: false,
	proseWrap: 'always',
	ignorePatterns: [
		'**/.output',
		'**/dist/**',
		'pnpm-lock.yaml',
		'**/routeTree.gen.ts',
		'src/db/migrations/**',
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
	jsPlugins: [{ name: 'eslint-js', specifier: 'oxlint-plugin-eslint' }],
	categories: {},
	options: {
		typeAware: true,
		typeCheck: true,
	},
	rules: {
		'no-empty-pattern': 'off',
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'typescript/consistent-type-assertions': [
			'error',
			{ assertionStyle: 'never' },
		],
		'eslint-js/no-restricted-syntax': [
			'error',
			{
				selector: 'TSTypePredicate[asserts=false]',
				message:
					'Type predicates are not allowed. Use runtime validation instead.',
			},
		],
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
	// scripts/setup.ts generates a per-worktree APP_PORT (10000–19999) that
	// the Stripe listener forwards webhooks to; fall back to the TanStack
	// Start default when it is not set.
	server: {
		port: process.env.APP_PORT ? Number(process.env.APP_PORT) : 3000,
	},
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
		varlockVitePlugin({ ssrInjectMode: 'resolved-env' }),
	],
	fmt: fmt,
	lint: lint,
	staged: {
		'*': 'vp check --fix',
	},
	test: {
		passWithNoTests: true,
		// CI adds the official HTML report plus a single-file visual diff
		// page; both get uploaded as artifacts when tests fail
		reporters: process.env.CI
			? ['default', 'html', './tests/support/visual-diff-reporter.ts']
			: ['default'],
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts', '!src/**/*.{server,db}.test.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'server',
					include: ['src/**/*.{server,db}.test.ts'],
					testTimeout: 10_000,
					globalSetup: ['./tests/support/db.global-setup.ts'],
					// db test files share one container from globalSetup and reset
					// it per file — parallel files would race the reset
					fileParallelism: false,
				},
			},
			{
				extends: true,
				test: {
					name: 'browser',
					include: ['src/**/*.test.tsx', 'tests/pages/**/*.test.tsx'],
					setupFiles: ['./tests/support/mocks/styles.ts'],
					testTimeout: 15_000,
					// One chromium instance shares one module-mocker registry;
					// parallel files race it (spurious vi.mock hoisting errors,
					// failed dynamic imports). Serial files are ~30s total.
					fileParallelism: false,
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
