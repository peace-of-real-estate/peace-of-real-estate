import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'

interface CopyJsonButtonProps {
	value: unknown
	label?: string | undefined
	className?: string | undefined
}

export function CopyJsonButton({
	value,
	label = 'Copy JSON',
	className,
}: CopyJsonButtonProps) {
	const [copied, setCopied] = React.useState(false)
	const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)

	React.useEffect(() => () => clearTimeout(timeoutRef.current), [])

	return (
		<Button
			variant="outline"
			size="xs"
			className={className}
			onClick={() => {
				void navigator.clipboard
					.writeText(JSON.stringify(value, null, 2))
					.then(() => {
						setCopied(true)
						clearTimeout(timeoutRef.current)
						timeoutRef.current = setTimeout(() => setCopied(false), 1500)
					})
			}}
		>
			{copied ? <Check className="text-emerald-600" /> : <Copy />}
			{label}
		</Button>
	)
}
