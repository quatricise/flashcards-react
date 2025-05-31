import { useAppDispatch, useAppState } from "./GlobalContext"
import DatasetButton from './DatasetButton';
import "./Window_TrainSetup.css"
import { gql, useQuery } from "@apollo/client";
import type { Dataset, TrainingSetup, TrainingData } from "./GlobalTypes";
import { useState } from "react";



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
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Train, datasets: datasetsSelected, trainingSetup: trainingSetup}})
  }

  const handleToggleDataset = (dataset: Dataset) => {
    if(datasetsSelected.find(d => d.id === dataset.id)) {
      setDatasetsSelected(prev => prev.filter(d => d.id !== dataset.id))
    } else {
      setDatasetsSelected(prev => prev.concat([dataset]))
    }
  }

  const [trainingSetup, setTrainingSetup] = useState<TrainingSetup>({A:["images"], B:["title", "description"]});

  const fieldLabel = "Click and drag this to the other side of the card to change when it's displayed."
  
  let buttonBeginClass = "window--train-setup--button--begin"
  let buttonBeginText = "Begin"
  if(datasetsSelected.length === 0) {
    buttonBeginClass += " disabled"
    buttonBeginText = "Select datasets to begin"
  }
  


  return <div className="window" id="window--train-setup">
    <div className="window--train-setup--contents">
      <h1 className="window--train-setup--contents--title" >Training setup</h1>
      <div className="window--train-setup--dataset-select">
        <div className="window--train-setup--dataset-select--heading">
          <div className="window--train-setup--dataset-select--title" >Datasets:</div>
          <div className="filler"></div>
          <div className="window--train-setup--dataset-select--item-count" style={{cursor: "help"}} title="Some items may exist on multiple datasets, each will only be used once." >
            <span>Total unique items:&nbsp;</span>
            {(() => {
              const uniqueItemIds: Set<number> = new Set()
              datasetsSelected.forEach(d => d.items.forEach(i => uniqueItemIds.add(i.id)))
              return <span>{uniqueItemIds.size}</span>
            })()}
            </div>
        </div>
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
              if(dataset.items.length === 0) return
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
              {trainingSetup.A.map((field) => {
                return <div key={field} className="window--train-setup--training-data--field" title={fieldLabel}>{field}</div>
              })}
          </div>

            <div className="window--train-setup--side b">
              <div className="window--train-setup--side--label">Back</div>
              {trainingSetup.B.map((field) => {
                return <div key={field} className="window--train-setup--training-data--field" title={fieldLabel}>{field}</div>
              })}
          </div>
        </div>

      <button className={buttonBeginClass} onClick={startTraining}>{buttonBeginText}</button>
    </div>
  </div>
}