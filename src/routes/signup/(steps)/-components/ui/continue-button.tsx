import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from '@phosphor-icons/react'

export function ContinueButton({
	disabled,
	onClick,
}: {
	disabled: boolean
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
