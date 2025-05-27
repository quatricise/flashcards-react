import { gql, useMutation, useQuery } from "@apollo/client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { MouseEvent, KeyboardEvent } from "react"
const API_URL = import.meta.env.VITE_API_BASE_URL

import ImageDropZone from "./ImageDropZone"
import ItemCard from "./ItemCard"
import DatasetButton from "./DatasetButton"

import { motion, useAnimation } from "motion/react"

import type { Item, Dataset, ImageFromServer } from "./GlobalTypes"

import "./Window_Edit.css"
import { waitFor } from "./GlobalFunctions"
import DatasetCard from "./DatasetCard"
import Button_CreateDataset from './Button_CreateDataset';

/** 
 * We get ALL THE DATA for now. 
 * It's easier to work with, albeit inefficient if the total payload grows too much. 
 * It's obviously far below efficient to query this much redundant data.
 * */
const GET_ITEMS_AND_DATASETS = gql`
  query GetItems($datasetIds: [Int!]!) {
    itemsByDatasetIds(datasetIds: $datasetIds) {
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

const DELETE_DATASETS = gql`
  mutation DeleteDatasets($ids: [Int!]!) {
    deleteDatasets(ids: $ids)
  }
`

//@todo: this kind of presupposes that images can only exist on one item, because they are deleted by this
//for now that is okay, but it'll break shit in the future maybe
const DELETE_IMAGES = gql`
  mutation DeleteImages($ids: [Int!]!) {
    deleteImages(ids: $ids)
  }
`

type GET_ITEMS_AND_DATASETS_RETURN = {
  itemsByDatasetIds:  Item[]
  datasets:           Dataset[]
}

type UPDATE_ITEM_RETURN = {
  updateItem: Item
}

type CREATE_ITEM_RETURN = {
  createItem: Item
}

type DELETE_DATASETS_RETURN = {
  deleteDatasets: number[]
}

type DELETE_IMAGES_RETURN = {
  deleteImages: number[]
}

type UploadData = {
  title:          string
  description:    string
  images:         File[]
  datasets:       Dataset[]
  imagesToDelete: number[]
}

type ImageUploadResults = {
  url:          string,
  thumbnailUrl: string
  error:        string
}


export default function Window_Edit() {

  const uploadDataInitial: UploadData = {title: "", description: "", images: [], datasets: [], imagesToDelete: []}

  /* the currently edited item is stored here so it can be restored on discard */
  const [cachedItem, setCachedItem] = useState<Item | null>(null)
  
  const [items, setItems] = useState<Map<number, Item>>(new Map())

  const [datasets, setDatasets] = useState<Map<number, Dataset>>(new Map())

  const [datasetsSelected, setDatasetsSelected] = useState<Dataset[]>([])

  const [deleteDatasets] = useMutation<DELETE_DATASETS_RETURN>(DELETE_DATASETS, {
    onCompleted: () => {
      //I need to match datasetsSelected against actual datasets, so maybe on handleRefetch
      handleRefetch()
    }
  })

  const [shouldDeleteDatasets, setShouldDeleteDatasets] = useState<boolean>(false)
  const [itemAboutToDelete, setItemAboutToDelete]       = useState<Item | null>(null)

  const { data: serverData, loading, error, refetch } = useQuery<GET_ITEMS_AND_DATASETS_RETURN>(GET_ITEMS_AND_DATASETS, {
    onCompleted: () => {
      console.log("Fetched items and datasets on component load.")
    },
    onError: (error) => {
      console.log(error.message)
    },
    variables: {datasetIds: []},
  })

  const processServerData = useCallback((data: GET_ITEMS_AND_DATASETS_RETURN) => {
    console.log("processServerData data:\n", data)
    setItems(() => {
      const map: Map<number, Item> = new Map()
      data.itemsByDatasetIds.forEach(item => map.set(item.id, item))
      return map
    })
    setDatasets(() => {
      const map: Map<number, Dataset> = new Map()
      data.datasets.forEach(dataset => map.set(dataset.id, dataset))
      return map
    })
    /* this is temporarily disabled */
    // setDatasetsSelected((prev) => {
    //   return prev.filter(d => data.datasets.find(dataset => dataset.id === d.id))
    // })
  }, [])

  const handleRefetch = useCallback(() => {
    const variables = {datasetIds: datasetsSelected.map(d => d.id)}
    console.log("handleRefetch: variables: \n", variables)
    refetch(variables)
    .then(result => processServerData(result.data))
    .catch(error => console.log("Refetch error: ", error))
  }, [datasetsSelected, refetch, processServerData])

  useEffect(() => {
    if(!serverData) return
    processServerData(serverData)
  }, [serverData, processServerData])

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
          const newVal = prev.filter(d => d.id !== dataset.id)
          console.log(newVal)
          return newVal
        }
      )
    }
  }

  useEffect(() => {
    console.log("Updated datasetsSelected:", datasetsSelected)
    handleRefetch()
  }, [datasetsSelected, handleRefetch])

  const handleButtonDeleteDatasetsClick = () => {
    if(!shouldDeleteDatasets) {
      return setShouldDeleteDatasets(true)
    }
    else {
      const variables = {ids: datasetsSelected.map(d => d.id)}
      deleteDatasets({variables})
    }
  }

  const handleButtonDeselectClick = () => {
    setDatasetsSelected([])
  }

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
    
    handleTitleChange()
    handleDescriptionChange()
    setCurrentItemId(itemId)
    setCachedItem(currentItem)
    resetImageDropZone()
    setWindowState("edit")
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

  const handleImageFromServerChange = (images: ImageFromServer[]) => {
    const item = items.get(currentItemId)
    if(!item) throw new Error("Missing item, there really fucking should be one.")

    setUploadData((prev) => {
      const imagesToDelete = images.filter(img => img.willDelete).map(i => i.id)

      console.log("Images to be deleted: ", imagesToDelete)
      return {...prev, imagesToDelete}
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

  const discardItemChanges = () => {
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

  const handleItemTryToDelete = (itemId: number, state: boolean) => {
    const item = items.get(itemId)
    if(!item) throw new Error("handleItemTryToDelete: No item found under itemId ${itemId}.")

    if(state === true) {
      setItemAboutToDelete(item)
    } else {
      setItemAboutToDelete(null)
    }
  }

  const resetImageDropZone = () => {
    setImageDropzoneKey((prev) => prev + 1)
  }

  const [uploadItemSingle] = useMutation<CREATE_ITEM_RETURN>(CREATE_ITEM, {
    onCompleted: (data) => {
      const itemId = data.createItem.id

      if(uploadData.images.length !== 0) {
        uploadImageFiles(itemId)
        .then(() => handleRefetch())
      } else {
        handleRefetch()
      }

      setItemStateAdd()
      resetImageDropZone()
    },
    onError: (err) => {
      console.log("Error in uploadItemSingle:\n", err.message)
    },
  })

  const [updateItemSingle] = useMutation<UPDATE_ITEM_RETURN>(UPDATE_ITEM, {
    onCompleted: async (data) => {

      const itemId = data.updateItem.id
      const actions: (() => Promise<void>)[] = []

      if(uploadData.images.length !== 0) {
        actions.push(
          async () => {
            await uploadImageFiles(itemId)
          }
        )
      }
      if(uploadData.imagesToDelete.length !== 0) {
        actions.push(
          async () => {
            await deleteImageFiles()
          }
        )
      }
      console.log("updateItemSingle -> onCompleted:\n")
      console.log(uploadData)
      console.log("Actions:\n")
      console.log(...actions)

      await Promise.all(actions.map(a => a()))

      handleRefetch();
      setItemStateAdd();
      resetImageDropZone();
    },
    onError: (err) => {
      console.log("Error in updateItemSingle:\n", err.message)
    },
  })

  const [uploadImageSingle] = useMutation(CREATE_IMAGE, {
    onCompleted: (data) => {
      console.log("Created image: ", data)
    },
    onError: (err) => {
      console.log("Error in uploadImageSingle: \n", err.message)
    },
  })
  
  /** @description Uploads image files to server, then puts a record into the database after the image URL has been returned. */
  const uploadImageFiles = async (itemId: number) => {
    if(uploadData.images.length === 0) throw new Error("Expected uploadData.images.length to not be '0'.")

    const formData = new FormData();

    for(const img of uploadData.images) {
      formData.append('images', img)
    }

    console.log(`uploadImageFiles: \n url: ${API_URL}/upload \n data: ${uploadData.images}`)

    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text()
      console.error("Image upload failed: ", res.status, text)
    }

    const data = await res.json();
    const results: ImageUploadResults[] = data.results
    if(!results) {
      throw new Error("Missing 'images' in response data.")
    }
    const uploads = results.map(result => {
        return async () => await uploadImageSingle({
          variables: {url: result.url, title: "No title", items: [itemId]} //@todo maybe include the title as the image url as title, but only the filename
        })
    })
    await Promise.all(uploads.map(upload => upload()))
  }

  /** Again, another reminder that this deletes images even if they're associated with multiple items. */
  const deleteImageFiles = async () => {
    if(uploadData.imagesToDelete.length === 0) throw new Error("Expected uploadData.imagesToDelete.length to not be '0'.")

    await deleteImages({variables: {ids: uploadData.imagesToDelete}})
    .then(() => console.log("deleteImageFiles: Success: ", uploadData.imagesToDelete))
    .catch((error) => console.log("deleteImageFiles: Error: ", error))
  }

  const [deleteImages] = useMutation<DELETE_IMAGES_RETURN>(DELETE_IMAGES)

  const createItemCards = () => {
    if(loading)     return <div>Loading datasets...</div>
    if(error)       return <div>Error loading datasets...</div>
    if(!datasets)   return <div>No datasets</div>

    return <>
            <div className="window--edit--right-side--contents">
              {datasetsSelected.length === 0 &&
                <div className="window--edit--right-side--contents--info-no-datasets">Items will appear here once you select datasets to edit.</div>
              }
              {Array.from(datasets.entries())?.map(d => {
                const dataset = d[1]
                let itemCount = 0
                const itemCards = <>
                  {dataset.items.map(itemRef => {
                          const item = items.get(itemRef.id)
                          if(!item) {
                            // throw new Error("Discrepancy between datasets and items, couldn't find item by id: " + itemRef.id)
                            return
                          }
                          itemCount++

                          const isDim = currentItemId !== 0 && itemRef.id !== currentItemId 
                          //here this logic makes sense, item can only be deleted if it's the one selected or there is no selection
                          const canBeDeleted = !isDim 
                          const isTryToDelete = itemAboutToDelete?.id === itemRef.id
                          return <ItemCard 
                            item={item}
                            flags={{isActive: itemRef.id === currentItemId, isDim, canBeDeleted, isTryToDelete}} 
                            key={itemRef.id} 
                            onDeleted={handleItemDelete} 
                            onSelect={selectItem} 
                            onTryToDelete={handleItemTryToDelete}>
                          </ItemCard>
                  })}
                </>

                if(itemCount === 0) return <></>

                return (
                  <div key={dataset.id} className="window--edit--right-side--contents-block">
                    <div className="window--edit--right-side--heading--dataset" key={dataset.id} title={"Collapse items in '" + dataset.title + "'"}>
                      {dataset.title}
                      <span className="text--secondary">&nbsp;{"(" + dataset.items.length + ")"}</span>
                      <div className="filler"></div>
                      <img src="./images/ui/icon_dropdown.png" alt="" className="window--edit--right-side--icon--dropdown icon"/>
                    </div>
                    <div className="window--edit--right-side--item-cards">
                      {itemCards}
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
    } 
    else
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
  const [isVeryLeftSideCollapsed, setIsVeryLeftSideCollapsed] = useState<boolean>(false);
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

  /** Component's main click handler, usually used to resolve some conditions */
  const handleClick = (e: MouseEvent) => {
    if(shouldDeleteDatasets) {
      if(e.target !== refButtonDeleteDatasets.current) {
        setShouldDeleteDatasets(false)
      }
    } else
    if(itemAboutToDelete) {
      if(e.target && e.target) {
        //@todo this is utter trash, but the handler on the item itself is fired first, so it deletes the item, so it kinda works
        setItemAboutToDelete(null) 
      }
    }
  }

  /** Component's main keydown handler, usually used to resolve some conditions */
  const handleKeyDown = (e: KeyboardEvent) => {
    if(e.code === "Escape") {
      if(shouldDeleteDatasets) {
        setShouldDeleteDatasets(false)
      } else
      if(itemAboutToDelete) {
        setItemAboutToDelete(null)
      } else
      if(windowState === "edit") {
        discardItemChanges()
      } else
      if(refSelf.current?.contains(document.activeElement)) {
        function hasBlurMethod(el: Element | null): el is HTMLElement {
          return !!el && typeof (el as HTMLElement).blur === 'function';
        }
        if(hasBlurMethod(document.activeElement)) {
          document.activeElement?.blur()
        }
      }
    }
  }

  const handleButtonDeleteKeydown = (e: KeyboardEvent) => {
    if(e.code === "Enter") {
      e.preventDefault()
    }
  }

  const refButtonDeleteDatasets = useRef<HTMLButtonElement>(null)
  const refSelf                 = useRef<HTMLDivElement>(null)
  
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

  let buttonDeleteDatasetsClass = "warning button--delete-datasets"
  if(shouldDeleteDatasets) buttonDeleteDatasetsClass += " confirm"

  /* memo for ImageDropZone */
  const currentImagesFromServer = useMemo(() => {
    // console.log("Memoized currentImagesFromServer")
    return items.get(currentItemId)?.images ?? []
  }, [items, currentItemId])
  
  return <>
    <div className="window" id="window--edit" onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0} ref={refSelf}>

      <motion.div
        className={veryLeftSideClass}
        animate={animatorVeryLeftSide}
        style={{pointerEvents: isVeryLeftSideAnimating ? "none" : undefined}}
        ref={veryLeftSideRef}
        >
        <div className="window--edit--very-left-side--datasets-heading">
          <div className="icon datasets" title="Toggle dataset panel" onClick={toggleVeryLeftSide} tabIndex={0}></div>
          {
            !isVeryLeftSideCollapsed &&
            <div className="window--edit--very-left-side--datasets-heading--title" >Datasets</div>
          }
        </div>
        {
        !isVeryLeftSideCollapsed &&
        <div className="window--edit--very-left-side--contents">
          <div className="window--edit--very-left-side--datasets">
            {Array.from(datasets).map(d => {
                const dataset = d[1]
                const warn = !!datasetsSelected.find(d => d.id == dataset.id) && shouldDeleteDatasets
                const selected = !!datasetsSelected.find(d => d.id == dataset.id)
                return <DatasetCard 
                key={dataset.id} 
                dataset={dataset} 
                warn={warn} selected={selected} 
                onSelectedChange={updateDatasetsSelected}
                onRename={handleRefetch}></DatasetCard>
            })}
          </div>
          <Button_CreateDataset onCreate={handleRefetch} ></Button_CreateDataset>
          <div className="window--edit--very-left-side--buttons">
            <button className="button--deselect-all" onClick={handleButtonDeselectClick}>
              Deselect
            </button>
            <button 
            ref={refButtonDeleteDatasets}
            className={buttonDeleteDatasetsClass}
            onClick={handleButtonDeleteDatasetsClick}
            onKeyDown={handleButtonDeleteKeydown}
            disabled={datasetsSelected.length !== 0 ? false : true}>
              {shouldDeleteDatasets ?
              "Confirm?" :
              "Delete"
              }
            </button>
          </div>
        </div>
        }
      </motion.div>

      <div className="window--edit--left-side">
        <h1 className="window--edit--left-side--heading">{textHeadingLeft}</h1>
        <div className="window--edit--left-side--dataset-list">
          <div 
          className="window--edit--left-side--dataset-list--title text--secondary" 
          title="Which datasets this item will be added into. Select at least 1.">
            Datasets:&nbsp;
          </div>
          {createDatasetButtons()}
        </div>
        <form className="window--edit--left-side--input-form" onSubmit={handleSubmit}>
          <input className="window--edit--left-side--input--title" type="text" name="title" id="" placeholder="Title" onChange={handleTitleChange} ref={inputTitle} />
          <textarea name="description" id="" placeholder="Description" onChange={handleDescriptionChange} ref={inputDescription} />
          <ImageDropZone 
          key={imageDropZoneKey} 
          itemId={currentItemId ?? null}
          onImagesChange={handleImageChange}
          onImagesFromServerChange={handleImageFromServerChange}
          imagesFromServerInput={currentImagesFromServer}
          />

          <div className="window--edit--left-side--bottom-bar">
            <h2 className="window--edit--left-side--bottom-bar--heading" >{textHeadingLeft}</h2>
            <div style={{flexGrow: 1}}></div>
            {
            currentItemId !== 0 && 
            <motion.button type="button" onClick={discardItemChanges} className="window--edit--left-side--button--cancel" animate={animatorButtonDiscard} tabIndex={0}>
              Discard changes
            </motion.button> 
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
          <div className="icon items" onClick={toggleRightSide} title="Toggle items panel" tabIndex={0}></div>
        </div>
        {
        !isRightSideCollapsed &&
        createItemCards()
        }
      </motion.div>

    </div>
  </>
}