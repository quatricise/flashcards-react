import "./Window_DatasetSelect.css";
import { gql, useQuery, useMutation } from '@apollo/client';
import { useState, useRef } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import type { Dataset } from "./GlobalTypes";

/* COMPONENTS */
import DatasetCard from "./DatasetCard";
import Button_CreateDataset from "./Button_CreateDataset";
import { useAppDispatch, useAppState } from "./GlobalContext";

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

const DELETE_DATASETS = gql`
  mutation DeleteDatasets($ids: [Int!]!) {
    deleteDatasets(ids: $ids)
  }
`

type GET_DATASETS_RETURN = {
  datasets: Dataset[]
}

type DELETE_DATASET_RETURN = {
  deleteDatasets: number[]
}

function Window_DatasetSelect() {

  const dispatch = useAppDispatch()
  const state = useAppState()

  const { data, refetch } = useQuery<GET_DATASETS_RETURN>(GET_DATASETS, {
    onCompleted: () => {
      console.log("GET_DATASETS: Fetched datasets.")
    }
  })

  const [deleteDatasets] = useMutation<DELETE_DATASET_RETURN>(DELETE_DATASETS, {
    onCompleted: (data) => {
      console.log("DELETE_DATASETS: Deleted datasets: " + data.deleteDatasets.flatMap(val => val + " " ))
      refetch()
    },
    onError: (error) => {
      console.error("DELETE_DATASETS: Failed to delete datasets:", error)
    },
  })

  const [shouldDelete, setShouldDelete] = useState<boolean>(false)

  const handleDelete = () => {
    if(datasetsSelected.length === 0) return
    if(!shouldDelete) return setShouldDelete(true)
    
    const vars = {ids: datasetsSelected.map(d => d.id)}
    deleteDatasets({variables: vars})
    setDatasetsSelected([])
  }

  const handleEdit = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Edit}})
  }

  const handleWindowClick = (e: MouseEvent) => {
    if(shouldDelete && e.target !== refButtonDelete.current) {
      setShouldDelete(false)
    }
  }

  const handleWindowKeyDown = (e: KeyboardEvent) => {
    if(shouldDelete && e.code === "Escape") {
      setShouldDelete(false)
    }
  }

  const refButtonDelete = useRef<HTMLButtonElement>(null)

  const [datasetsSelected, setDatasetsSelected] = useState<Dataset[]>([])
  
  const updateDatasetsSelected = (dataset: Dataset, state: boolean) => {
    if(state === true) {
      setDatasetsSelected(
        (prev) => {
          const newVal = prev.concat([dataset])
          console.log(newVal)
          return newVal
        }
      )
    } else {
      setDatasetsSelected(
        (prev) => {
          const newVal = prev.filter(d => d !== dataset)
          console.log(newVal)
          return newVal
        }
      )
    }
  }
  
  let textDelete = "Delete"
  let classDelete = "warning"
  if(shouldDelete) {
    textDelete = "Confirm?"
    classDelete = "warning permanent"
  }

  const isNoSelection = datasetsSelected.length === 0
  
  return  <div id="window--dataset-select" className="window" onClick={handleWindowClick} onKeyDown={handleWindowKeyDown}>
            <div style={{fontSize: "2rem", margin: "0 0 20px 0"}}>
              Select datasets
            </div>
            <div className="dataset-cards">
              {data?.datasets.map(d => {
                const warn = !!datasetsSelected.find(dataset => dataset.id == d.id) && shouldDelete
                return <DatasetCard key={d.id} dataset={d} onSelectedChange={updateDatasetsSelected} warn={warn} onRename={ /* @todo maybe check if this refreshes the view */ refetch}></DatasetCard>
              })}
            </div>
            <Button_CreateDataset onCreate={() => refetch()}/>
            <div 
              className="window--dataset-select--buttons" 
              style={isNoSelection ? {opacity: 0.5, filter: "grayscale(1)"} : undefined}
              title={isNoSelection ? "Select at least 1 dataset by clicking on it." : undefined}
            >
              <button 
              title={"Begin training on the selected datasets."}
              style={{fontSize: "1rem", pointerEvents: isNoSelection ? "none" : undefined}}
              >
                Drink the poison
              </button>
              <button 
                title={"Edit items in the selected datasets."}
                style={{fontSize: "1rem", pointerEvents: isNoSelection ? "none" : undefined}}
                onClick={handleEdit}
              >
                Edit the poison
              </button>
              <button 
                title={shouldDelete ? "To cancel: Click elsewhere or hit ESC." : "Delete selected datasets."}
                style={{fontSize: "1rem", pointerEvents: isNoSelection ? "none" : undefined}}
                className={classDelete} 
                onClick={handleDelete} 
                ref={refButtonDelete} 
              >
                {textDelete}
              </button>
            </div>
          </div>
}

export default Window_DatasetSelect