import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AgentMatchData } from '@/lib/matching/match.view'
import { InitialsAvatar } from '@/routes/(dashboard)/-components/agent-preview-card'
import {
	ClockIcon,
	MapPinIcon,
	StarIcon,
	UsersIcon,
} from '@phosphor-icons/react'

export function MatchList({ matches }: { matches: AgentMatchData[] }) {
	return (
		<div className="space-y-3">
			{matches.map((match) => (
				<MatchCard key={match.id} match={match} />
			))}
		</div>
	)
}

function MatchCard({ match }: { match: AgentMatchData }) {
	const topSpecialties = match.specialties.slice(0, 3)
	const [avatarFailed, setAvatarFailed] = useState(false)
	const showAvatar = Boolean(match.avatar) && !avatarFailed

	return (
		<Card className="hover:border-primary/20 overflow-hidden transition-colors">
			<div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
				<div className="relative shrink-0">
					{showAvatar ? (
						<img
							src={match.avatar}
							alt={`${match.name} headshot`}
							className="h-16 w-16 rounded-full object-cover"
							onError={() => setAvatarFailed(true)}
						/>
					) : (
						<InitialsAvatar
							name={match.name}
							className="h-16 w-16 rounded-full text-lg"
						/>
					)}
					<span className="bg-background absolute -right-1 -bottom-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-semibold">
						{match.fitScore}%
					</span>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 className="truncate text-lg font-semibold">{match.name}</h3>
						{match.isTopMatch && (
							<span className="bg-amber/15 text-amber-foreground inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold">
								<StarIcon className="h-3 w-3 fill-current" />
								Top match
							</span>
						)}
					</div>
					<p className="text-muted-foreground truncate text-sm">
						{match.agency} · {match.location}
					</p>

					<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						<span className="flex items-center gap-1">
							<MapPinIcon className="h-3 w-3" />
							Serves {match.zipCodes.slice(0, 3).join(', ')}
							{match.zipCodes.length > 3 && '...'}
						</span>
						{match.experience && (
							<span className="flex items-center gap-1">
								<ClockIcon className="h-3 w-3" />
								{match.experience}
							</span>
						)}
						{match.stats && (
							<span className="flex items-center gap-1">
								<UsersIcon className="h-3 w-3" />
								{match.stats.transactions} deals
							</span>
						)}
					</div>

					{topSpecialties.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{topSpecialties.map((specialty) => (
								<span
									key={specialty}
									className="bg-secondary text-secondary-foreground inline-block rounded-sm px-2 py-0.5 text-xs font-medium"
								>
									{specialty}
								</span>
							))}
						</div>
					)}
				</div>

				<Button variant="outline" size="sm" className="shrink-0">
					View profile
				</Button>
			</div>
		</Card>
	)
}
