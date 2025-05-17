import { gql, useMutation } from '@apollo/client';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import "./Button_CreateDataset.css";

function Button_CreateDataset() {
  const CREATE_DATASET = gql`
    mutation CreateDataset($title: String!) {
      createDataset(title: $title) {
        title
      }
    }
  `
  const [createDataset] = useMutation(CREATE_DATASET, {
    onCompleted: (data) => {
      console.log('Item added:', data.createDataset);
      
      if(datasetName.current) {
        datasetName.current.value = ""
      }
    },
    onError: (err) => {
      console.error('Failed to add item:', err.message, err.cause, err.extraInfo);
    },
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if(e.code !== "Enter") return
    
    if(datasetName.current?.value) {
      createDataset({variables: {title: datasetName.current.value}})
    }
    else {      
      createDataset({variables: {title: "Example Kubišta Torture Brain Implant"}})
    }
    return
  }

  const handleClick = () => {
    datasetName.current?.focus()
  }

  const [focus, setFocus] = useState<true | false>(false);

  const datasetName = useRef<HTMLInputElement>(null)

  let buttonClass = 'button--create-dataset'
  if(focus) buttonClass += " active"
  
  let buttonText = "New dataset"
  if(focus) buttonText = "Enter to submit"

  return (
    <button onClick={handleClick} onKeyDown={handleKeyDown} className={buttonClass} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
        {buttonText}
        <input type="text" ref={datasetName} className='button--create-dataset--input'/>
    </button>
    )
}

export default Button_CreateDataset