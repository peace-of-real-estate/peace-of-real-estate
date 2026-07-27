import { ArrowRightIcon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

export function ContinueButton({
	disabled = false,
	onClick,
}: {
	disabled?: boolean
	onClick: () => void
}) {
	return (
		<Button
			onClick={onClick}
			disabled={disabled}
			size="lg"
			className="w-full gap-2"
		>
			Continue
			<ArrowRightIcon className="h-4 w-4" />
		</Button>
	)
}
