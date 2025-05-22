import { useState } from "react";
import "./DatasetCard.css";
import type { Dataset } from "./GlobalTypes";

type Props = {
  dataset: Dataset
  warn: boolean
  onSelectedChange: (dataset: Dataset, state: boolean) => void
}

function DatasetCard({ dataset, warn, onSelectedChange }: Props) {

  const [active, setActive] = useState<true | false>(false);

  let cardClass = "dataset-card"
  if(warn) {
    cardClass += " warning"
  } else
  if(active) {
     cardClass += " active"
  }
  

  const toggleSelected = () => {
    onSelectedChange(dataset, !active) // --→ !active because the state does does not update immediately
    setActive(active ? false : true)
  }

  return <>
          <div key={dataset.id} className={cardClass} onClick={toggleSelected} tabIndex={0}>
            <div className="dataset-card--title">
              {dataset.title}
            </div>
            <div className="dataset-card--items">
              {dataset.items.length} {dataset.items.length !== 1 ? "items" : "item"}
            </div>
          </div>
        </>
}

export default DatasetCard