import type { StyleSpecification } from 'maplibre-gl'

export type CartoVariant = 'light_all' | 'dark_all'

/** Keyless CARTO raster basemap (light or dark) for maplibre maps. */
export function cartoRasterStyle(
	variant: CartoVariant = 'light_all',
): StyleSpecification {
	return {
		version: 8,
		sources: {
			carto: {
				type: 'raster',
				tiles: [`https://basemaps.cartocdn.com/${variant}/{z}/{x}/{y}{r}.png`],
				tileSize: 256,
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
				maxzoom: 19,
			},
		},
		layers: [
			{
				id: 'carto-layer',
				type: 'raster',
				source: 'carto',
			},
		],
	}
}
