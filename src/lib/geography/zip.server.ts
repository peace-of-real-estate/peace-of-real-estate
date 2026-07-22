import { and, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { cities } from '@/db/tables'

export async function resolveCityCenter(
	cityState: { city: string; state: string },
	q: Pick<typeof db, 'select'> = db,
): Promise<{ latitude: number; longitude: number } | undefined> {
	const [row] = await q
		.select({ centerLat: cities.centerLat, centerLng: cities.centerLng })
		.from(cities)
		.where(
			and(eq(cities.city, cityState.city), eq(cities.state, cityState.state)),
		)
		.limit(1)

	if (!row) return undefined
	return { latitude: row.centerLat, longitude: row.centerLng }
}
