export function QuestionPrompt({
	title,
	subtitle,
}: {
	title: string
	subtitle?: string | undefined
}) {
	return (
		<div className="space-y-1">
			<h3 className="font-heading text-2xl font-semibold tracking-tight">
				{title}
			</h3>
			{subtitle ? (
				<p className="text-muted-foreground text-sm">{subtitle}</p>
			) : null}
		</div>
	)
}
