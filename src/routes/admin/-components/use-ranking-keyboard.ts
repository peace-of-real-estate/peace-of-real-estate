import * as React from 'react'

interface RankingKeyboardOptions {
	/** Agent ids in visual order (qualified after filter/sort, then disqualified). */
	visibleAgentIds: string[]
	selectedAgentId: string | undefined
	onSelectAgent: (agentId: string) => void
	onToggleCompare: () => void
	onFocusFilter: () => void
	onOpenClientPicker: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target.isContentEditable ||
		target.closest('[role="dialog"]') !== null
	)
}

export function useRankingKeyboard({
	visibleAgentIds,
	selectedAgentId,
	onSelectAgent,
	onToggleCompare,
	onFocusFilter,
	onOpenClientPicker,
}: RankingKeyboardOptions): void {
	const stateRef = React.useRef({
		visibleAgentIds,
		selectedAgentId,
		onSelectAgent,
		onToggleCompare,
		onFocusFilter,
		onOpenClientPicker,
	})
	stateRef.current = {
		visibleAgentIds,
		selectedAgentId,
		onSelectAgent,
		onToggleCompare,
		onFocusFilter,
		onOpenClientPicker,
	}

	React.useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const state = stateRef.current

			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()
				state.onOpenClientPicker()
				return
			}

			if (event.metaKey || event.ctrlKey || event.altKey) return
			if (isTypingTarget(event.target)) return

			if (event.key === '/') {
				event.preventDefault()
				state.onFocusFilter()
				return
			}

			if (event.key === 'c') {
				state.onToggleCompare()
				return
			}

			const isDown = event.key === 'j' || event.key === 'ArrowDown'
			const isUp = event.key === 'k' || event.key === 'ArrowUp'
			if (!isDown && !isUp) return

			const ids = state.visibleAgentIds
			if (ids.length === 0) return
			event.preventDefault()

			const currentIndex = state.selectedAgentId
				? ids.indexOf(state.selectedAgentId)
				: -1
			const nextIndex =
				currentIndex === -1
					? isDown
						? 0
						: ids.length - 1
					: Math.min(
							Math.max(currentIndex + (isDown ? 1 : -1), 0),
							ids.length - 1,
						)
			const nextId = ids[nextIndex]
			if (nextId && nextId !== state.selectedAgentId) {
				state.onSelectAgent(nextId)
				document
					.querySelector(`[data-agent-id="${CSS.escape(nextId)}"]`)
					?.scrollIntoView({ block: 'nearest' })
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])
}
