import React, { useState, useCallback, useEffect, type KeyboardEvent } from "react"
import { useQuery, gql } from "@apollo/client"
import { motion, useAnimation } from "motion/react"

import { cloneDeep } from "@apollo/client/utilities"
import type { Item, Window_Train_Props, Team } from "./GlobalTypes"
// import { TrainingDataLSKey } from "./GlobalTypes"
import { useAppDispatch, useAppState } from "./GlobalContext"
import { clamp, sum, waitFor } from "./GlobalFunctions"
import type { AnimationControls } from "motion/react"
import "./Window_Train.css"
import { playSound } from "./SFX"


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

  const dispatch  = useAppDispatch()
  const state     = useAppState()

  useEffect(() => {
    if(data === undefined) return
    setItems(data.itemsByDatasetIds.map(i => { return {...i, bucket: 0}}))
    setCurrentItem(data.itemsByDatasetIds[0])
  }, [data])

  const [currentSide, setCurrentSide]           = useState<"A"|"B">("A")
  const [currentItem, setCurrentItem]           = useState<Item | null>(null)
  const [isAnimating, setIsAnimating]           = useState<boolean>(false)
  const [items, setItems]                       = useState<Item[]>([])
  const [isTrainingDone, setIsTrainingDone]     = useState<boolean>(false)
  const [currentTeam, setCurrentTeam]           = useState<Team>(teams[0])
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0)
  const [itemIndexForTeam, setItemIndexForTeam] = useState<number>(0)
  const [drinkPopupTitle, setDrinkPopupTitle]   = useState<string>(teams[0].title)
  const [currentRound, setCurrentRound]         = useState<number>(1) //1-indexed, not 0-indexed

  // if(localStorage.getItem(TrainingDataLSKey)) {
  //   const d = localStorage.getItem(TrainingDataLSKey)
  //   setCurrentSide(d.currentSide)
  //   setCurrentItem(d.currentItem)
  //   setIsAnimating(d.isAnimating)
  //   setItems(d.items)
  //   setIsTrainingDone(d.isTrainingDone)
  //   setCurrentTeam(d.currentTeam)
  //   setCurrentTeamIndex(d.currentTeamIndex)
  //   setItemIndexForTeam(d.itemIndexForTeam)
  //   setDrinkPopupTitle(d.drinkPopupTitle)
  //   setCurrentRound(d.currentRound)
  //   console.log("applied state data")
  // }

  const flipCard = async () => {
    await cardAnimateFlip()
    setCurrentSide((prev) => prev === "A" ? "B" : "A")
  }

  const itemsPerTeam = 6

  const failedLastXTimesThisTurn = (team: Team, x: number) => {
    const index_end = team.score.length
    const index_start = clamp(index_end, 0, Infinity) - clamp(x, 0, Infinity)
    // im converting successes to fails, that's why return 0 when it's success and vice versa
    const fails = sum(...team.score.slice(index_start, index_end).map(attempt => attempt.success ? 0 : 1)) 
    console.log(`Team at index: ${currentTeamIndex} score: \n`, team.score.map(att => att.success))
    return fails === x && fails === clamp(x, 0, itemIndexForTeam + 1)
  }

  const showNextItem = async (success: boolean) => {
    if(!currentItem) return
    if(items.length <= 1) return stopTraining()

    setIsAnimating(true)

    teams[currentTeamIndex].score.push({success})
    const hasFailed = failedLastXTimesThisTurn(teams[currentTeamIndex], 3)
    

    //drink condition, @todo update for the golden card logic
    if(
      hasFailed && 
      teams[currentTeamIndex].failedThisTurn === false &&
      currentRound > 1
    ) {
      console.log("Has failed this turn: ", teams[currentTeamIndex].failedThisTurn)
      animateDrinkPopup(currentTeam.title)
      teams[currentTeamIndex].failedThisTurn = true
    }

    const nextItemIndex = itemIndexForTeam + 1
    const shouldChangeTeam = nextItemIndex > itemsPerTeam - 1

    //change team because the current already gone through the correct amount of cards
    if(shouldChangeTeam) {

      playSound("team_change")

      /* reset the fail state for current team */
      teams[currentTeamIndex].failedThisTurn = false

      const t = teams.find(t => t.title === currentTeam.title)
      if(!t) throw "Fuck"

      const shouldBeNextRound = currentTeamIndex >= teams.length - 1

      if(shouldBeNextRound) {
        setCurrentTeam(teams[0])
        setCurrentTeamIndex(0)
        setCurrentRound(prev => prev + 1)
      } else {
        setCurrentTeam(teams[currentTeamIndex + 1])
        setCurrentTeamIndex(currentTeamIndex + 1)
      }

      setItemIndexForTeam(0)
    }
    else 
    {
      setItemIndexForTeam(nextItemIndex)
    }

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

    
    if(!nextItem) throw new Error("No next item")

    if(currentSide === "B") {
      if(shouldChangeTeam) {
        await teamsAnimateChange(() => setCurrentItem(nextItem))
        await flipCard()
      }
      else {
        await flipCard()
        setCurrentItem(nextItem) 
      }
    }
    else {
      if(shouldChangeTeam) {
        await teamsAnimateChange(() => setCurrentItem(nextItem))
        await cardAnimateFlip()
      }
      else {
        await cardAnimateFlip()
        setCurrentItem(nextItem) 
      }
    }

    setIsAnimating(false)
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
  const animatorTeams =     useAnimation()

  const cardAnimateFlip = useCallback(async () => {
    playSound("card_flip")
    animatorCard.set({opacity: 1.0, rotateZ: 0, rotateY: 0})
    await animatorCard.start({
      y: -5,
      x: 5,
      rotateY: 4,
      rotateZ: -10,
      scale: 0.97,
      opacity: 1.0,
      transition: {duration: 0.02}
    })
    await animatorCard.start({
      y: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      opacity: 1.0,
      transition: {duration: 0.02, easings: ["easeIn", "easeOut"]}
    })
  }, [animatorCard])

  const teamsAnimateChange = async (onCardDisappear: (() => void)) => {
    const transition = {duration: 0.35, ease: [0.1, 0.1, 0.1, 1.0]}
    await animatorCard.start({
      rotateZ: -3,
      opacity: 1.0,
      transition: {duration: 0.03, ease: [0.1, 0.1, 0.1, 1.0]}
    })
    await animatorCard.start({
      opacity: 0.0,
      scale: 0.89,
      rotateZ: 3,
      transition
    })
    await animatorTeams.start({
      backgroundColor: "var(--color-accent)",
      transform: "scale(1.5)",
      transition
    })
    onCardDisappear()
    await waitFor(100)
    await animatorTeams.start({
      backgroundColor: "var(--color-light-7)",
      transform: "scale(1.0)",
      transition
    })

    // /* we do not await this one, the card needs to be flipped before this */
    // animatorCard.start({
    //   opacity: 1.0,
    //   scale: 1.0,
    //   rotate: 0,
    //   transition: {duration: 0.02, ease: [0.1, 0.1, 0.1, 1.0]}
    // })
  }

  const createTrainingDoneMessage = () => {
    if(trainingMode === "brainrot") {
      return <div className="training-card side-end">
        <h1 className="training-card--side-end--title" >Congratulations!</h1>
        <div className="training-card--side-end--description" >The winning team is: {"@todo team"}.</div>
      </div>
    }

    if(trainingMode === "regular") {
      return <div className="training-card side-end">
        <h1 className="training-card--side-end--title" >Congratulations!</h1>
        <div className="training-card--side-end--description" >You have finished your training. You can rest now.</div>
      </div>
    }
  }

  const createTeam = () => {
    return <motion.div className="window--train--team" animate={animatorTeams}>
      <div className="window--train--team--title">Team:</div>
      <div className="window--train--team--description">{currentTeam.title}</div>
      <div className="window--train--team--round">Round: {currentRound}</div>
    </motion.div>
  }

  const animatorDrinkPopup = useAnimation()

  const animateDrinkPopup = async (text: string) => {
    playSound("drink_up")
    setDrinkPopupTitle(text)
    const animator = animatorDrinkPopup
    await animator.start({
      scale: [0, 1.2, 0.9, 1.1, 1],
      rotate: [0, 360, 330, 360, 0],
      opacity: [0, 0.8, 1, 1, 1],
      y: 0,
      transition: {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.3, 0.6, 0.8, 1],
      }
    })
    await animator.start({
      scale: 0,
      rotate: 0,
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.5,
        ease: "anticipate",
      }
    })
  }

  const createDrinkPopup = () => {
    return <motion.div 
              className="window--train--drink-popup"
              animate={animatorDrinkPopup}>
              <div className="window--train--drink-popup--contents">
                <img src="none" alt="" />
                <div className="window--train--drink-popup--title">{drinkPopupTitle}</div>
                <div className="window--train--drink-popup--description">🍻</div>
              </div>
            </motion.div>
  }

  const createCard = () => {
    if(!currentItem) return

    let className = "training-card"
    
    if(currentSide === "B") {
      className += " side-b"
    }

    if(currentSide === "A") {
      className += " side-a"
    }
    
    if(trainingMode === "brainrot") {
      if(currentItem.bucket === 4) className += " golden"
    }

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
      {/* {createElement(animatorCardCopy, isAnimating)} */}
    </>
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if(e.code === "Escape") {
      dispatch({name: "APPLY_FLAGS", payload: {flags: {showNav: !state.flags.showNav}}})
    }
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

  let classWindow = "window"
  if(trainingMode === "brainrot") {
    classWindow += " brainrot"
  }
  if(state.flags.showNav) {
    classWindow += " top-padding"
  }

  // const stateData = {
  //   currentSide,
  //   currentItem,
  //   isAnimating,
  //   items,
  //   isTrainingDone,
  //   currentTeam,
  //   currentTeamIndex,
  //   itemIndexForTeam,
  //   drinkPopupTitle,
  //   currentRound,
  // }

  // window.onbeforeunload = () => {
  //   console.log("Set localStorage to", stateData)
  //   localStorage.setItem(TrainingDataLSKey, JSON.stringify(stateData, undefined, 2))
  // }

  //i need to make sure the state data is restored when you restart the app, 
  // I think this is a case for @todo, because about the global state management, will it open on the last opened tab?

  return <div id="window--train" className={classWindow} style={{pointerEvents: isAnimating ? "none" : undefined}} tabIndex={0} onKeyDown={handleKeyDown}>
    {createTeam()}
    {!isTrainingDone && createCard()}
    {isTrainingDone && createTrainingDoneMessage()}
    {createButtons()}
    {createMessageError()}
    {createMessageLoading()}
    {createDrinkPopup()}
  </div>
}