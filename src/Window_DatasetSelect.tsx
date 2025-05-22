import "./Window_DatasetSelect.css";
import { gql, useQuery, useMutation } from '@apollo/client';
import { useState } from "react";
import type { Dataset } from "./GlobalTypes";

/* COMPONENTS */
import DatasetCard from "./DatasetCard";
import Button_CreateDataset from "./Button_CreateDataset";

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

  const { data } = useQuery<GET_DATASETS_RETURN>(GET_DATASETS)

  const [deleteDatasets] = useMutation<DELETE_DATASET_RETURN>(DELETE_DATASETS, {
    onCompleted: (data) => {
      console.log("Deleted datasets: " + data.deleteDatasets.flatMap(val => val + " " ))
    },
    onError: (error) => {
      console.error("Failed to delete datasets:", error)
    },
  })

  const handleDelete = () => {
    if(datasetsSelected.length === 0) return

    const vars = {ids: datasetsSelected.map(d => d.id)}
    deleteDatasets({variables: vars})
  }

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
  /* doing no error,loading checks. */
  
  return  <div id="window--dataset-select" className="window">
            <div style={{fontSize: "2rem", margin: "0 0 20px 0"}}>
              Select datasets
            </div>
            <div className="dataset-cards">
              {data?.datasets.map(d => (
                <DatasetCard key={d.id} dataset={d} onSelectedChange={updateDatasetsSelected}></DatasetCard>
              ))}
            </div>
            <Button_CreateDataset/>
            <div className="window--dataset-select--buttons">
              <button style={{fontSize: "1rem"}} >Drink the poison</button>
              <button style={{fontSize: "1rem"}} >Edit the poison</button>
              <button style={{fontSize: "1rem"}} className="warning" onClick={handleDelete} >Delete</button>
            </div>
          </div>
}

export default Window_DatasetSelect