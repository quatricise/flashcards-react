import { useRef, useState } from "react";
import type { MouseEvent, KeyboardEvent } from "react"
import type { Dataset } from "./GlobalTypes";
import { gql, useMutation } from "@apollo/client";
import "./DatasetCard.css";

type Props = {
  dataset: Dataset
  warn: boolean
  onSelectedChange: (dataset: Dataset, state: boolean) => void
  onRename: () => void
}

const RENAME_DATASET = gql`
  mutation RenameDataset($id: Int!, $title: String!) {
    renameDataset(id: $id, title: $title) {
      id
      title
    }
  }
`

type RENAME_DATASET_RETURN = {
  renameDataset: Dataset
}

function DatasetCard({ dataset, warn, onSelectedChange, onRename }: Props) {

  const [isActive, setIsActive]             = useState<true | false>(false);
  const [isHover, setIsHover]               = useState<true | false>(false);
  const [isRenaming, setIsRenaming]         = useState<true | false>(false);

  let cardClass = "dataset-card"
  if(isRenaming) {
    cardClass += " renaming"
  } 
  if(isActive) {
     cardClass += " active"
  } 
  if(warn) {
    cardClass += " warning"
  }

  const handleMouseEnter = () => {
    setIsHover(true)
  }

  const handleMouseLeave = () => {
    setIsHover(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if(!isRenaming) return
    if(e.code === "Enter") {
      tryRename()
    } else
    if(e.code === "Escape") {
      exitRenameMode()
    }
  }

  const tryRename = () => {
    const title = refRenameInput.current?.value
    if(!title) return

    renameDataset({variables: {id: dataset.id, title: title}})
    .then(() => {
      onRename()
    })
    .finally(() => {
      exitRenameMode()
    })
  }

  const enterRenameMode = () => {
    if(isRenaming) return

    refRenameInput.current?.focus()
    setIsRenaming(true)
  }

  const exitRenameMode = () => {
    if(!isRenaming) return

    refRenameInput.current?.blur()
    setIsRenaming(false)
  }

  const handleInputBlur = () => {
    exitRenameMode()
  }

  const [renameDataset] = useMutation<RENAME_DATASET_RETURN>(RENAME_DATASET)

  const refIconRename = useRef<HTMLDivElement>(null)
  const refRenameInput = useRef<HTMLInputElement>(null)
  const refCard = useRef<HTMLDivElement>(null)

  const handleClick = (e: MouseEvent) => {
    if(e.target === refIconRename.current) return
    if(e.target === refRenameInput.current) return

    console.log(e.target)

    onSelectedChange(dataset, !isActive) // '!active' because of the state update delay
    setIsActive(isActive ? false : true)
  }

  if(isRenaming) {
    refRenameInput.current?.focus()
  }


  return <>
          <div 
          ref={refCard} 
          key={dataset.id} 
          className={cardClass} 
          onKeyDown={handleKeyDown} 
          onClick={handleClick} 
          tabIndex={0}
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}>
            {
            !isRenaming &&
            <div className="dataset-card--title">
              {dataset.title}
            </div>
            }
            {
            !isHover && !isRenaming &&
            <div className="dataset-card--items">
              {dataset.items.length} {dataset.items.length !== 1 ? "items" : "item"}
            </div>
            }
            {
            isHover && !isRenaming &&
            <div ref={refIconRename} className="icon edit" title="Rename" onClick={enterRenameMode}></div>
            }
            {
            isRenaming &&
            <input 
            className="dataset-card--rename-input" 
            type="text" 
            placeholder={dataset.title} 
            ref={refRenameInput} 
            onBlur={() => handleInputBlur()}/>
            }
          </div>
        </>
}

export default DatasetCard