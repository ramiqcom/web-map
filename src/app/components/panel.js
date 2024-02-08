import Image from "./image";
import Layers from "./layers";

/**
 * Export panel app components
 * @returns {import("react").FunctionComponent}
 */
export default function Panel(){
	return (
		<div className='flexible gap vertical' id='float'>
			<Layers />
			<Image />
		</div>	
	)
}