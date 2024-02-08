/**
 * Function for cloud masking
 * @param {Object} props
 * @param {[{ value: String | Number, label: String }]} props.options 
 * @param {{ value: String | Number, label: String }} props.value
 * @param {Function} props.onChange
 * @param {boolean} props.disabled
 * @returns {import("react").FunctionComponent}
 */
export function Select(props){
	const { options, value, onChange, disabled } = props;

	// Set selected to value
	const selected = value;

	const optionsComponents = options.map(dict => {
		const { value, label } = dict;
		const selectedOption = value == selected.value ? true : false;

		return (
			<option
				value={value} 
				label={label} 
				selected={selectedOption}
			/>
		)
	});

	return (
			<select
				disabled={disabled}
				onChange={e => {
					onChange(options[e.target.selectedIndex]);
				}}>

				{optionsComponents}

			</select>
	)
}