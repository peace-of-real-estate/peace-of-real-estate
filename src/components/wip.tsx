import { DashboardPage } from '@/routes/(dashboard)/-components/dashboard'
import { HardHatIcon } from '@phosphor-icons/react'

export function Wip({ title }: { title: string }) {
	return (
		<DashboardPage>
			<div className="flex flex-1 flex-col items-center justify-center text-center">
				<div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-2xl">
					<HardHatIcon className="text-muted-foreground size-8" />
				</div>
				<h1 className="font-heading text-2xl font-semibold tracking-tight">
					{title}
				</h1>
				<p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
					This page is under construction. Check back soon for updates.
				</p>
			</div>
		</DashboardPage>
	)
}
