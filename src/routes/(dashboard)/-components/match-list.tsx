import { MapPin, Star, Clock, Users } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AgentMatchData } from '@/lib/matching/match.view'

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

	return (
		<Card className="hover:border-primary/20 overflow-hidden transition-colors">
			<div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
				<div className="bg-background flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border">
					<div className="text-xl leading-none font-semibold">
						{match.fitScore}%
					</div>
					<div className="text-muted-foreground mt-1 text-[10px] tracking-wide uppercase">
						Fit
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 className="truncate text-lg font-semibold">{match.name}</h3>
						{match.isTopMatch && (
							<span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
								<Star className="h-3 w-3 fill-current" />
								Top match
							</span>
						)}
					</div>
					<p className="text-muted-foreground truncate text-sm">
						{match.agency} · {match.location}
					</p>

					<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						<span className="flex items-center gap-1">
							<MapPin className="h-3 w-3" />
							Serves {match.zipCodes.slice(0, 3).join(', ')}
							{match.zipCodes.length > 3 && '...'}
						</span>
						{match.experience && (
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{match.experience}
							</span>
						)}
						{match.stats && (
							<span className="flex items-center gap-1">
								<Users className="h-3 w-3" />
								{match.stats.transactions} deals
							</span>
						)}
					</div>

					{topSpecialties.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
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
				</div>

				<Button variant="outline" size="sm" className="shrink-0">
					View profile
				</Button>
			</div>
		</Card>
	)
}
