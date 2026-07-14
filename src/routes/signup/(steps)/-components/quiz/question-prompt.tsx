export function QuestionPrompt({
	title,
	label,
}: {
	title: string
	label: string
}) {
	return (
		<div className="space-y-1">
			<h3 className="font-heading text-xl font-semibold tracking-tight">
				{title}
			</h3>
			<p className="text-muted-foreground text-sm">{label}</p>
		</div>
	)
}
