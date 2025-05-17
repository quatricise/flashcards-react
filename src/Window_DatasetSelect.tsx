import "./Window_DatasetSelect.css";
import { gql, useQuery } from '@apollo/client';

/* COMPONENTS */
import DatasetCard from "./DatasetCard";
import Button_CreateDataset from "./Button_CreateDataset";

/* missing field 'datasets', when included it throws 400 Bad Request. */
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

type Dataset = {
  id:           number;
  title:        string;
  items:        number[];
}

type RETURN_DATA = {
  datasets: Dataset[]
}

function Window_DatasetSelect() {

  const { data } = useQuery<RETURN_DATA>(GET_DATASETS)
  
  /* doing no error,loading checks. */
  
  return  <div id="window--dataset-select" className="window">
            <div style={{fontSize: "2rem", margin: "0 0 20px 0"}}>
              Select datasets
            </div>
            <div className="dataset-cards">
              {data?.datasets.map(d => (
                <DatasetCard key={d.id} id={d.id} title={d.title} items={d.items}></DatasetCard>
              ))}
              <Button_CreateDataset/>
            </div>
            <div className="window--dataset-select--buttons">
              <button style={{fontSize: "1rem"}} >Train</button>
              <button style={{fontSize: "1rem"}} >Edit</button>
              <button style={{fontSize: "1rem"}} className="warning" >Delete</button>
            </div>
          </div>
}

export default Window_DatasetSelect