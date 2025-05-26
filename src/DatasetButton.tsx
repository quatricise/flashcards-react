import "./DatasetButton.css"
import type { Dataset } from "./GlobalTypes"
import type { KeyboardEvent } from 'react';

type Props = {
  dataset: Dataset
  onToggle: (dataset: Dataset) => void
  flags: DatasetButtonFlags
}

interface DatasetButtonFlags {
  active: boolean
}

export default function DatasetButton({ dataset, flags, onToggle }: Props) {

  const handleKeyDown = (e: KeyboardEvent) => {
    if(e.code === "Enter" || e.code === "NumpadEnter") {
      onToggle(dataset)
    }
  }

  let className = "dataset-button"
  if(flags.active) className += " active"

  return <div className={className} onClick={() => onToggle(dataset)} onKeyDown={handleKeyDown} tabIndex={0}>
    {dataset.title} <span className="text--secondary">&nbsp;{`(${dataset.items.length})`}</span>
  </div>
}