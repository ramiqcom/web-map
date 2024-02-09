import { useState, useContext, useEffect, useId } from "react";
import satellites from '../data/satellite.json' assert { type: "json" };
import methods from '../data/method.json' assert { type: "json" };
import bandsSat from '../data/bands.json' assert { type: "json" };
import { Select } from './input';
import { Context } from "../page";
import composite from "../server/composite";
import { bbox, bboxPolygon } from '@turf/turf';
import { modal } from './dialog';
import visualizations from '../data/visualization.json' assert { type: "json" };
import indices from '../data/indices.json' assert { type: "json" };

/**
 * Image page components
 * @returns {import("react").ReactComponentElement}
 */
export default function Image(){
	// Take variable from Context
	const { geojson, setImageUrl, dialogRef, setDialogText, setImageId } = useContext(Context);

	// Time object
	const miliEndDate = new Date();
	const miliStartDate = miliEndDate.getTime() - (2_592_000_000 * 3);

	// Time states
	const [ endDate, setEndDate ] = useState(miliEndDate.toISOString().split('T')[0]);
	const [ startDate, setStartDate ]= useState((new Date(miliStartDate)).toISOString().split('T')[0]);

	// Satellite state
	const [ satellite, setSatellite ] = useState(satellites[0]);

	// Filter state
	const [ method, setMethod ] = useState(methods[0]);

	// Bands satellite set
	const [ bands, setBands ] = useState(bandsSat[satellite.value]);

	// Visualization type
	const [ visualization, setVisualization ] = useState(visualizations[0]);

	// Visualization choice visibility
	const [ multiVisible, setMultiVisible ] = useState(true);
	const [ singleVisible, setSingleVisible ] = useState(false);
	const [ indiceVisible, setIndiceVisible ] = useState(false);

	// Single band
	const [ band, setBand ] = useState(bands[3]);

	// Composite bands
	const [ red, setRed ] = useState(bands[3]);
	const [ green, setGreen ] = useState(bands[2]);
	const [ blue, setBlue ] = useState(bands[1]);

	// Indices
	const [ indice, setIndice ] = useState(indices[0]);

	// Visualization props
	const visProps = {
		multi: { visible: setMultiVisible, bands: [ red.value, green.value, blue.value ] },
		single: { visible: setSingleVisible, bands: [ band.value ] },
		indices: { visible: setIndiceVisible, bands: [ indice.value ] }
	};

	// Image generator function disabled
	const [ generatorDisabled, setGeneratorDisabled ] = useState(true);

	// Use effect when geojson exist
	useEffect(() => {
		if (geojson) {
			setGeneratorDisabled(false);
		} else {
			setGeneratorDisabled(true);
		}
	}, [ geojson ]);

	return (
		<div className="flexible vertical float-panel gap" id='image'>
			<div>
				Satellite image generator
			</div>

			<div className="flexible vertical small-gap" style={{ fontSize: 'small' }}>
				<div className="flexible small-gap wide">
					Start date
					<input 
						type="date" 
						value={startDate}
						disabled={generatorDisabled}
						onChange={e => {
							const date = e.target.value;
							const mili = (new Date(date)).getTime();

							if (mili > (new Date(endDate)).getTime()){
								setStartDate(endDate);
							} else {
								setStartDate(date);
							}
						}}
					/>
				</div>

				<div className="flexible small-gap wide">
					End date
					<input 
						type="date" 
						value={endDate}
						disabled={generatorDisabled}
						onChange={e => {
							const date = e.target.value;
							const mili = (new Date(date)).getTime();

							if (mili < (new Date(startDate)).getTime()){
								setEndDate(startDate);
							} else {
								setEndDate(date);
							}
						}}
					/>
				</div>
			</div>

			<div>
				<div>
					Satellite
				</div>

				<Select
					options={satellites}
					value={satellite}
					disabled={generatorDisabled}
					onChange={option => {
						setSatellite(option);
						
						// Call the new bands set
						const bands = bandsSat[option.value];

						// Set the new bands set
						setBands(bandsSat[option.value]);
						
						// Return the bands to default RGB or Red (single band)
						setBand(bands[3]);
						setRed(bands[3]);
						setGreen(bands[2]);
						setBlue(bands[1]);
					}}
				/>
			</div>

			<div>
				<div>
					Method
				</div>

				<Select
					options={methods}
					value={method}
					disabled={generatorDisabled}
					onChange={option => {
						setMethod(option);
					}}
				/>
			</div>

			<div className="flexible vertical">
				<div>
					Visualization
				</div>

				<div className="flexible vertical small-gap">
					<Select
						options={visualizations}
						value={visualization}
						disabled={generatorDisabled}
						onChange={option => {
							setVisualization(option);
							Object.keys(visProps).map(key => visProps[key].visible( key == option.value ? true : false ));
						}}
					/>
					
					<div className="flexible wide">
						<Select
							options={bands}
							value={band}
							visible={singleVisible}
							disabled={generatorDisabled}
							onChange={option => {
								setBand(option);
							}}
						/>

						<Select
							options={bands}
							value={red}
							visible={multiVisible}
							disabled={generatorDisabled}
							onChange={option => {
								setRed(option);
							}}
						/>

						<Select
							options={bands}
							value={green}
							visible={multiVisible}
							disabled={generatorDisabled}
							onChange={option => {
								setGreen(option);
							}}
						/>

						<Select
							options={bands}
							value={blue}
							visible={multiVisible}
							disabled={generatorDisabled}
							onChange={option => {
								setBlue(option);
							}}
						/>

						<Select
							options={indices}
							value={indice}
							visible={indiceVisible}
							disabled={generatorDisabled}
							onChange={option => {
								setIndice(option);
							}}
						/>						
					</div>
				</div>
				
			</div>

			<button disabled={generatorDisabled} onClick={async () => {
				try {
					// Show modal that say the image is being processed
					modal({ dialogRef, setDialogText }, true, 'Processing image...');

					// BBOX polygon
					const bounds = bboxPolygon(bbox(geojson));

					// Call the image
					const { url, message='Operation timeout', ok=false, id } = await composite({
						geojson: bounds,
						date: [ startDate, endDate ],
						satellite: satellite.value,
						bands: visProps[visualization.value].bands,
						method: method.value,
						visualization: visualization.value
					});

					// Throw error if the result is error
					if (!ok) {
						throw new Error(message);
					}

					// Set image id
					setImageId(id);

					// If the image url is okay then add it to the map
					setImageUrl(url);

					// Close model if success
					modal({ dialogRef, setDialogText }, false);
				} catch (error) {

					// Show error message if it failed
					modal({ dialogRef, setDialogText }, true, error.message, true);
				}
			}}>Add image to map</button>
			
		</div>
	)
}