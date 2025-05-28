import { useAppDispatch, useAppState } from "./GlobalContext"
import DatasetButton from './DatasetButton';
import "./Window_TrainSetup.css"
import { gql, useQuery } from "@apollo/client";
import type { Dataset } from "./GlobalTypes";
import { useEffect, useState } from "react";

const GET_DATASETS = gql`
  query {
    datasets {
      id
      title
      items {
        id
      }
    }
  }
`

type GET_DATASETS_RETURN = {
  datasets: Dataset[]
}

export default function Window_TrainSetup() {

  const { data, loading, error } = useQuery<GET_DATASETS_RETURN>(GET_DATASETS)
  
  const dispatch =  useAppDispatch()
  const state =     useAppState()

  const [datasetsSelected, setDatasetsSelected] = useState<Dataset[]>([])

  const startTraining = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Train }})
  }

  const handleToggleDataset = (dataset: Dataset) => {
    setDatasetsSelected(prev => prev.concat([dataset]))
  }

  return <div className="window" id="window--train-setup">
    <div className="window--train-setup--contents">
      <h1 className="window--train-setup--contents--title" >Training setup</h1>
      <div className="window--train-setup--dataset-select">
        {
        loading && 
        "Loading datasets..."
        }
        {
        error && 
        "Error loading datasets: Check the console for more info, if there is any 😈."
        }
        {
        data?.datasets &&
        data.datasets.map(dataset => {
          const active = !!datasetsSelected.find(d => d.id === dataset.id) ?? false
          return <DatasetButton key={dataset.id} dataset={dataset} onToggle={handleToggleDataset} flags={{active}} ></DatasetButton>
        })
        }
      </div>
      <div>Training method</div>
      <div className="window--train-setup--side a">
        <div className="window--train-setup--side--label">Front</div>
      </div>
      <div className="window--train-setup--side b">
        <div className="window--train-setup--side--label">Back</div>
      </div>
      {/* <div className="filler"></div> */}
      <button className="window--train-setup--button--begin" onClick={startTraining}>Begin</button>
    </div>
  </div>
}