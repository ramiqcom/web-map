/**
 * Function for cloud masking
 * @param {Object} props
 * @param {[{ value: String | Number, label: String }]} props.options 
 * @param {{ value: String | Number, label: String }} props.value
 * @param {Function} props.onChange
 * @param {Boolean} props.disabled
 * @param {Boolean} props.visible
 * @returns {import("react").FunctionComponent}
 */
export function Select(props){
	const { options, value, onChange, disabled, visible=true } = props;

	const optionsComponents = options.map((dict, index) => {
		const { value, label } = dict;

		return (
			<option
				value={value} 
				label={label} 
				key={index}
			/>
		)
	});

	return (
			<select
				value={value.value}
				style={{
					display: visible ? 'flex' : 'none'
				}}
				disabled={disabled}
				onChange={e => {
					onChange(options[e.target.selectedIndex]);
				}}>

				{optionsComponents}

			</select>
	)
}