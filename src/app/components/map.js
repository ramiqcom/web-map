import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Context } from '../page';
import { useContext, useEffect, forwardRef } from 'react';
import vt from './vt';
import { modal } from './dialog';

/**
 * Leaflet map div
 * @returns {import("react").FunctionComponent}
 */
export default function WebMap() {
	// Context data
	const { 
		mapRef, 
		geojsonRef, 
		geojson, 
		basemap,
		imageUrl,
		imageOpacity
	} = useContext(Context);

	return (
		<MapContainer id='map' zoom={8} center={{ lat: 52.25, lng: 5.5 }} maxZoom={18} minZoom={3} ref={mapRef} zoomControl={false}>
			<TileLayer 
				url={basemap.value}
				attribution={basemap.attribution}
			/>
			<TileLayer 
				url={imageUrl}
				opacity={imageOpacity}
			/>
			<GeoJSONTile data={geojson} ref={geojsonRef}/>
		</MapContainer>
	)
}

const GeoJSONTile = forwardRef(
	/**
	 * GeoJSON tile components
	 * @param {Object} body
	 * @param {GeoJSON} body.data GeoJSON object
	 * @param {Number} body.maxZoom Maximum zoom 0 - 24 for the tile
	 * @param {Number} body.minZoom Minimum zoom 0 - 24 for the tile
	 * @param {Number} body.tolerance level of simplify to the tile (1 is original), more value mean more simplify
	 * @param {{ color: String, fillColor: String, weight: Number }} body.style Style of the geojson
	 * @param {import('react').Ref} ref
	 * @returns {import('react').VoidFunctionComponent}
	 */
	function GeoJSONTile(body, ref) {
		// Take variable from Context
		const { dialogRef, setDialogText } = useContext(Context);
		
		const styleDefault = { 
			color: '#0000ff', fillColor: '#0000ff', weight: 0.5, opacity: 1, fillOpacity: 0.1
		};

		const { data, maxZoom=17, minZoom=5, tolerance=5, style=styleDefault } = body;

		// Container
		const container = useMap();
			
		// Add data to map
		useEffect(() => {
			if (data) {
				try {
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
					
					// GeoJSON tile
					const tile = vt(data, optionsVector);
					
					// Set GeoJSON tile as ref
					ref.current = tile;

					// Add the tile to map
					container.addLayer(tile);

					// Clear effect
					return () => {
						container.removeLayer(tile);
					};

				} catch (error) {
					// Show error message if it failed
					modal({ dialogRef, setDialogText }, true, error.message, true);
				}

			}
		}, [ data ]);

		return null;
})