import { gql, useMutation, useQuery } from "@apollo/client"
import { useState, useRef, useEffect, useCallback } from "react"

import ImageDropZone from "./ImageDropZone"
import ItemCard from "./ItemCard"
import DatasetButton from "./DatasetButton"

import { motion, useAnimation } from "motion/react"

import type {Item, Dataset, ImageType, DatasetRef } from "./GlobalTypes"

import "./Window_Edit.css"
import { waitFor } from "./GlobalFunctions"
import DatasetCard from "./DatasetCard"

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


//note: updating an item does not directly update its images, 
//images will be uploaded again if some of them were missing and then batch-assigned to this item after the item has been updated
const UPDATE_ITEM = gql`
  mutation UpdateItem($id: Int!, $title: String!, $description: String!, $datasets: [Int!]!) {
    updateItem(id: $id, title: $title, description: $description, datasets: $datasets) {
      id
      title
      description
      datasets {
        id
      }
    }
  }
`

type GET_ITEMS_AND_DATASETS_RETURN = {
  items:    Item[]
  datasets: Dataset[]
}

type UPDATE_ITEM_RETURN = {
  updateItem: Item
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

  const { data: serverData, loading, error, refetch } = useQuery<GET_ITEMS_AND_DATASETS_RETURN>(GET_ITEMS_AND_DATASETS, {

    onCompleted: () => {
      console.log("Fetched items and datasets on component load.")
    },

    onError: (error) => {
      console.log(error.message)
    },
  })

  useEffect(() => {
    if(!serverData) return
    
    processServerData(serverData)

  }, [serverData])

  const handleRefetch = () => {
    refetch()
    .then(result => processServerData(result.data))
    .catch(error => console.log("Refetch error: ", error))
  }

  const processServerData = (data: GET_ITEMS_AND_DATASETS_RETURN) => {
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
  }

  const uploadDataInitial: UploadData = {title: "", description: "", images: [], datasets: []}

  /* the currently edited item is stored here so it can be restored on discard */
  const [cachedItem, setCachedItem] = useState<Item | null>(null)
  
  const [items, setItems] = useState<Map<number, Item>>(new Map())

  const [datasets, setDatasets] = useState<Map<number, Dataset>>(new Map())

  const [imageDropZoneKey, setImageDropzoneKey] = useState<number>(0)

  //this isn't a great design, because I believe the state data ought to be complete and it is merely to be filled into the right places during render.
  //so this decoupling of windowState with everything else is a bit dodgy
  const [windowState, setWindowState] = useState<"add"|"edit">("add"); 

  const setItemStateAdd = () => {
    if(inputTitle.current) {
      inputTitle.current.value = ""
    }
    if(inputDescription.current) {
      inputDescription.current.value = ""
    }
    setUploadData(uploadDataInitial)
    setCurrentItemId(0)
    setWindowState("add")
  }

  const setItemStateEdit = (itemId: number) => {
    const currentItem = items.get(itemId)
    if(!currentItem) throw new Error("No current item. Cannot set state to 'edit'. There is a mistake somewhere.")
    if(!inputTitle.current) return
    if(!inputDescription.current) return

    inputTitle.current.value = currentItem.title
    inputDescription.current.value = currentItem.description
    
    //@todo this shit will need to also update images once I figure out how they are fetched
    handleTitleChange()
    handleDescriptionChange()

    setCurrentItemId(itemId)
    setCachedItem(currentItem)
    setWindowState("edit")

    //fetch images for the item, if it has any
    //but I have to differentiate between uploaded images and local images, at least in code.
    //not sure if the user has to know, probably not
    //but maybe I simply need to abstract the idea of an image into being one of two things, either a simple link to server URL, or the local blob in memory
    //type ImagePreview = ImageInMemory | ImageFromServer      ???
  }

  const [currentItemId, setCurrentItemId] = useState<number>(0) // '0' means there is no item
  const [uploadData, setUploadData]       = useState<UploadData>(uploadDataInitial)

  const animatorButtonDiscard = useAnimation()
  const animatorButtonSubmit  = useAnimation()

  const inputTitle =        useRef<HTMLInputElement>(null)
  const inputDescription =  useRef<HTMLTextAreaElement>(null)
  
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
    
    let datasets: number[] = []

    //handle the source of datasets which is dependent on windowState, which is actually kinda shitty design, it uploadData should always be all that is uploaded, why the fuck am I getting datasets from the current item??
    //oh yes.. probably because I do not store the default state of the dataset buttons elsewhere, which I should do; yes, I should cache it and then restore it if the windowState is "add" again
    if(windowState === "add") {
      datasets = uploadData.datasets.map(d => d.id)
    } else
    if(windowState === "edit") {
      const item = items.get(currentItemId)
      if(!item) throw new Error("Absolutely should have found 'item' by 'currentItemId' when uploading data for an existing Item.")

      datasets = item.datasets.map(d => d.id)
    } else {
      throw new Error("Missing case for windowState: " + windowState)
    }

    if(!uploadData.title)     return console.warn("Missing title in uploadData")
    if(datasets.length === 0) return console.warn("Missing datasets in uploadData")
    //@todo notify user somehow that it's needed to select a dataset, via animation probably

    const variables = {
      title: uploadData.title, 
      description: uploadData.description, 
      datasets, 
    }

    //note: how variables are defined here is a catastrophy (if this project were any bigger)
    //ideally should have types for each condition and also be coupled to windowState, or coupled to the queries, 
    //idk yet, but I think queries can be made of interpolated strings, there is a system somewhere in this xd
    if(windowState === "add") {
      uploadItemSingle({variables: {
        title: uploadData.title, 
        description: uploadData.description, 
        datasets, 
      }})
    } else
    if(windowState === "edit") {
      updateItemSingle({variables: {
        id: currentItemId,
        title: uploadData.title, 
        description: uploadData.description, 
        datasets, 
      }})
    }

    console.log("Submitted upload form. \n", "windowState: ", windowState, "\n", "Variables: ", variables, "\n")
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
    else {
      throw new Error("Error in handleDiscardChanges: The item must be cached before it is opened for editing.")
    }
  }

  const handleItemDelete = () => {
    setItemStateAdd()
    handleRefetch()
  }

  const resetImageDropZone = () => {
    setImageDropzoneKey((prev) => prev + 1)
  }

  const [uploadItemSingle] = useMutation<CREATE_ITEM_RETURN>(CREATE_ITEM, {
    onCompleted: (data) => {
      const itemId = data.createItem.id
      if(uploadData.images.length !== 0) {
        uploadImageFiles(itemId)
      }
      setItemStateAdd()
      resetImageDropZone()
      handleRefetch()
    },
    onError: (err) => {
      console.log("Error in uploadItemSingle: \n", err.message)
    },
  })

  const [updateItemSingle] = useMutation<UPDATE_ITEM_RETURN>(UPDATE_ITEM, {
    onCompleted: () => {
      setItemStateAdd();
      resetImageDropZone();
      handleRefetch();
    }
  })

  const [uploadImageSingle] = useMutation(CREATE_IMAGE, {
    onCompleted: (data) => {
      console.log("Created image: ", data)
    },
    onError: (err) => {
      console.log("Error in uploadImageSingle: \n", err.message)
    },
  })
  
  /** @description Uploads files to server, then puts a record into the database after the image URL has been returned. */
  const uploadImageFiles = async (itemId: number) => {
    if(uploadData.images.length === 0) throw new Error("Expected uploadData.images.length to not be '0'.")

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

  const createItemCards = () => {
    if(loading)     return <div>Loading datasets...</div>
    if(error)       return <div>Error loading datasets...</div>
    if(!datasets)   return <div>No datasets</div>

    return <>
            <div className="window--edit--right-side--contents">
              {Array.from(datasets.entries())?.map(d => {
                const dataset = d[1]
                return (
                  <div key={dataset.id} className="window--edit--right-side--contents-block">
                    <div className="window--edit--right-side--heading--dataset" key={dataset.id} title={"Collapse items in '" + dataset.title + "'"}>
                      {dataset.title}
                      <span className="text--secondary">&nbsp;{"(" + dataset.items.length + ")"}</span>
                      <div className="filler"></div>
                      <img src="./images/ui/icon_dropdown.png" alt="" className="window--edit--right-side--icon--dropdown icon"/>
                    </div>
                    <div className="window--edit--right-side--item-cards">
                      {dataset.items.map(itemRef => {
                        const item = items.get(itemRef.id)
                        if(!item) throw new Error("Discrepancy between datasets and items, couldn't find item by id: " + itemRef.id)
                        
                        const isDim = currentItemId !== 0 && item.id !== currentItemId 

                        //here this logic makes sense, item can only be deleted if (it's the one selected) or (there is no selection)
                        const canBeDeleted = !isDim 
                        return <ItemCard item={item} flags={{isActive: item.id === currentItemId, isDim, canBeDeleted}} key={item.id} onDeleted={handleItemDelete} onSelect={selectItem} ></ItemCard>
                      })}
                    </div>
                  </div>
                )
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

  const animatorRightSide = useAnimation();

  const [isRightSideCollapsed, setIsRightSideCollapsed] = useState<boolean>(false);

  const [isRightSideAnimating, setIsRightSideAnimating] = useState<boolean>(false);

  const rightSideRef = useRef<HTMLDivElement>(null)

  const toggleRightSide = async () => {
    setIsRightSideAnimating(true)

    if(!isRightSideCollapsed) setIsRightSideCollapsed((prev) => !prev) //this behavior is mirrored so it looks nicer on closing the side

    const duration = 0.12
    const fullSizeWidth = "320px"
    const sequence = [
      () => animatorRightSide.start({
        height: "100%",
        width: fullSizeWidth,
        minWidth: fullSizeWidth,
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
      () => animatorRightSide.start({
        height: "100%",
        width: "60px",
        minWidth: "60px",
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
      () => animatorRightSide.start({
        height: "60px",
        width: "60px",
        minWidth: "60px",
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
    ]

    if(isRightSideCollapsed) sequence.reverse()
    for(const fn of sequence) {
      await fn()
    }

    setTimeout(() => {
      setIsRightSideAnimating(false)
      if(isRightSideCollapsed) setIsRightSideCollapsed((prev) => !prev)
    }, 25)
  }
  

  const animatorVeryLeftSide = useAnimation();

  const [isVeryLeftSideCollapsed, setIsVeryLeftSideCollapsed] = useState<boolean>(true);

  const [isVeryLeftSideAnimating, setIsVeryLeftSideAnimating] = useState<boolean>(false);

  const veryLeftSideRef = useRef<HTMLDivElement>(null)

  //sort of doesn't play out with the CSS class system, there is an overlap of definitions
  const toggleVeryLeftSide = async () => {
    setIsVeryLeftSideAnimating(true)

    if(!isVeryLeftSideCollapsed) setIsVeryLeftSideCollapsed((prev) => !prev) //this behavior is mirrored so it looks nicer on closing the side

    const duration = 0.12
    const fullSizeWidth = "320px"
    const sequence = [
      () => animatorVeryLeftSide.start({
        height: "100%",
        width: fullSizeWidth,
        minWidth: fullSizeWidth,
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
      () => animatorVeryLeftSide.start({
        height: "100%",
        width: "60px",
        minWidth: "60px",
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
      () => animatorVeryLeftSide.start({
        height: "60px",
        width: "60px",
        minWidth: "60px",
        transition: {duration, easings: ["anticipate", "circInOut"]}
      }),
    ]

    if(isVeryLeftSideCollapsed) sequence.reverse()
    for(const fn of sequence) {
      await fn()
    }

    setTimeout(() => {
      setIsVeryLeftSideAnimating(false)
      if(isVeryLeftSideCollapsed) setIsVeryLeftSideCollapsed((prev) => !prev)
    }, 25)
  };
  
  let textHeadingLeft = <span className="text--secondary">New item</span>
  let textSubmitValue = "Add item"

  if(currentItemId !== 0) {
    textHeadingLeft = <span>{items.get(currentItemId)?.title}</span>
    textSubmitValue = "Update item"
  }

  let veryLeftSideClass = "window--edit--very-left-side"
  if(isVeryLeftSideCollapsed) veryLeftSideClass += " collapsed"

  let rightSideClass = "window--edit--right-side"
  if(isRightSideCollapsed) rightSideClass += " collapsed"
  
  return <>
    <div className="window" id="window--edit">
      <motion.div 
        className={veryLeftSideClass} 
        animate={animatorVeryLeftSide} 
        style={{pointerEvents: isVeryLeftSideAnimating ? "none" : undefined}}
        ref={veryLeftSideRef}
        >
        <div className="icon datasets" title="Toggle dataset panel" onClick={toggleVeryLeftSide}></div>
        {
        !isVeryLeftSideCollapsed &&
        <div className="window--edit--very-left-side--contents">
          <div className="window--edit--very-left-side--datasets">
            {Array.from(datasets).map(d => {
              const dataset = d[1]
              return <DatasetCard key={dataset.id} dataset={dataset} warn={false} onSelectedChange={() => {}}></DatasetCard>
            })
          }
          </div>
        </div>
        }
      </motion.div>

      <div className="window--edit--left-side">
        <h1 className="window--edit--left-side--heading">{textHeadingLeft}</h1>
        <div className="window--edit--left-side--dataset-list">
          {createDatasetButtons()}
        </div>
        <form className="window--edit--left-side--input-form" onSubmit={handleSubmit}>
          <input type="text" name="title" id="" placeholder="Title" onChange={handleTitleChange} ref={inputTitle} />
          <textarea name="description" id="" placeholder="Description" onChange={handleDescriptionChange} ref={inputDescription} />
          <ImageDropZone key={imageDropZoneKey} onImagesChange={handleImageChange} itemId={currentItemId ?? null}></ImageDropZone> {/* create some .value on this that acts as the file input value */}

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
            <motion.input type="submit" value={textSubmitValue} animate={animatorButtonSubmit} tabIndex={0}/>
          </div>
        </form>
      </div>

      <motion.div 
      className={rightSideClass}
      style={{pointerEvents: isRightSideAnimating ? "none" : undefined}} 
      ref={rightSideRef}
      animate={animatorRightSide}>
        <div className="window--edit--right-side--heading">
          {!isRightSideCollapsed && <>
          <span style={{paddingLeft: "3px"}} >Items&nbsp;</span>
          <span className="text--secondary">({items.size})</span>
          <div className="filler"></div>
          </>
          }
          <div className="icon items" onClick={toggleRightSide} title="Toggle items panel"></div>
        </div>
        {
        !isRightSideCollapsed &&
        createItemCards()
        }
      </motion.div>
    </div>
  </>
}