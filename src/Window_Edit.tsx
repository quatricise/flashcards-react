import ImageDropZone from "./ImageDropZone"
import { useQuery } from "@apollo/client"
import { useState } from "react"
import { gql } from "@apollo/client"
import "./Window_Edit.css"
import ItemCard from "./ItemCard"

const GET_DATASETS = gql`
  query GetDatasets($ids: [Int!]!) {
    datasetsByIds(ids: $ids) {
      id
      title
      items {
        id
        title
        description
        images {
          id
          url
        }
      }
    }
  }
`

type Dataset = {
  id:           number;
  title:        string;
  items:        Item[];
}

type Item = {
  id: number;
  title: string;
  description: string;
  images: number[]
}

type RETURN_DATA = {
  datasetsByIds: Dataset[]
}

type Props = {
  datasetIds: number[]
}

export default function Window_Edit({datasetIds}: Props) {

  const { data, loading, error, refetch } = useQuery<RETURN_DATA>(GET_DATASETS, {
    variables: {ids: datasetIds}
  })

  const [currentItem, setCurrentItem] = useState<number | null>(null)

  const selectItem = (itemId: number) => {
    setCurrentItem(itemId)
  }
  
  const createItemCards = () => {
    if(!datasetIds.length)    return <div>datasetIds length === 0</div>
    if(loading)               return <div>Loading datasets...</div>
    if(error)                 return <div>Error loading datasets...</div>
    if(!data)                 return <div>No data</div>
    if(!data?.datasetsByIds)  return <div>No datasets</div>

    return <>
            <div className="window--edit--right-side--contents">
              {data?.datasetsByIds?.map(dataset => {
                return <>
                  <div className="window--edit--right-side--heading--dataset" key={dataset.id}>
                    {dataset.title} <span className="text--secondary">{" (" + dataset.items.length + ")"}</span>
                  </div>
                  <div className="window--edit--right-side--item-cards">
                    {dataset.items.map(item => {
                      return <ItemCard flags={{isActive: item.id === currentItem}} key={item.id} id={item.id} title={item.title} description={item.description} onDeleted={refetch} onSelect={selectItem} ></ItemCard>
                    })}
                  </div>
                </>
              })}
            </div>
          </>
  }

  const handleUpload = () => {
    //tidi dada upload to database with all the form data
  }
  
  return <>
    <div className="window" id="window--edit">
        <div className="window--edit--left-side">
          <div className="window--edit--left-side--input-form">
            
          </div>
          <ImageDropZone onUpload={handleUpload}></ImageDropZone>
        </div>

        <div className="window--edit--right-side">
          <div className="window--edit--right-side--heading">Items <span className="text--secondary">({5})</span></div>
          {createItemCards()}
        </div>
    </div>
  </>
}