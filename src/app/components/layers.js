import { Context } from "../page";
import { useContext } from "react";
import Select from 'react-select';
import basemaps from '../data/basemap.json' assert { type: 'json' }

// Layers components
export default function Layers(){
	return (
		<div id="layers">
			<Basemap />
		</div>	
	)
}

// Basemap
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