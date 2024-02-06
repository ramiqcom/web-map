import { useState, useContext, useEffect, useId } from "react";
import satellites from '../data/satellite.json' assert { type: "json" };
import filters from '../data/filter.json' assert { type: "json" };
import bandsSat from '../data/bands.json' assert { type: "json" };
import Select from 'react-select';
import { Context, modal } from "../page";
import composite from "../server/composite";
import { bbox, bboxPolygon } from '@turf/turf';

/**
 * Image page components
 * @returns {import("react").ReactComponentElement}
 */
export default function Image(){
	// Take variable from Context
	const { geojson, setImageUrl, dialogRef, setDialogText, setDialogColor } = useContext(Context);

	// Time object
	const miliEndDate = new Date();
	const miliStartDate = miliEndDate.getTime() - (2_592_000_000 * 3);

	// Time states
	const [ endDate, setEndDate ] = useState(miliEndDate.toISOString().split('T')[0]);
	const [ startDate, setStartDate ]= useState((new Date(miliStartDate)).toISOString().split('T')[0]);

	// Satellite state
	const [ satellite, setSatellite ] = useState(satellites[0]);

	// Filter state
	const [ filter, setFilter ] = useState(filters[0]);

	// Bands satellite set
	const [ bands, setBands ] = useState(bandsSat[satellite.value]);

	// Composite bands
	const [ red, setRed ] = useState(bands[3]);
	const [ green, setGreen ] = useState(bands[2]);
	const [ blue, setBlue ] = useState(bands[1]);

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
					instanceId={useId()}
					onChange={option => {
						setSatellite(option);
						
						// Call the new bands set
						const bands = bandsSat[option.value];

						// Set the new bands set
						setBands(bandsSat[option.value]);
						
						// Return the bands to default RGB
						setRed(bands[3]);
						setGreen(bands[2]);
						setBlue(bands[1]);
					}}
				/>
			</div>

			<div>
				<div>
					Filter
				</div>

				<Select
					options={filters}
					value={filter}
					instanceId={useId()}
					onChange={option => {
						setFilter(option);
					}}
				/>
			</div>

			<div>
				<div>
					Visualization
				</div>
				
				<div className="flexible wide">
					<Select
						options={bands}
						value={red}
						instanceId={useId()}
						onChange={option => {
							setRed(option);
						}}
					/>

					<Select
						options={bands}
						value={green}
						instanceId={useId()}
						onChange={option => {
							setGreen(option);
						}}
					/>

					<Select
						options={bands}
						value={blue}
						instanceId={useId()}
						onChange={option => {
							setBlue(option);
						}}
					/>
				</div>
				
			</div>

			<button disabled={generatorDisabled} onClick={async () => {
				try {
					// Show modal that say the image is being processed
					modal({ dialogRef, setDialogText, setDialogColor }, true, 'Processing image...', 'blue');

					// BBOX polygon
					const bounds = bboxPolygon(bbox(geojson));

					// Call the image
					const { url, message, ok } = await composite({
						geojson: bounds,
						date: [ startDate, endDate ],
						satellite: satellite.value,
						bands: [ red.value, green.value, blue.value ],
						filter: filter.value
					});

					// Throw error if the result is error
					if (!ok) {
						throw new Error(message);
					}

					// If the image url is okay then add it to the map
					setImageUrl(url);

					// Close model if success
					modal({ dialogRef, setDialogText, setDialogColor }, false);
				} catch (error) {

					// Show error message if it failed
					modal({ dialogRef, setDialogText, setDialogColor }, true, error.message, 'red');
				}
			}}>Add image to map</button>
			
		</div>
	)
}