import { useState, useCallback } from "react"
import { useQuery, gql } from "@apollo/client"
import { motion, useAnimation } from "motion/react"
import type { Item, TrainingSetup, TrainingData, Window_Train_Props } from "./GlobalTypes"
import { waitFor } from "./GlobalFunctions"
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

export default function Window_Train({ datasetIds }: Window_Train_Props) {
  console.log(datasetIds)
  const {loading: dataLoading, error: dataError} = useQuery<GET_ITEMS_RETURN>(GET_ITEMS, { //@todo this has no refetch
    onCompleted: (data) => {

      setItems(data.itemsByDatasetIds.map((item, index) => {

        /* I have to add the props for training because they will not be in the database */
        const copy: Item = {...item, attempts: []}
        if(index === 0) setCurrentItem(copy)
        return copy

      }))
    },
    variables: {datasetIds}
  }) 
  
  //no shuffling items for now, but maybe later

  const [trainingSetup] =               useState<TrainingSetup>({A: ["title"], B: ["description", "images"]}) //will not have a default here, later, for now it's good
  const [currentSide, setCurrentSide] = useState<"A"|"B">("A")
  const [currentItem, setCurrentItem] = useState<Item | null>(null)
  const [items, setItems] =             useState<Item[]>([])
  const [isAnimatingNext, setIsAnimatingNext] = useState<boolean>(false) /* Also used to disable pointer events if true */


  const flipCard = async () => {
    await cardAnimateFlip()
    setCurrentSide((prev) => prev === "A" ? "B" : "A")
  }

  /** @todo fix this to assign correct data first */
  const showNextItem = async (succ: boolean) => {
    if(!currentItem) return

    const index = items.indexOf(currentItem)

    const attempts = currentItem.attempts + 1
    const success = currentItem.success + Number(succ)
    
    const newData = { success, attempts }
    console.log((success / attempts) * 100 + "%")
    updateItems(currentItem.id, newData)

    const next = items[index + 1]

    if(currentSide === "B") await flipCard()
    else await cardAnimateFlip()

    if(!next) {
      setCurrentItem(items[0])
    } else {
      setCurrentItem(next)
    }

    

    /* this code below for dropping a copy of the card is kinda glitchy and I don't know why */
    //   flipCard()
    // if(currentSide === "B")   {
    //   flipCard()
    //   .then(() => {
    //     cardCopyAnimateOnNext(succ ? "var(--color-accent)" : "var(--color-warning)")
    //   })
    // } 
    // else {
    //   cardCopyAnimateOnNext(succ ? "var(--color-accent)" : "var(--color-warning)")
    // }

    // setIsAnimatingNext(true)
  }

  function updateObjectOfType<T extends object>(target: T, newData: Partial<T>): T {
    const result = {...target};
    (Object.keys(newData) as (keyof T)[]).forEach((key) => {
        const value = newData[key];
        if (value !== undefined) {
          result[key] = value;
        }
    });
    return result
  }

  const updateItems = (id: number, newData: Partial<Item>) => {
    const newItems = items.map((item) => {
      return item.id === id ? updateObjectOfType(item, newData) : item
    })
    setItems(newItems)
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

  /* this shit was broken */
  const cardCopyAnimateOnNext = useCallback(async (fadeColor: string | undefined) => {
    animatorCardCopy.set(
      {
        position: "absolute",
        x: 0,
        y: 0,
        rotateZ: "0",
        opacity: 0.5,
        backgroundColor: "var(--color-light-7)",
      }
    )
    animatorCard.set({
      y: 5,
      rotateY: "0",
      rotateZ: "-3deg",
      scale: 1,
      opacity: 0.0,
    })
    animatorCard.start({
      y: 0,
      rotateY: "0",
      rotateZ: "0",
      scale: 1,
      opacity: 1,
      transition: {duration: 0.2, easings: [0.3, 0.9, 0.1, 1.0]}
    })
    await animatorCardCopy.start({
      position: "absolute",
      x: 5,
      y: 150,
      rotateZ: "9deg",
      opacity: 0,
      backgroundColor: fadeColor,
      transition: {duration: 0.5, ease: [0.5, 0.9, 0.1, 1.0]}
    })
    setIsAnimatingNext(false)
  }, [animatorCard, animatorCardCopy])

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
    return <div className="window--train--buttons">
      <button className="window--train--button--fail warning" onClick={() => showNextItem(false)}>Fail</button>
      <button className="window--train--button--success" onClick={() => showNextItem(true)}>Success</button>
      <button className="window--train--button--review">Review</button>
    </div>
  }

  return <div id="window--train" className="window" style={{pointerEvents: isAnimatingNext ? "none" : undefined}}>
    {createCard()}
    {createButtons()}
    {createMessageError()}
    {createMessageLoading()}
  </div>
}