import { ArrowRightIcon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

export function ContinueButton({
	disabled = false,
	onClick,
	label = 'Continue',
}: {
	disabled?: boolean
	onClick: () => void
	label?: string
}) {
	return (
		<Button
			onClick={onClick}
			disabled={disabled}
			size="lg"
			className="w-full gap-2"
		>
			{label}
			<ArrowRightIcon className="h-4 w-4" />
		</Button>
	)
}
