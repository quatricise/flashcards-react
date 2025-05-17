import { useState } from "react";
import "./DatasetCard.css";

type Props = {
  id: number
  title: string
  items: number[]
}

function DatasetCard({id, title, items}: Props) {

  const [active, setActive] = useState<true | false>(false);

  let cardClass = "dataset-card"
  if(active) {
     cardClass += " active"
  }

  return <>
          <div key={id} className={cardClass} onClick={() => setActive(active ? false : true)} tabIndex={0}>
            <div className="dataset-card--title">
              {title}
            </div>
            <div className="dataset-card--items">
              {items.length} {items.length !== 1 ? "items" : "item"}
            </div>
          </div>
        </>
}

export default DatasetCard