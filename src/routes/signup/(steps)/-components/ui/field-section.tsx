import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils/ui'

export function FieldSection({
	icon: Icon,
	title,
	description,
	action,
	children,
	className,
}: {
	icon?: ElementType
	title: ReactNode
	description?: ReactNode
	action?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<div className={cn('space-y-4', className)}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-heading flex items-center gap-2 text-base font-semibold tracking-tight">
						{Icon ? (
							<Icon
								className="text-muted-foreground h-4 w-4"
								weight="duotone"
							/>
						) : null}
						{title}
					</h3>
					{description ? (
						<p className="text-muted-foreground mt-0.5 text-sm">
							{description}
						</p>
					) : null}
				</div>
				{action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
			</div>
			{children}
		</div>
	)
}
