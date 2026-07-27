// Encodes a (city, state) pair as a Map key. Using JSON instead of a
// hand-joined string (e.g. `${city}|${state}`) avoids key collisions if a
// city or state value ever contains the delimiter. Inputs are normalized so
// hand-written seed lists stay resilient to case/whitespace typos — Map
// lookups compare meaning, not bytes. The database keeps canonical casing;
// only the key is normalized.
export function cityKey(city: string, state: string): string {
	const normalize = (value: string) => value.trim().toLowerCase()
	return JSON.stringify([normalize(city), normalize(state)])
}
