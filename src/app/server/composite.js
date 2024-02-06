'use server';

import 'node-self';
import { authenticateViaPrivateKey, initialize, mapid } from "./promise";
import ee from '@google/earthengine';
import collections from '../data/collection.json' assert { type: 'json' };
import clouds from '../data/cloud.json' assert { type: 'json' };

/**
 * Filter and generate tile map to show on leaflet map
 * @param {import('@turf/turf').FeatureCollection} geojson
 * @param {[ String, String ]} date
 * @param {String} satellite
 * @param {[ String, String, String ]} bands
 * @param {String} filter
 * @returns {{ url: String, message: String?, ok: Boolean }}
 */
export default async function composite({ geojson, date, satellite, bands, filter }) {
	try {
		// Parse key JSON for Earth Engine authentication
		const key = JSON.parse(process.env.EE_KEY);

		// Authenticate
		await authenticateViaPrivateKey(key);

		// Initialize
		await initialize(null, null);

		// ee.Geometry for filtering image location
		const geometry = ee.Feature(geojson).geometry();

		// Satellite collection
		const collection = collections[satellite];

		// Cloud variable
		const cloud = clouds[satellite];

		// Filtered collection
		const images = ee.FeatureCollection(collection.map(id => {
			const col = ee.ImageCollection(id).filterBounds(geometry).filterDate(date[0], date[1]);
			return col
		})).flatten();

		// Choose n image based on filter
		let image;
		switch (filter) {
			case 'cloudless':
				image = images.sort(cloud);
				break;
			case 'latest':
				image = images.sort('system:time_start', false);
				break;
		}
		image = ee.Image(image.first()).clip(geometry.buffer(1e4).bounds());

		// Visualize image
		const reduce = image.select(bands).reduceRegion({
			reducer: ee.Reducer.percentile([2, 98]),
			scale: 100,
			maxPixels: 1e13,
			geometry: image.geometry()
		});

		// Visualization parameter
		const vis = {
			bands: bands,
			min: bands.map(band => reduce.get(`${band}_p2`)),
			max: bands.map(band => reduce.get(`${band}_p98`)),
			gamma: 1.25
		};

		// Visualized image
		const visualized = image.visualize(vis);

		// URL of the image
		const [ result, error ] = await mapid({ image: visualized });
		
		// If it error then show the message
		if (error) {
			throw new Error(error);
		}

		// If it succed then return it as successfull
		return { url: result.urlFormat, ok: true }

	} catch (error) {

		// If it failed then return it as failed
		return { ok: false, message: error.message }
	}
	
}