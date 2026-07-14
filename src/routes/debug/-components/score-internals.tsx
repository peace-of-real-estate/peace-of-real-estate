import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { BlendEquation } from '@/routes/debug/-components/blend-equation'
import { PipelineStrip } from '@/routes/debug/-components/pipeline-strip'

interface ScoreInternalsProps {
	trace: ScoreTrace
	fitScore: number
}

/**
 * Stage machinery (pipeline + blend equation), collapsed by default —
 * the verdict, gates, and dimension breakdown above answer most questions.
 */
export function ScoreInternals({ trace, fitScore }: ScoreInternalsProps) {
	return (
		<Card className="p-3">
			<Accordion type="single" collapsible>
				<AccordionItem value="internals">
					<AccordionTrigger className="py-1 text-[11px] font-semibold tracking-wide uppercase hover:no-underline">
						Score internals (pipeline + blend)
					</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-3 pt-1">
							<PipelineStrip trace={trace} fitScore={fitScore} />
							{trace.mode !== 'fallback' && <BlendEquation trace={trace} />}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Card>
	)
}
