import { describe, expect, test } from 'vitest'

import { sanitizeRedirectPath } from './redirect'

describe('sanitizeRedirectPath', () => {
	test('passes through same-origin paths', () => {
		expect(sanitizeRedirectPath('/buyer/matches')).toBe('/buyer/matches')
		expect(sanitizeRedirectPath('/auth/complete?role=buyer')).toBe(
			'/auth/complete?role=buyer',
		)
		expect(sanitizeRedirectPath('/')).toBe('/')
	})

	test('rejects absolute and protocol-relative URLs', () => {
		expect(sanitizeRedirectPath('https://evil.example')).toBe('/')
		expect(sanitizeRedirectPath('//evil.example')).toBe('/')
		expect(sanitizeRedirectPath('/\\evil.example')).toBe('/')
		expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/')
	})

	test('rejects ASCII control characters', () => {
		expect(sanitizeRedirectPath('/path\t//evil.example')).toBe('/')
		expect(sanitizeRedirectPath('/path\r\n//evil.example')).toBe('/')
		expect(sanitizeRedirectPath('/path\nsegment')).toBe('/')
		expect(sanitizeRedirectPath('/path\x00segment')).toBe('/')
	})

	test('falls back on empty values', () => {
		expect(sanitizeRedirectPath(undefined)).toBe('/')
		expect(sanitizeRedirectPath(null)).toBe('/')
		expect(sanitizeRedirectPath('')).toBe('/')
	})

	test('uses the provided fallback', () => {
		expect(sanitizeRedirectPath('https://evil.example', '/buyer/matches')).toBe(
			'/buyer/matches',
		)
	})
})
