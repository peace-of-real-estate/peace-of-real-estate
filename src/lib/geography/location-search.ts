import type { City } from './zip'

export type CitySuggestion = {
	kind: 'city'
	city: City
	agentCount: number
	enabled: boolean
}

export type CommunitySuggestion = {
	kind: 'community'
	key: string
	name: string
	label: string
	city: City
}

export type LocationSuggestion = CitySuggestion | CommunitySuggestion
