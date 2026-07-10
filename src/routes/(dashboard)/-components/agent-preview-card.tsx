import { MapPin, Star } from 'lucide-react'
import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/ui'

export type MatchStatus = 'pending' | 'accepted' | 'completed' | 'new'

export interface MatchDetails {
	id: string
	name: string
	role: 'agent'
	location: string
	zipCodes: string[]
	fitScore: number
	status: MatchStatus
	date: string
	avatar?: string
	experience?: string
	agency?: string
	specialties: string[]
	about: string
	scores: Record<string, number>
	contact?: {
		phone?: string
		email?: string
	}
	stats?: {
		transactions: number
		avgDays: number
		satisfaction: number
	}
	isTopMatch?: boolean
}

function InitialsAvatar({
	name,
	className,
}: {
	name: string
	className?: string
}) {
	const initials = name
		.split(' ')
		.map((n) => n[0])
		.join('')
	return (
		<div
			className={cn(
				'bg-secondary flex items-center justify-center font-medium',
				className,
			)}
		>
			{initials}
		</div>
	)
}

export function AgentPreviewCard({ match }: { match: MatchDetails }) {
	const [avatarFailed, setAvatarFailed] = useState(false)
	const showAvatar = Boolean(match.avatar) && !avatarFailed
	const topSpecialties = match.specialties.slice(0, 2)

	return (
		<Card className="hover:border-primary/20 border-border bg-card flex flex-col overflow-hidden shadow-sm transition-colors">
			<CardContent className="flex flex-1 flex-col items-center p-4 text-center">
				{showAvatar ? (
					<img
						src={match.avatar}
						alt="Agent preview"
						className="h-16 w-16 rounded-full object-cover"
						onError={() => setAvatarFailed(true)}
					/>
				) : (
					<InitialsAvatar
						name={match.name}
						className="h-16 w-16 rounded-full text-lg"
					/>
				)}
				<h4 className="text-foreground mt-3 max-w-full truncate text-sm font-bold blur-sm select-none">
					{match.name}
				</h4>
				<p className="text-muted-foreground mt-0.5 max-w-full truncate text-xs font-medium">
					{match.agency}
				</p>
				<div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px]">
					<span className="flex items-center gap-1">
						<MapPin className="h-3 w-3" />
						{match.location}
					</span>
					<span aria-hidden="true">·</span>
					<span>{match.experience}</span>
				</div>
				{topSpecialties.length > 0 && (
					<div className="mt-3 flex flex-wrap justify-center gap-1">
						{topSpecialties.map((specialty) => (
							<span
								key={specialty}
								className="bg-secondary text-secondary-foreground inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
							>
								{specialty}
							</span>
						))}
					</div>
				)}
				<div className="mt-auto flex w-full items-center justify-center gap-1.5 pt-3">
					<span className="bg-accent/15 text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
						<Star className="h-3 w-3 fill-current" />
						{match.fitScore}% match
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
