import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRICE_MAX } from '@/lib/price-range'

function getMask(digits: string): string {
	return digits.length > 6 ? '0,000,000' : '000,000'
}

function applyMask(digits: string): { typed: string; ghost: string } {
	const mask = getMask(digits)
	if (digits === '') return { typed: '', ghost: mask }

	let lastTypedIndex = -1
	let digitIndex = 0
	for (let i = 0; i < mask.length; i++) {
		if (mask[i] === ',') continue
		if (digitIndex < digits.length) {
			lastTypedIndex = i
			digitIndex++
		}
	}

	let typed = ''
	let ghost = ''
	digitIndex = 0
	for (let i = 0; i < mask.length; i++) {
		if (mask[i] === ',') {
			if (i < lastTypedIndex) typed += ','
			else ghost += ','
			continue
		}
		if (digitIndex < digits.length) {
			typed += digits[digitIndex]
			digitIndex++
		} else {
			ghost += '0'
		}
	}

	return { typed, ghost }
}

export function PriceInput({
	id,
	label,
	value,
	onChange,
}: {
	id?: string
	label?: string
	value: number
	onChange: (value: number) => void
}) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isFocused, setIsFocused] = useState(false)
	const [typed, setTyped] = useState(() => value.toLocaleString())

	useEffect(() => {
		if (!isFocused) setTyped(value.toLocaleString())
	}, [value, isFocused])

	const digits = typed.replace(/\D/g, '').slice(0, 7)
	const { typed: maskedTyped, ghost } = applyMask(digits)

	const handleFocus = () => {
		setIsFocused(true)
		setTyped(value.toLocaleString())
		requestAnimationFrame(() => inputRef.current?.select())
	}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const input = event.target
		const nextDigits = input.value.replace(/\D/g, '').slice(0, 7)
		const { typed: nextTyped } = applyMask(nextDigits)
		setTyped(nextTyped)
		requestAnimationFrame(() => {
			input.setSelectionRange(nextTyped.length, nextTyped.length)
		})
	}

	const handleBlur = () => {
		setIsFocused(false)
		const numeric =
			digits === ''
				? 0
				: Number.parseInt(digits.padEnd(Math.max(digits.length, 6), '0'), 10)
		onChange(Math.min(PRICE_MAX, numeric))
	}

	return (
		<div className="space-y-1">
			{label ? (
				<Label
					htmlFor={id}
					className="text-muted-foreground text-xs font-medium"
				>
					{label}
				</Label>
			) : null}
			<div className="relative">
				<span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold">
					$
				</span>
				<div className="pointer-events-none absolute inset-y-0 right-6 left-6 flex items-center overflow-hidden text-sm font-semibold">
					<span className="text-foreground">{maskedTyped}</span>
					{isFocused && ghost ? (
						<span className="text-muted-foreground/40">{ghost}</span>
					) : null}
				</div>
				<Input
					ref={inputRef}
					id={id}
					type="text"
					inputMode="numeric"
					value={maskedTyped}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					className="text-foreground/0 w-full bg-transparent pr-6 pl-6"
					style={{ caretColor: 'hsl(var(--primary))' }}
				/>
			</div>
		</div>
	)
}
