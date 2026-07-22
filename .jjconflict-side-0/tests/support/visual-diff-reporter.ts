import { readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import type { Reporter, TestModule, Vitest } from 'vitest/node'

/**
 * Writes every failed `toMatchScreenshot` comparison into a single
 * self-contained `visual-diffs.html` (images inlined as base64), so a CI
 * artifact can be inspected by opening one file — no static server needed,
 * unlike the official HTML report.
 *
 * Reads the same visual-regression artifacts Vitest's own reporters consume,
 * so there is no filesystem-layout guessing involved.
 */

interface Failure {
	title: string
	message: string
	images: { name: string; path: string }[]
}

function toDataUri(path: string) {
	return `data:image/png;base64,${readFileSync(path).toString('base64')}`
}

function collectFailures(root: string, testModules: ReadonlyArray<TestModule>) {
	// the matcher polls and records an artifact per attempt, with every attempt
	// writing to the same files — key by those paths so only the last one wins
	const failures = new Map<string, Failure>()

	for (const testModule of testModules) {
		for (const testCase of testModule.children.allTests()) {
			for (const artifact of testCase.artifacts()) {
				if (artifact.type !== 'internal:toMatchScreenshot') continue

				const paths = artifact.attachments.flatMap(({ path }) => path ?? [])
				if (paths.length === 0) continue

				failures.set(`${testCase.id}:${paths.join(':')}`, {
					title: `${relative(root, testModule.moduleId)} › ${testCase.fullName}`,
					message: artifact.message,
					images: artifact.attachments.flatMap(({ name, path }) =>
						path ? [{ name, path }] : [],
					),
				})
			}
		}
	}

	return Array.from(failures.values())
}

function escapeHtml(text: string) {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

function renderFailure(failure: Failure, index: number) {
	const sources = new Map(
		failure.images.map(({ name, path }) => [name, toDataUri(path)]),
	)
	const figures = Array.from(sources)
		.map(
			([name, src]) =>
				`<figure><figcaption>${name}</figcaption><img src="${src}" alt="${name}" /></figure>`,
		)
		.join('\n')

	const reference = sources.get('reference')
	const actual = sources.get('actual')
	const overlay =
		reference && actual
			? `<div class="stack">
				<img src="${reference}" alt="reference" />
				<img id="top-${index}" class="top" src="${actual}" alt="actual" />
			</div>
			<label>reference <input type="range" min="0" max="100" value="100"
				oninput="document.getElementById('top-${index}').style.opacity = this.value / 100" /> actual</label>`
			: ''

	return `<section>
		<h2>${escapeHtml(failure.title)}</h2>
		<p class="message">${escapeHtml(failure.message)}</p>
		<div class="row">${figures}</div>
		${overlay}
	</section>`
}

function renderReport(failures: Failure[]) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Screenshot failures (${failures.length})</title>
<style>
	body { font-family: system-ui, sans-serif; margin: 2rem; background: #f6f6f7; color: #1a1a1a; }
	section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 2rem; }
	h2 { font-size: 1rem; font-family: ui-monospace, monospace; }
	.message { white-space: pre-wrap; font-size: 0.85rem; color: #666; }
	.row { display: flex; gap: 1rem; overflow-x: auto; margin-bottom: 1rem; }
	figure { margin: 0; min-width: 0; }
	figcaption { font-size: 0.8rem; color: #666; margin-bottom: 0.25rem; }
	img { max-width: 100%; height: auto; border: 1px solid #ccc; display: block; }
	.stack { position: relative; display: inline-block; }
	.stack .top { position: absolute; inset: 0; }
	label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #666; margin-top: 0.5rem; }
	input[type='range'] { width: 240px; }
</style>
</head>
<body>
<h1>Screenshot failures (${failures.length})</h1>
<p>Drag the slider under each failure to crossfade between reference and actual.</p>
${failures.map((failure, index) => renderFailure(failure, index)).join('\n')}
</body>
</html>`
}

export default class VisualDiffReporter implements Reporter {
	private vitest!: Vitest

	onInit(vitest: Vitest) {
		this.vitest = vitest
	}

	onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
		const root = this.vitest.config.root
		const failures = collectFailures(root, testModules)
		if (failures.length === 0) return

		const reportPath = resolve(root, 'visual-diffs.html')
		writeFileSync(reportPath, renderReport(failures))
		this.vitest.logger.log(
			`Visual diff report written to ${relative(root, reportPath)} (${failures.length} failure(s))`,
		)
	}
}
