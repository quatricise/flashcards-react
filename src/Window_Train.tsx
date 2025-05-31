import React, { useState, useCallback, useEffect } from "react"
import { useQuery, gql } from "@apollo/client"
import { motion, useAnimation } from "motion/react"
import { cloneDeep } from "@apollo/client/utilities"
import type { Item, TrainingSetup, TrainingData, TrainingMode,  Window_Train_Props } from "./GlobalTypes"
import { clamp, sum, waitFor } from "./GlobalFunctions"
import type { AnimationControls } from "motion/react"
import "./Window_Train.css"


const GET_ITEMS = gql`
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
  }
`
type GET_ITEMS_RETURN = {
  itemsByDatasetIds: Item[]
}

type ItemWithWeight = Item & { weight: number }

function getRandomItem(items: ItemWithWeight[]): ItemWithWeight | undefined {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return undefined;

  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const item of items) {
    cumulativeWeight += item.weight;
    if (random < cumulativeWeight) return item;
  }
  return undefined;
}

export default function Window_Train({ datasetIds, trainingSetup, trainingMode, teams }: Window_Train_Props) {

  const {data, loading: dataLoading, error: dataError} = useQuery<GET_ITEMS_RETURN>(GET_ITEMS, { //@todo this has no refetch
    variables: {datasetIds}
  })

  useEffect(() => {
    if(data === undefined) return
    setItems(data.itemsByDatasetIds.map(i => { return {...i, bucket: 0}}))
    setCurrentItem(data.itemsByDatasetIds[0])
  }, [data])

  console.log(trainingSetup)

  // const [trainingSetup, setTrainingSetup]     = useState<TrainingSetup>(input_trainingSetup)
  const [currentSide, setCurrentSide]         = useState<"A"|"B">("A")
  const [currentItem, setCurrentItem]         = useState<Item | null>(null)
  const [isAnimatingNext, setIsAnimatingNext] = useState<boolean>(false)
  const [items, setItems]                     = useState<Item[]>([])
  const [isTrainingDone, setIsTrainingDone]   = useState<boolean>(false)

  const flipCard = async () => {
    await cardAnimateFlip()
    setCurrentSide((prev) => prev === "A" ? "B" : "A")
  }

  const showNextItem = async (success: boolean) => {
    if(!currentItem) return
    if(items.length <= 1) return stopTraining()

    setItems((prev) => {
      let newItems = [...prev]
      let item = newItems.find(i => i.id === currentItem.id) as Item
      if(!item) {
        console.error("Did not find item.")
        return prev
      }

      item = cloneDeep(item)
      newItems = newItems.filter(i => i.id !== item.id)

      if(!newItems || newItems.length === 0) {
        console.error("No newItems.")
        return prev
      }
      
      if(success) {
        item = {...item, bucket: item.bucket + 1}
      } else {
        item = {...item, bucket: item.bucket - 1}
      }

      if(item.bucket < 0) {
        item.bucket = 0
        return newItems.concat([item])
      } else
      if(item.bucket >= 5) {
        return newItems //return without the item, because you succeeded 5 times
      } else {
        return newItems.concat([item])
      }
    })

    const bucketWeights = [6, 4, 3, 2, 1]
    
    let nextItem

    let attempts = 0
    do {
      nextItem = getRandomItem(items.map(i => {
        const weight = bucketWeights[i.bucket]
        if(!weight) throw new Error(`No weight for bucket: ${i.bucket}`)
        return {...i, weight}
      }))
      attempts++
    } while (attempts < 10000 && items.length >= 2 && nextItem?.id === currentItem.id)

    if(attempts >= 10000) {
      console.error("Attempts >= 10000")
      console.error("Items.length: ", items.length)
      console.error("Prev and next Item id match: ", nextItem?.id, currentItem.id)
    }

    if(currentSide === "B") await flipCard()
    else await cardAnimateFlip()

    if(nextItem) {
      console.log(nextItem.bucket)
      setCurrentItem(nextItem)
    }
    else {
      throw new Error("No next item")
    }
  }

  const stopTraining = () => {
    //training is over, now it just says something like training is over or it shows you the review button only
    setIsTrainingDone(true)
  }

  const createMessageError = () => {
    if(dataError) return <div>There was error loading data...</div>
    return null
  }

  const createMessageLoading = () => {
    if(dataLoading) return <div>Loading data...</div>
    return null
  }

  const animatorCard =      useAnimation()
  const animatorCardCopy =  useAnimation()

  const cardAnimateFlip = useCallback(async () => {
    await animatorCard.start({
      y: -5,
      x: 5,
      rotateY: "4deg",
      rotateZ: "-10deg",
      scale: 0.97,
      transition: {duration: 0.02}
    })
    await animatorCard.start({
      y: 0,
      rotateY: "0",
      rotateZ: "0",
      scale: 1,
      transition: {duration: 0.02, easings: ["easeIn", "easeOut"]}
    })
  }, [animatorCard])

  const createTrainingDoneMessage = () => {
    return <div className="training-card side-end">
      <h1 className="training-card--side-end--title" >Congratulations!</h1>
      <div className="training-card--side-end--description" >You have finished your training. You can rest now.</div>
    </div>
  }

  const createCard = () => {
    if(!currentItem) return

    let className = "training-card"
    if(currentSide === "B") className += " side-b"
    if(currentSide === "A") className += " side-a"

    const createElement = (animator: AnimationControls, isVisible: boolean, onclick?: () => void) => {

      return <motion.div className={className} onClick={onclick ?? undefined} animate={animator} style={
        {
          display: isVisible ? "" : "none",
        }
        }>
        {trainingSetup[currentSide].map((prop, index) => {
          if(prop === "title") {
            return <div key={index} className="training-card--title">{currentItem.title}</div>
          } else
          if(prop === "description" && currentItem.description) {
            return <div key={index} className="training-card--description">{currentItem.description}</div>
          } else
          if(prop === "images" && currentItem.images.length !== 0) {
            const maxWidth = 100 / currentItem.images.length
            return <div key={index} className="training-card--images">
              {currentItem.images.map((i, i_index) => {
                return <img 
                key={i_index}
                className="training-card--image" 
                src={i.url} 
                alt=""
                style={{maxWidth: maxWidth + "%"}}/>
              })}
            </div>
          }
        })}
      </motion.div>
    }

    return <>
      {createElement(animatorCard, true, flipCard)}
      {createElement(animatorCardCopy, isAnimatingNext)}
    </>
  }

  const createButtons = () => {
    const style: Partial<React.CSSProperties> = isTrainingDone ? {opacity: 0.5, pointerEvents: "none"} : {opacity: 1.0, pointerEvents: "all"}
    return <div className="window--train--buttons" style={style}>
      <button className="window--train--button--fail warning" onClick={() => showNextItem(false)}>
        <div className="icon cross"></div>
        <div>Fail</div>
      </button>
      <button className="window--train--button--success" onClick={() => showNextItem(true)}>
        <div className="icon tick"></div>
        <div>Success</div>
      </button>
    </div>
  }

  return <div id="window--train" className="window" style={{pointerEvents: isAnimatingNext ? "none" : undefined}}>
    {!isTrainingDone && createCard()}
    {isTrainingDone && createTrainingDoneMessage()}
    {createButtons()}
    {createMessageError()}
    {createMessageLoading()}
  </div>
}