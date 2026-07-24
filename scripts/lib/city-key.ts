// Encodes a (city, state) pair as a Map key. Using JSON instead of a
// hand-joined string (e.g. `${city}|${state}`) avoids key collisions if a
// city or state value ever contains the delimiter.
export function cityKey(city: string, state: string): string {
	return JSON.stringify([city, state])
}
