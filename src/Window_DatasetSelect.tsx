import "./Window_DatasetSelect.css";
import DatasetCard from "./DatasetCard";

function Window_DatasetSelect() {

  //now do some database shit

  return <div id="window-dataset-select" className="window">
    {DatasetCard()}
  </div>
}

export default Window_DatasetSelect