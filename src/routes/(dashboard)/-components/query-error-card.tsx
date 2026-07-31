import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function QueryErrorCard({
	message,
	onRetry,
}: {
	message: string
	onRetry: () => void
}) {
	return (
		<Card className="space-y-3 py-12 text-center">
			<p className="text-sm font-medium">{message}</p>
			<Button variant="outline" size="sm" onClick={onRetry}>
				Try again
			</Button>
		</Card>
	)
}
