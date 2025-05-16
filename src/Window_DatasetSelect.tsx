import "./Window_DatasetSelect.css";
import DatasetCard from "./DatasetCard";
import { gql, useQuery } from '@apollo/client';

/* missing field 'datasets', when included it throws 400 Bad Request. */
const GET_ITEMS = gql`
  query {
    items {
      id
      title
      description
    }
  }
`

type Item = {
  id:           number;
  title:        string;
  description:  string;
}

type RETURN_VALUE = {
  items: Item[]
}

function Window_DatasetSelect() {

  const { loading, data, error } = useQuery<RETURN_VALUE>(GET_ITEMS)
  
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return <div id="window-dataset-select" className="window">
    <div className="dataset-cards">
      {data?.items.map(dataset => (
        <div key={dataset.id}>{DatasetCard(dataset.id, dataset.title, dataset.description)}</div>
      ))}
    </div>
  </div>
}

export default Window_DatasetSelect