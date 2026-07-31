import { Badge } from '@/components/ui/badge'
import type { IntroductionStatus } from '@/lib/introductions/lifecycle'

const STATUS_LABELS: Record<IntroductionStatus, string> = {
	pending: 'Pending',
	accepted: 'Accepted',
	connected: 'Connected',
	declined: 'Declined',
	withdrawn: 'Withdrawn',
}

export function IntroductionStatusBadge({
	status,
}: {
	status: IntroductionStatus
}) {
	if (status === 'pending') {
		return <Badge className="bg-amber/15 text-amber-foreground">Pending</Badge>
	}
	if (status === 'accepted' || status === 'connected') {
		return (
			<Badge className="border-emerald-600/40 bg-emerald-600/10 text-emerald-700">
				{STATUS_LABELS[status]}
			</Badge>
		)
	}
	return <Badge variant="muted">{STATUS_LABELS[status]}</Badge>
}
