import { Context } from "../page";
import { useContext } from "react";

/**
 * Dialog components/ pop up
 * @returns {import("react").FunctionComponent}
 */
export default function Dialog(){
	const { dialogRef, dialogText } = useContext(Context);

	return (
		<dialog ref={dialogRef} id='modal' className='flexible vertical'>
			{dialogText}
		</dialog>	
	)
}

/**
 * @param {Object} states
 * @param {import("react").Ref} states.dialogRef
 * @param {import("react").SetStateAction} states.setDialogColor
 * @param {import("react").SetStateAction} states.setDialogText
 * @param {Boolean} open If true then the modal dialog is opened, if false then it will be closed
 * @param {String} text 
 * @param {String} color
 * @returns {VoidFunction}
 */
export function modal(states, open, text, error){
  const { dialogRef, setDialogText } = states;

  // Dialog components
  const dialog = dialogRef.current;

  if (!open) {
    dialog.close();
  } else {
    setDialogText(text);
    dialog.showModal();
  }

  if (error) {
    dialog.onclick = () => dialog.close();
  } else {
    dialog.onclick = null;
  }
}