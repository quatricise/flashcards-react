import { gql, useMutation, useQuery } from "@apollo/client"
import { useState, useRef, useEffect } from "react"

import ImageDropZone from "./ImageDropZone"
import ItemCard from "./ItemCard"

import type {Item, Dataset, ImageType } from "./GlobalTypes"

import "./Window_Edit.css"
import DatasetButton from "./DatasetButton"

const GET_DATASETS = gql`
  query GetDatasets($ids: [Int!]!) {
    datasetsByIds(ids: $ids) {
      id
      title
      items {
        id
        title
        description
        datasets {
          id
        }
        images {
          id
          url
        }
      }
    }
  }
`

const CREATE_ITEM = gql`
  mutation CreateItem($title: String!, $description: String!, $datasets: [Int!]!) {
    createItem(title: $title, description: $description, datasets: $datasets) {
      title
      description
      datasets
    }
  }
`

const CREATE_IMAGE = gql`
  mutation CreateImage($url: String!, $items: [Int!]!) {
    createImage(url: $url, items: $items) {
      url
      items
    }
  }
`

type GET_DATASETS_RETURN = {
  datasetsByIds: Dataset[]
}

type CREATE_ITEM_RETURN = {
  item: Item
}

type Props = {
  datasetIds: number[]
}

type UploadData = {
  title:        string
  description:  string
  images:       File[]
  datasets:     Dataset[]
}



export default function Window_Edit({datasetIds}: Props) {

  const { data, loading, error, refetch } = useQuery<GET_DATASETS_RETURN>(GET_DATASETS, {
    variables: {ids: datasetIds}
  })

  const items: Map<number, Item> = new Map() //oh god this has to be managed by the useState monster
  
  data?.datasetsByIds.forEach(dataset => {
    dataset.items.forEach(item => items.set(item.id, item))
  })
  
  // const [windowState, setWindowState] = useState<"add"|"edit">("add");

  const [currentItemId, setCurrentItemId] = useState<number>(0)

  const uploadData: UploadData = {title: "Empty", description: "Empty", images: [], datasets: []}

  const inputTitle = useRef<HTMLInputElement>(null)
  const inputDescription = useRef<HTMLTextAreaElement>(null)
  
  const selectItem = (id: number) => {
    setCurrentItemId(id)
  }

  const handleImageChange = (images: File[]) => {
    uploadData.images = images
  }

  const handleTitleChange = () => {
    uploadData.title = String(inputTitle.current?.value)
  }
  const handleDescriptionChange = () => {
    uploadData.description = String(inputDescription.current?.value)
  }  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(uploadData)
    uploadItemSingle({variables: { title: uploadData.title, description: uploadData.description, datasets: uploadData.datasets}})
  }

  const [uploadItemSingle] = useMutation<CREATE_ITEM_RETURN>(CREATE_ITEM, {
    onCompleted: (data) => {
      setCurrentItemId(data.item.id)
      //@todo, well this works, but it's flimpy, the useState fucks me here, I can't actually use it properly , i need to do this without the stupid thing
      uploadImageFiles(data.item.id) 
    },
    onError: (err) => {
      console.log(err.message)
    },
  })

  const [uploadImageSingle] = useMutation(CREATE_IMAGE, {
    onCompleted: (data) => {
      console.log(data)
    },
    onError: (err) => {
      console.log(err.message)
    },
  })
  
  /** @description Uploads files to server, then puts a record into the database after the image URL has been returned. */
  const uploadImageFiles = async (itemId: number) => {
    if(uploadData.images.length > 0) {
      /* upload actual image files */
      const imageForm = new FormData();
      uploadData.images.forEach(img => imageForm.append('image', img))

      const res = await fetch('http://localhost:4000/api/upload', { //should setup proxy once this goes live
        method: 'POST',
        body: imageForm,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if(!data.url) {
        throw new Error("No 'url' property on response.")
      }

      uploadImageSingle({
        variables: {url: data.url, items: [itemId]} //just sends the current item into items, but I think that will be how it works in the end
      })

    }
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
              return <div key={dataset.id} className="window--edit--right-side--contents-block" >
                <div className="window--edit--right-side--heading--dataset" key={dataset.id}>
                  {dataset.title} <span className="text--secondary">{" (" + dataset.items.length + ")"}</span>
                </div>
                <div className="window--edit--right-side--item-cards">
                  {dataset.items.map(item => {
                    return <ItemCard item={item} flags={{isActive: item.id === currentItemId}} key={item.id} onDeleted={refetch} onSelect={selectItem} ></ItemCard>
                  })}
                </div>
              </div>
            })}
          </div>
        </>
  }

  const createDatasetButtons = () => {
    const item = items.get(currentItemId)
    if(!item) return null
    
    return <>
        {data?.datasetsByIds.map(dataset => {
          const active = items.get(currentItemId)?.datasets.find(d => d.id === dataset.id);
          return <DatasetButton key={dataset.id} dataset={dataset} flags={{ active: !!active }} onToggle={handleDatasetToggle}></DatasetButton>
        })}
    </>
  }
  /** Handles what happens when you click the dataset button on left-side. */
  const handleDatasetToggle = (dataset: Dataset) => {
    const item = items.get(currentItemId)
    if(!item) return

    const datasets = item.datasets
    if(item.datasets.find(d => d.id === dataset.id)) {
      item.datasets = datasets.filter(d => d.id === dataset.id)
    }
    else {
      item.datasets.push({id: dataset.id})
    }
  }

  let textHeadingLeft = <span>New item</span>
  let textSubmitValue = "Add item"

  if(currentItemId !== 0) {
    textHeadingLeft = <span>
      <span>Editing item: </span>
      <span className="text--secondary">{items.get(currentItemId)?.title}</span>
    </span>
    textSubmitValue = "Update item"
  }
  
  return <>
    <div className="window" id="window--edit">
        <div className="window--edit--left-side">
          <h1 className="window--edit--left-side--heading">{textHeadingLeft}</h1>
          <div className="window--edit--left-side--dataset-list">
            {createDatasetButtons()}
          </div>
          <form className="window--edit--left-side--input-form" onSubmit={handleSubmit}>
            <input type="text" name="title" id="" placeholder="Title" onChange={handleTitleChange} ref={inputTitle} />
            <textarea name="description" id="" placeholder="Description" onChange={handleDescriptionChange} ref={inputDescription} />
            <ImageDropZone onImagesChange={handleImageChange} itemId={currentItemId ?? null}></ImageDropZone> {/* create some .value on this that acts as the file input value */}

            <div className="window--edit--left-side--bottom-bar">
              <h2 className="window--edit--left-side--bottom-bar--heading" >{textHeadingLeft}</h2>
              <div style={{flexGrow: 1}}></div>
              {currentItemId !== 0 ? <button className="window--edit--left-side--button--cancel">Discard changes</button> : null}
              <input type="submit" value={textSubmitValue}/>
            </div>
          </form>
        </div>

        <div className="window--edit--right-side">
          <div className="window--edit--right-side--heading">Items <span className="text--secondary">({items.size})</span></div>
          {createItemCards()}
        </div>
    </div>
  </>
}