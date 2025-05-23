import { gql, useMutation, useQuery } from "@apollo/client"
import { useState, useRef, useEffect, useCallback } from "react"

import ImageDropZone from "./ImageDropZone"
import ItemCard from "./ItemCard"
import DatasetButton from "./DatasetButton"

import { motion, useAnimation } from "motion/react"

import type {Item, Dataset, ImageType, DatasetRef } from "./GlobalTypes"

import "./Window_Edit.css"
import { waitFor } from "./GlobalFunctions"

/** 
 * We get ALL THE DATA for now. 
 * It's easier to work with, albeit inefficient if the total payload grows too much. 
 * It's obviously far below efficient to query this much redundant data.
 * */
const GET_ITEMS_AND_DATASETS = gql`
  query GetItems {
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
    datasets {
      id
      title
      items {
        id
      }
    }
  }
`

const CREATE_ITEM = gql`
  mutation CreateItem($title: String!, $description: String!, $datasets: [Int!]!) {
    createItem(title: $title, description: $description, datasets: $datasets) {
      id
      title
      description
      datasets {
        id
      }
    }
  }
`

const CREATE_IMAGE = gql`
  mutation CreateImage($url: String!, $title: String!, $items: [Int!]!) {
    createImage(url: $url, title: $title, items: $items) {
      url
      title
      items {
        id
      }
    }
  }
`

type GET_ITEMS_AND_DATASETS_RETURN = {
  items:    Item[]
  datasets: Dataset[]
}

type CREATE_ITEM_RETURN = {
  createItem: Item
}

type UploadData = {
  title:        string
  description:  string
  images:       File[]
  datasets:     Dataset[]
}



export default function Window_Edit() {

  const { loading, error, refetch } = useQuery<GET_ITEMS_AND_DATASETS_RETURN>(GET_ITEMS_AND_DATASETS, {

    onCompleted: (data) => {
      setItems(() => {
        const map: Map<number, Item> = new Map()
        data.items.forEach(item => map.set(item.id, item))
        return map
      })

      setDatasets(() => {
        const map: Map<number, Dataset> = new Map()
        data.datasets.forEach(dataset => map.set(dataset.id, dataset))
        return map
      })
    },

    onError: (error) => {
      console.log(error.message)
    },
  })

  /* the currently edited item is stored here so it can be restored on discard */
  const [cachedItem, setCachedItem] = useState<Item | null>(null)
  
  const [items, setItems] = useState<Map<number, Item>>(new Map())

  const [datasets, setDatasets] = useState<Map<number, Dataset>>(new Map())

  //this isn't a great design, I believe the state data ought to be complete and it is merely to be filled into the right places during render.
  const [windowState, setWindowState] = useState<"add"|"edit">("add"); 

  const setItemStateAdd = () => {
    if(inputTitle.current) {
      inputTitle.current.value = ""
    }
    if(inputDescription.current) {
      inputDescription.current.value = ""
    }
    setCurrentItemId(0)
    setWindowState("add")
  }

  const setItemStateEdit = (itemId: number) => {
    const currentItem = items.get(itemId)
    if(!currentItem) throw new Error("No current item. Cannot set state to 'edit'.")
    if(!inputTitle.current) return
    if(!inputDescription.current) return

    inputTitle.current.value = currentItem.title
    inputDescription.current.value = currentItem.description
    setCurrentItemId(itemId)
    setCachedItem(currentItem)
    setWindowState("edit")
  }

  const [currentItemId, setCurrentItemId] = useState<number>(0) // '0' means there is no item

  // const uploadData: UploadData = {title: "Empty", description: "Empty", images: [], datasets: []}
  const [uploadData, setUploadData] = useState<UploadData>({title: "Empty", description: "Empty", images: [], datasets: []})

  const animatorButtonDiscard = useAnimation()
  const animatorButtonSubmit  = useAnimation()

  const inputTitle = useRef<HTMLInputElement>(null)
  const inputDescription = useRef<HTMLTextAreaElement>(null)
  
  const selectItem = (id: number) => {
    if(windowState === "edit") {
      animateButtons()
    } else
    if(windowState === "add") {
      setItemStateEdit(id)
    } else {
      throw new Error("Possibly unhandled case for windowState: " + windowState)
    }
  }

  const animateButtons = useCallback( async () => {
    const [scale, duration, easings] = [1.07, 0.2, ["easeIn", "easeOut"]]
    animatorButtonDiscard.start({
      scale,
      transition: {duration, ease: easings}
    })
    await waitFor(100)
    await animatorButtonSubmit.start({
      scale,
      transition: {duration, ease: easings}
    })
    animatorButtonDiscard.start({
      scale: 1.0,
      transition: {duration, ease: easings}
    })
    await waitFor(100)
    await animatorButtonSubmit.start({
      scale: 1.0,
      transition: {duration, ease: easings}
    })
  }, 
  [animatorButtonDiscard, animatorButtonSubmit]
)

  const handleImageChange = (images: File[]) => {
    setUploadData((prev) => {
      return {...prev, images: images}
    })
  }

  const handleTitleChange = () => {
    setUploadData((prev) => {
      return {...prev, title: String(inputTitle.current?.value)}
    })
  }
  const handleDescriptionChange = () => {
    setUploadData((prev) => {
      return {...prev, description: String(inputDescription.current?.value)}
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!uploadData.datasets.length) return console.log("Missing datasets in uploadData") //@todo notify user somehow  that it's needed
    
    const datasets: number[] =  uploadData.datasets.map(d => d.id)
    const variables = { 
      title: uploadData.title, 
      description: uploadData.description, 
      datasets, 
    }
    console.log("Submitted upload form.", variables)
    uploadItemSingle({variables})
  }

  const handleDiscardChanges = () => {
    setItemStateAdd()
    if(cachedItem) {
      setItems((prev) => {
        const newMap = new Map(prev)
        newMap.set(currentItemId, cachedItem)
        return newMap
      })
    }
    //@todo this has to discard the changed data for 'items', so I suppose restore it from the last cache created on the last fetch
  }

  const handleItemDelete = () => { //@todo this does not cause destruction of the deleted ItemCard
    setItemStateAdd()
    refetch()
  }

  const [uploadItemSingle] = useMutation<CREATE_ITEM_RETURN>(CREATE_ITEM, {
    onCompleted: (data) => {
      const itemId = data.createItem.id
      uploadImageFiles(itemId)
      setItemStateAdd()
    },
    onError: (err) => {
      console.log(err.message)
    },
  })

  const [uploadImageSingle] = useMutation(CREATE_IMAGE, {
    onCompleted: (data) => {
      console.log("Created image: ", data)
    },
    onError: (err) => {
      console.log(err.message)
    },
  })
  
  /** @description Uploads files to server, then puts a record into the database after the image URL has been returned. */
  const uploadImageFiles = async (itemId: number) => {
    console.log(itemId)
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

      uploadImageSingle({ //"No title" var for now
        variables: {url: data.url, title: "No title", items: [itemId]}
      })

    }
  }

  const createItemCards = () => {
    if(loading)                   return <div>Loading datasets...</div>
    if(error)                     return <div>Error loading datasets...</div>
    if(!datasets)                 return <div>No datasets</div>

    return <>
            <div className="window--edit--right-side--contents">
              {Array.from(datasets.entries())?.map(d => {
                const dataset = d[1]
                return <div key={dataset.id} className="window--edit--right-side--contents-block">
                  <div className="window--edit--right-side--heading--dataset" key={dataset.id}>
                    {dataset.title}
                    <span className="text--secondary">{" (" + dataset.items.length + ")"}</span>
                    <div className="filler"></div>
                    <img src="./images/ui/icon_dropdown.png" alt="" className="window--edit--right-side--icon--dropdown icon"/>
                  </div>
                  <div className="window--edit--right-side--item-cards">
                    {dataset.items.map(itemRef => {
                      const item = items.get(itemRef.id)
                      if(!item) throw new Error("Discrepancy between datasets and items, couldn't find item by id: " + itemRef.id)

                      const isDim = currentItemId !== 0 && item.id !== currentItemId 
                      return <ItemCard item={item} flags={{isActive: item.id === currentItemId, isDim}} key={item.id} onDeleted={handleItemDelete} onSelect={selectItem} ></ItemCard>
                    })}
                  </div>
                </div>
              })}
            </div>
          </>
  }

  const createDatasetButtons = () => {
    
    return <>
        {Array.from(datasets).map(d => {
          const dataset = d[1]
          const item = items.get(currentItemId)
          let active: boolean
          if(windowState === "add") {
            active = uploadData.datasets.find(d => d.id === dataset.id) ? true : false
          } else
          if(windowState === "edit") {
            active = item?.datasets.find(d => d.id === dataset.id) !== undefined;
          }
          else {
            console.log("Missing window state, possibly. Setting active to 'false' ")
            active = false
          }
          return <DatasetButton key={dataset.id} dataset={dataset} flags={{ active: active }} onToggle={handleDatasetToggle}></DatasetButton>
        })}
    </>
  }
  
  /** Toggles the inclusion of edited item in the clicked dataset. */
  const handleDatasetToggle = (dataset: Dataset) => {
    if(windowState === "add") {
      setUploadData((prev) => {
        let datasets = [...uploadData.datasets]
        if(datasets.find(d => d.id === dataset.id)) {
          datasets = datasets.filter(d => d.id !== dataset.id)
        } else {
          datasets.push(dataset)
        }
        return {...prev, datasets}
      })
    } else
    if(windowState === "edit") {
      setItems((prevMap) => {
        const newMap = new Map(prevMap)
        const item = newMap.get(currentItemId)
        if(item) {
          let newDatasets = [...item.datasets]

          if(newDatasets.find(d => d.id === dataset.id)) {
            newDatasets = newDatasets.filter(d => d.id !== dataset.id)
          }
          else {
            newDatasets.push({...dataset})
          }
          const newItem = {...item}
          console.log(newItem.datasets, newDatasets)
          newItem.datasets = newDatasets
          newMap.set(currentItemId, newItem)
        }

        return newMap
      })
    }
    

  }
  

  let textHeadingLeft = <span className="text--secondary">New item</span>
  let textSubmitValue = "Add item"

  if(currentItemId !== 0) {
    textHeadingLeft = <span>
      {/* <span>Editing item: </span> */}
      <span>{items.get(currentItemId)?.title}</span>
    </span>
    textSubmitValue = "Update item"
  }
  
  return <>
    <div className="window" id="window--edit">
      <div className="window--edit--very-left-side collapsed">
        <div className="icon datasets" title="Expand panel"></div>
      </div>

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
            {
            currentItemId !== 0 ? 
            <motion.button type="button" onClick={handleDiscardChanges} className="window--edit--left-side--button--cancel" animate={animatorButtonDiscard}>
              Discard changes
            </motion.button> 
            : null
            }
            <motion.input type="submit" value={textSubmitValue} animate={animatorButtonSubmit}/>
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