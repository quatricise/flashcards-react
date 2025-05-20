import "./DatasetButton.css"
import type {Dataset} from "./GlobalTypes"

type Props = {
  dataset: Dataset
  onToggle: (dataset: Dataset) => void
  flags: DatasetButtonFlags
}

interface DatasetButtonFlags {
  active: boolean
}

export default function DatasetButton({ dataset, flags, onToggle }: Props) {

  let className = "dataset-button"
  if(flags.active) className += " active"

  return <div className={className} onClick={() => onToggle(dataset)}>
    {dataset.title} <span className="text--secondary">&nbsp;{`(${dataset.items.length})`}</span>
  </div>
}