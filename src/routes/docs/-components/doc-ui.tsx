import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
	ArrowLeftIcon as ArrowLeft,
	ArrowRightIcon as ArrowRight,
} from '@phosphor-icons/react'

import { cn } from '@/lib/utils/ui'

// ============================================================
// Navigation model — single source of truth for sidebar + pager
// ============================================================

export type DocPageMeta = {
	path: string
	title: string
	kicker: string
}

export const docsNav: DocPageMeta[] = [
	{ path: '/docs', title: 'Overview', kicker: 'Introductions' },
	{
		path: '/docs/lifecycle',
		title: 'Lifecycle',
		kicker: 'State machine & reveal rules',
	},
	{ path: '/docs/ui', title: 'UI', kicker: 'Surfaces & match list' },
	{ path: '/docs/payments', title: 'Payments', kicker: 'Monetization' },
	{ path: '/docs/anti-abuse', title: 'Anti-abuse', kicker: 'Trust & safety' },
	{
		path: '/docs/plan',
		title: 'Implementation Plan',
		kicker: '8 phases, one commit each',
	},
]

const docsPages = docsNav

// ============================================================
// Page scaffold
// ============================================================

export function DocPage({
	path,
	lede,
	children,
}: {
	path: string
	lede?: ReactNode
	children: ReactNode
}) {
	const index = docsPages.findIndex((page) => page.path === path)
	const page = docsPages[index]
	const prev = index > 0 ? docsPages[index - 1] : undefined
	const next = index < docsPages.length - 1 ? docsPages[index + 1] : undefined

	return (
		<div className="w-full max-w-3xl px-6 py-10 md:pl-12">
			<h1 className="text-3xl font-bold">{page?.title}</h1>
			{lede ? (
				<p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
					{lede}
				</p>
			) : null}
			<div className="mt-8 space-y-8">{children}</div>
			<nav className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
				{prev ? (
					<Link
						to={prev.path}
						className="hover:border-accent group rounded-xl border p-4 transition-colors"
					>
						<span className="text-muted-foreground flex items-center gap-1 text-xs">
							<ArrowLeft className="size-3" /> Previous
						</span>
						<span className="mt-1 block text-sm font-semibold">
							{prev.title}
						</span>
					</Link>
				) : (
					<span />
				)}
				{next ? (
					<Link
						to={next.path}
						className="hover:border-accent group rounded-xl border p-4 text-right transition-colors sm:col-start-2"
					>
						<span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
							Next <ArrowRight className="size-3" />
						</span>
						<span className="mt-1 block text-sm font-semibold">
							{next.title}
						</span>
					</Link>
				) : null}
			</nav>
		</div>
	)
}

// ============================================================
// Content primitives
// ============================================================

export function DocSection({
	title,
	children,
	className,
}: {
	title?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<section className={cn('space-y-4', className)}>
			{title ? (
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
			) : null}
			{children}
		</section>
	)
}

export function DocSubSection({
	title,
	children,
	className,
}: {
	title?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<div className={cn('space-y-2', className)}>
			{title ? <h3 className="text-base font-semibold">{title}</h3> : null}
			{children}
		</div>
	)
}

export function BulletList({ children }: { children: ReactNode }) {
	return (
		<ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
			{children}
		</ul>
	)
}

const pillTones = {
	navy: 'bg-primary text-primary-foreground',
	gold: 'bg-amber/15 text-amber-foreground border border-amber',
	green: 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/40',
	muted: 'bg-muted text-muted-foreground',
	sky: 'bg-sky/20 text-primary border border-sky',
} as const

export type PillTone = keyof typeof pillTones

export function Pill({
	tone = 'muted',
	children,
}: {
	tone?: PillTone | undefined
	children: ReactNode
}) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
				pillTones[tone],
			)}
		>
			{children}
		</span>
	)
}

export function StepList({ steps }: { steps: ReactNode[] }) {
	return (
		<ol className="space-y-3">
			{steps.map((step, i) => (
				<li key={i} className="flex gap-3 text-sm leading-relaxed">
					<span className="bg-primary text-primary-foreground mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
						{i + 1}
					</span>
					<span>{step}</span>
				</li>
			))}
		</ol>
	)
}

// ============================================================
// Table
// ============================================================

export function Table({
	headers,
	children,
}: {
	headers: ReactNode[]
	children: ReactNode
}) {
	return (
		<div className="overflow-x-auto rounded-lg border">
			<table className="w-full min-w-[560px] text-sm">
				<thead>
					<tr className="border-b">
						{headers.map((header, i) => (
							<th
								key={i}
								className="text-muted-foreground bg-muted px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>{children}</tbody>
			</table>
		</div>
	)
}

export function TableRow({ children }: { children: ReactNode }) {
	return <tr className="border-b last:border-b-0">{children}</tr>
}

export function TableCell({
	children,
	className,
}: {
	children?: ReactNode
	className?: string
}) {
	return <td className={cn('px-4 py-3 align-top', className)}>{children}</td>
}

// ============================================================
// Code block with lightweight syntax highlighting
// ============================================================

type CodeLanguage = 'typescript' | 'sql' | 'tree'

const tokenRules: Record<
	CodeLanguage,
	Array<{ type: string; regex: RegExp }>
> = {
	tree: [],
	sql: [
		{ type: 'comment', regex: /^--.*$/ },
		{ type: 'string', regex: /^'(?:[^'\\]|\\.)*'/ },
		{
			type: 'keyword',
			regex:
				/^(CREATE|TABLE|TYPE|ENUM|AS|PRIMARY|KEY|NOT|NULL|REFERENCES|UNIQUE|INDEX|WHERE|ON|DEFAULT|CONSTRAINT|CHECK|OR|AND|IS|IN|COALESCE|USING|btree|ALTER|ADD|COLUMN|IF|EXISTS|CASCADE|DROP|UPDATE|DELETE|INSERT|SELECT|FROM|JOIN|LEFT|RIGHT|INNER|OUTER|VALUES|RETURNING|BEGIN|COMMIT|ROLLBACK|TRANSACTION|WITH|LIMIT|OFFSET|ORDER|BY|GROUP|HAVING|ASC|DESC|DISTINCT|INTO|SET|FOR|ALL|ANY|SOME|EXISTS|CASE|WHEN|THEN|ELSE|END|CAST|TEXT|TIMESTAMP|BOOLEAN|INTEGER|SERIAL|VARCHAR|UUID|NUMERIC|DECIMAL|JSONB|ARRAY|TRUE|FALSE)\b/i,
		},
		{ type: 'number', regex: /^\d+(?:\.\d+)?/ },
		{ type: 'operator', regex: /^[(),.;=<>!+\-*/{}[\]]+/ },
		{ type: 'identifier', regex: /^"[^"]*"/ },
		{ type: 'identifier', regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
		{ type: 'whitespace', regex: /^\s+/ },
		{ type: 'other', regex: /^./ },
	],
	typescript: [
		{ type: 'comment', regex: /^\/\/.*$/ },
		{ type: 'comment', regex: /^\/\*[\s\S]*?\*\// },
		{ type: 'string', regex: /^`(?:[^`\\]|\\.)*`/ },
		{ type: 'string', regex: /^"(?:[^"\\]|\\.)*"/ },
		{ type: 'string', regex: /^'(?:[^'\\]|\\.)*'/ },
		{
			type: 'keyword',
			regex:
				/^(import|export|from|default|as|type|interface|class|extends|implements|new|this|super|static|readonly|public|private|protected|const|let|var|function|return|if|else|switch|case|break|continue|for|while|do|try|catch|finally|throw|async|await|yield|typeof|instanceof|in|of|void|delete|true|false|null|undefined|enum|namespace|module|declare|abstract|get|set)\b/,
		},
		{
			type: 'type',
			regex:
				/^(string|number|boolean|bigint|symbol|any|unknown|never|void|object|Date|Array|Record|Pick|Omit|Partial|Required|Readonly|NonNullable|Exclude|Extract|Promise|Map|Set|JSON|Error|RegExp|Date)\b/,
		},
		{ type: 'number', regex: /^\d+(?:\.\d+)?/ },
		{
			type: 'operator',
			regex:
				/^(=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\*\*|->|::|[+\-*/%=<>!&|:;,.?(){}[\]])/,
		},
		{ type: 'identifier', regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/ },
		{ type: 'whitespace', regex: /^\s+/ },
		{ type: 'other', regex: /^./ },
	],
}

const tokenColors: Record<string, string> = {
	comment: 'text-[oklch(0.65_0.03_250)]',
	string: 'text-[oklch(0.75_0.12_145)]',
	keyword: 'text-[oklch(0.78_0.11_300)]',
	type: 'text-[oklch(0.75_0.1_215)]',
	number: 'text-[oklch(0.78_0.12_75)]',
	operator: 'text-[oklch(0.8_0.04_250)]',
	identifier: 'text-[oklch(0.93_0.01_250)]',
	whitespace: 'text-[oklch(0.93_0.01_250)]',
	other: 'text-[oklch(0.93_0.01_250)]',
}

function tokenizeLine(line: string, language: CodeLanguage) {
	if (language === 'tree') {
		const [text, comment] = splitTreeComment(line)
		return [
			{ type: 'identifier', value: text },
			...(comment ? [{ type: 'comment', value: comment }] : []),
		]
	}

	const tokens: Array<{ type: string; value: string }> = []
	let remaining = line

	while (remaining.length > 0) {
		let matched = false
		for (const rule of tokenRules[language]) {
			const match = rule.regex.exec(remaining)
			if (match && match[0].length > 0) {
				tokens.push({ type: rule.type, value: match[0] })
				remaining = remaining.slice(match[0].length)
				matched = true
				break
			}
		}
		if (!matched) {
			tokens.push({ type: 'other', value: remaining.charAt(0) })
			remaining = remaining.slice(1)
		}
	}

	return tokens
}

function splitTreeComment(line: string): [string, string | null] {
	const hashIndex = line.indexOf('#')
	if (hashIndex === -1) return [line, null]
	return [line.slice(0, hashIndex), line.slice(hashIndex)]
}

export function CodeBlock({
	code,
	language = 'tree',
}: {
	code: string
	language?: CodeLanguage
}) {
	return (
		<pre className="overflow-x-auto rounded-xl bg-[oklch(0.2_0.03_255)] p-4 font-mono text-[12.5px] leading-relaxed text-[oklch(0.93_0.01_250)] shadow-md">
			<code>
				{code.split('\n').map((line, i) => (
					<span key={i} className="block">
						{tokenizeLine(line, language).map((token, j) => (
							<span key={j} className={tokenColors[token.type]}>
								{token.value}
							</span>
						))}
						{/* Preserve empty lines */}
						{line.length === 0 ? '\u200b' : null}
					</span>
				))}
			</code>
		</pre>
	)
}
