import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { CopyJsonButton } from '@/routes/debug/-components/copy-json-button'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface RawJsonSectionProps {
	sections: { label: string; value: unknown }[]
}

export function RawJsonSection({ sections }: RawJsonSectionProps) {
	return (
		<Card className="p-3">
			<SectionLabel>Raw data</SectionLabel>
			<Accordion type="multiple">
				{sections.map((section) => (
					<AccordionItem key={section.label} value={section.label}>
						<AccordionTrigger className="py-2 font-mono text-xs uppercase hover:no-underline">
							{section.label}
						</AccordionTrigger>
						<AccordionContent>
							<div className="mb-1.5 flex justify-end">
								<CopyJsonButton value={section.value} label="Copy" />
							</div>
							<pre className="bg-muted/40 max-h-80 overflow-auto rounded-md border px-2 py-1.5 font-mono text-xs whitespace-pre-wrap">
								{JSON.stringify(section.value, null, 2)}
							</pre>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</Card>
	)
}
