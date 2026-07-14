import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/ui'

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
			className={cn(
				'w-full gap-2 rounded-4xl px-8 py-6 text-base transition-all duration-300',
				disabled
					? 'bg-muted text-muted-foreground'
					: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
			)}
		>
			Continue
			<ArrowRight className="h-5 w-5" />
		</Button>
	)
}
