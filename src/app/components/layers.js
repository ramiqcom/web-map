import { Context } from "../page";
import { useContext, useEffect, useId, useState } from "react";
import { Select } from './input';
import basemaps from '../data/basemap.json' assert { type: 'json' }

/**
 * Layer components
 * @returns {import("react").FunctionComponent}
 */
export default function Layers(){
	return (
		<div id="layers" className="flexible vertical gap float-panel">
			<Basemap />
			<Vector />
			<Image />
		</div>
	)
}


/**
 * Function component
 * @returns {import("react").FunctionComponent}
 */
function Basemap() {
	const { basemap, setBasemap } = useContext(Context);

	return (
		<div>
			<div>
				Basemap
			</div>

			<Select 
				options={basemaps}
				value={basemap}
				onChange={option => setBasemap(option)}
			/>
		</div>	
	)
}

/**
 * Vector layers components
 * @returns {import("react").FunctionComponent}
 */
function Vector() {
	const { geojsonRef, mapRef, geojson } = useContext(Context);
	const [ visible, setVisible ] = useState(true);
	const [ disabled, setDisabled ]= useState(true);

	useEffect(() => {
		if (geojson) {
			setDisabled(false);
		} else {
			setDisabled(true);
		}
	}, [ geojson ]);

	return (
		<div className="flexible small-gap">
			<input 
				type="checkbox" 
				checked={visible}
				disabled={disabled}
				onChange={e => {
					// Change the state
					const checked = e.target.checked;
					setVisible(checked);

					// GeoJSON and Map
					const geojsonTile = geojsonRef.current;
					const map = mapRef.current;

					// Show and hide
					if (checked) {
						map.addLayer(geojsonTile);
					} else {
						map.removeLayer(geojsonTile)
					}
				}}
			/>

			<div>
				Vector
			</div>
		</div>	
	)
}

/**
 * Image components
 * @returns {import("react").FunctionComponent}
 */
function Image() {
	const { setImageOpacity, imageUrl } = useContext(Context);
	const [ visible, setVisible ] = useState(true);
	const [ disabled, setDisabled ]= useState(true);
	
	useEffect(() => {
		if (imageUrl.length > 1) {
			setDisabled(false);
		} else {
			setDisabled(true);
		}
	}, [ imageUrl ]);

	return (
		<div className="flexible small-gap vertical">
			<div className="flexible small-gap">
				
				<input 
					type='checkbox' 
					checked={visible}
					disabled={disabled}
					onChange={e => {
						const checked = e.target.checked;
						setVisible(checked);

						const opacity = checked ? 1 : 0;
						setImageOpacity(opacity);
					}}
				/>

				<div>
					Satellite image
				</div>

			</div>
		</div>	
	)
}