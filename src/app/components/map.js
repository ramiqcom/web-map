import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Context } from '../page';
import { useContext, useEffect } from 'react';

// Leaflet map div
export default function WebMap() {
	// Context data
	const { mapRef, geojson, basemap } = useContext(Context);

	return (
		<MapContainer id='map' zoom={5} center={{ lat: 50, lng: 1 }} maxZoom={18} minZoom={3} ref={mapRef} zoomControl={false}>
			<TileLayer 
				url={basemap.value}
			/>
			<GeoJSONTile data={geojson} />
		</MapContainer>
	)
}

/**
 * GeoJSON tile components
 * @param {GeoJSON} data GeoJSON object
 * @param {number} maxZoom Maximum zoom 0 - 24 for the tile
 * @param {number} minZoom Minimum zoom 0 - 24 for the tile
 * @param {number} tolerance level of simplify to the tile (1 is original), more value mean more simplify
 * @param {{ color: string, fillColor: string, weight: number }} style Style of the geojson
 * @returns {void}
 */
function GeoJSONTile({ data, maxZoom=17, minZoom=5, tolerance=5, style={ color: '#0000ff', fillColor: '#0000ff4d', weight: 1 } }) {
	// Container
	const container = useMap();
		
	// Add data to map
	useEffect(() => {
		if (data) {
			const bounds = L.geoJSON(data).getBounds();
			
			// Make it to zoom to the geojson
			container.fitBounds(bounds);
			
			// Vector data visualization parameter
			const optionsVector = {
				maxZoom: 24,
				minZoom: 0,
				maxNativeZoom: maxZoom,
				minNativeZoom: minZoom,
				tolerance,
				style
			};

			const tile = vt(data, optionsVector);
			container.addLayer(tile);

			return () => {
				container.removeLayer(tile);
			};
		}
	}, [ data ]);

	return null;
}