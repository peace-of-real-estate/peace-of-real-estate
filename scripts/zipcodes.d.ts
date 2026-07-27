declare module 'zipcodes' {
	export interface ZipCodeRecord {
		zip: string
		latitude: number
		longitude: number
		city: string
		state: string
		country: string
	}
	export const codes: Record<string, ZipCodeRecord>
}
