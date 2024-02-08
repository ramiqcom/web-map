import Image from "./image";
import Layers from "./layers";

export default function Panel(){
	return (
		<div className='flexible gap vertical' id='float'>
			<Layers />
			<Image />
		</div>	
	)
}