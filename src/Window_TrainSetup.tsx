import { useAppDispatch, useAppState } from "./GlobalContext"
import DatasetButton from './DatasetButton';
import "./Window_TrainSetup.css"
import { gql, useQuery } from "@apollo/client";
import type { Dataset, TrainingSetup, TrainingData } from "./GlobalTypes";
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
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Train, datasets: datasetsSelected}})
  }

  const handleToggleDataset = (dataset: Dataset) => {
    if(datasetsSelected.find(d => d.id === dataset.id)) {
      setDatasetsSelected(prev => prev.filter(d => d.id !== dataset.id))
    } else {
      setDatasetsSelected(prev => prev.concat([dataset]))
    }
  }

  const [trainingSetup, setTrainingSetup] = useState<TrainingSetup>({A:["title"], B:["description", "images"]});

  const fieldLabel = "Click and drag this to the other side of the card to compose the desired training method."

  return <div className="window" id="window--train-setup">
    <div className="window--train-setup--contents">
      <h1 className="window--train-setup--contents--title" >Training setup</h1>
      <div className="window--train-setup--dataset-select">
        <div className="window--train-setup--dataset-select--title" >Datasets:</div>
        {
        loading && 
        "Loading datasets..."
        }
        {
        error && 
        "Error loading datasets: Check the console for more info, if there is any 😈."
        }
        <div className="window--train-setup--dataset-select--datasets">
          {
            data?.datasets !== undefined &&
            data.datasets.map(dataset => {
              const active = datasetsSelected.find(d => d.id === dataset.id) !== undefined
              return <DatasetButton key={dataset.id} dataset={dataset} onToggle={handleToggleDataset} flags={{active}} ></DatasetButton>
            })
          }
        </div>
      </div>
      <div className="window--train-setup--training-method">
        <div style={{userSelect: "none"}} >Training method</div>
        <div className="filler"></div>
        <div className="window--train-setup--training-method--randomize" >
          <label htmlFor="randomize">Randomize each card</label>
          <input type="checkbox" name="randomize" id=""/>
        </div>
      </div>
      <div className="window--train-setup--training-method-sides">
        <div className="window--train-setup--side a">
          <div className="window--train-setup--side--label">Front</div>
          {trainingSetup.A.map((field, index) => {
            return <div className="window--train-setup--training-data--field" key={index} title={fieldLabel} >{field}</div>
          })}
        </div>
        <div className="window--train-setup--side b">
          <div className="window--train-setup--side--label">Back</div>
          {trainingSetup.B.map((field, index) => {
            return <div className="window--train-setup--training-data--field" key={index} title={fieldLabel} >{field}</div>
          })}
        </div>
      </div>
      <button className="window--train-setup--button--begin" onClick={startTraining}>Begin</button>
    </div>
  </div>
}