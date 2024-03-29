'use server';

import 'node-self';
import { authenticateViaPrivateKey, initialize, getMapId } from "./promise";
import ee from '@google/earthengine';
import collections from '../data/collection.json' assert { type: 'json' };
import clouds from '../data/cloud.json' assert { type: 'json' };
import pify from 'pify';
import indices from '../data/indices.json' assert { type: 'json' };
import bandsSets from '../data/bands.json' assert { type: 'json' };

// Cloud mask
const cloudMask = {
	s2: cloudMaskS2,
	landsat: cloudMaskLandsat
};

// Method to get images
const methods = {
	composite: medianComposite,
	latest: filterImage,
	cloudless: filterImage
};

/**
 * Filter and generate tile map to show on leaflet map
 * @param {Object} body
 * @param {import('@turf/turf').FeatureCollection} body.geojson
 * @param {[ String, String ]} body.date
 * @param {String} body.satellite
 * @param {[ String, String, String ] | [ String ]} body.bands
 * @param {String} body.method
 * @returns {Promise.<{ url: String, message: ?String, ok: Boolean }>}
 */
export default async function composite(body) {
	try {
		// Body parameter
		const { geojson, date, satellite, bands, method, visualization } = body;

		// Parse key JSON for Earth Engine authentication
		if (!(process.env.EE_KEY)){
			throw new Error('EE_KEY is not in environmental variable');
		}
		const key = JSON.parse(process.env.EE_KEY);

		// Authenticate
		await authenticateViaPrivateKey(key);

		// Initialize
		await initialize();

		// ee.Geometry for filtering image location
		const geometry = ee.Feature(geojson).geometry();

		// Satellite collection
		const collection = collections[satellite];

		// Filtered collection
		const images = ee.FeatureCollection(collection.map(id => {
			const col = ee.ImageCollection(id).filterBounds(geometry).filterDate(date[0], date[1]);
			return col
		})).flatten();

		// Methods
		let { image, id } = await methods[method]({
			images, satellite, method
		});

		// Clip the image
		image = image.clip(geometry.buffer(1e4).bounds());

		// If indices is the method then calculate indices
		let formula, palette;
		if (visualization == 'indices') {
			const indiceProp = indices.filter(dict => dict.value == bands[0])[0];
			formula = indiceProp.formula;
			palette = indiceProp.palette;
			const bandsMap = Object.fromEntries(Object.values(bandsSets[satellite]).map(dict => [ dict.label, image.select(dict.value) ]));
			image = image.expression(formula, bandsMap);
		}

		// Visualize image
		const reduce = image.select(bands).reduceRegion({
			reducer: ee.Reducer.percentile([0.1, 99.9]),
			scale: 1000,
			maxPixels: 1e13,
			geometry: image.geometry()
		});

		// Visualization parameter
		const vis = {
			bands: bands,
			min: bands.map(band => reduce.get(`${band}_p0`)),
			max: bands.map(band => reduce.get(`${band}_p100`)),
			palette: visualization == 'indices' ? palette : null,
			gamma: visualization !== 'indices' ? 1.5 : null,
		};

		// Visualized image
		const visualized = image.visualize(vis);

		// URL of the image
		const [ result, error ] = await getMapId({ image: visualized });
		
		// If it error then show the message
		if (error) {
			throw new Error(error);
		}

		// If it succed then return it as successfull
		return { url: result.urlFormat, ok: true, id }

	} catch (error) {

		// If it failed then return it as failed
		return { ok: false, message: error.message }
	}
	
}

/**
 * Function for non composite
 * @param {Object} body
 * @param {String} body.satellite
 * @param {ee.ImageCollection} body.images
 * @param {String} body.method
 * @returns {Promise.<{
 * 	image: ee.Image,
 * 	id: String
 * }>}
 */
async function filterImage(body){
	const { satellite, images, method } = body;

	// Cloud variable
	const cloud = clouds[satellite];

	// Choose n image based on filter
	let image;
	switch (method) {
		case 'cloudless':
			image = images.sort(cloud);
			break;
		case 'latest':
			image = images.sort('system:time_start', false);
			break;
	}

	// Take the first image
	image = ee.Image(image.first());

	// Image id
	const imageMetadata = pify(image.evaluate, { multiArgs: true, errorFirst: false }).bind(image);
	const [ metadata, errorMetadata ] = await imageMetadata();

	// If failed to retrieve metadata
	if (errorMetadata) {
		throw new Error(errorMetadata);
	}

	const id = metadata.id;

	return {
		image, id
	}
}

/**
 * Function to generate cloud mask median composite\
 * @param {Object} body
 * @param {ee.ImageColletion} body.images
 * @param {String} body.satellite
 * @returns {ee.Image}
 */
function medianComposite(body) {
	let { satellite, images } = body;
	images = ee.ImageCollection(images);

	const cloudMaskFunction = cloudMask[satellite];
	const median = images.map(cloudMaskFunction).median();
	return { image: median };
}

/**
 * Function for cloudmasking landsat
 * @param {ee.Image} image
 * @returns {ee.Image}
 */
function cloudMaskLandsat(image) {
	image = ee.Image(image);
	const qa = image.select(['QA_PIXEL']);
	const mask = ee.ImageCollection([1, 2, 3, 4].map(num => qa.bitwiseAnd(1 << num).eq(0))).reduce(ee.Reducer.allNonZero());
	return image.select(['SR_B.*', 'ST_B.*']).updateMask(mask);
}

/**
 * Function for cloudmasking sentinel2
 * @param {ee.Image} image
 * @returns {ee.Image}
 */
function cloudMaskS2(image) {
	image = ee.Image(image);
	const scl = image.select('SCL');
	const mask = scl.eq(3).or(scl.gte(7).and(scl.lte(10))).eq(0);
	return image.select(['B.*']).updateMask(mask);
}