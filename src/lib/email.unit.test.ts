import { describe, expect, test } from 'vite-plus/test'

import { escapeEmailHtml } from './email.server'

describe('escapeEmailHtml', () => {
	test('escapes HTML text and attribute delimiters', () => {
		expect(escapeEmailHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
		)
	})
})
