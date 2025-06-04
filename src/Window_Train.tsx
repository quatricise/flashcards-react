import React, { useState, useCallback, useEffect, type KeyboardEvent, useRef } from "react"
import { useQuery, gql } from "@apollo/client"
import { motion, useAnimation } from "motion/react"

import { cloneDeep } from "@apollo/client/utilities"
import type { Item, Window_Train_Props, Team } from "./GlobalTypes"
// import { TrainingDataLSKey } from "./GlobalTypes"
import { useAppDispatch, useAppState } from "./GlobalContext"
import { clamp, randomIntFromTo, sum, waitFor } from "./GlobalFunctions"
import type { AnimationControls } from "motion/react"
import "./Window_Train.css"
import { playSound, playSoundRandom, Sounds } from './SFX';


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
const bucketWeights = [6, 4, 3, 2, 1]
const bucketCount = bucketWeights.length

type GET_ITEMS_RETURN = {
  itemsByDatasetIds: Item[]
}

type ItemWithWeight = Item & { weight: number }

type GoldenCardChoice = "return" | "throw"

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

  //updates Items so they contain the necessary important properties
  useEffect(() => {
    if(data === undefined) return
    const bucket = 3 
    setItems(data.itemsByDatasetIds.map(i => { return {...i, bucket: bucket, value: 0}}))
    setCurrentItem({...data.itemsByDatasetIds[0], bucket: bucket, value: 0})
  }, [data])

  const isBrainrot: boolean = trainingMode === "brainrot"
  const dummyTeam: Team = {title: "", score: [], failedThisTurn: false}
  const itemsPerTeam = 6

  const [currentSide, setCurrentSide]                     = useState<"A"|"B">("A")
  const [currentItem, setCurrentItem]                     = useState<Item | null>(null)
  const [items, setItems]                                 = useState<Item[]>([])
  const [currentTeam, setCurrentTeam]                     = useState<Team>(isBrainrot ? teams[0] : dummyTeam)
  const [currentTeamIndex, setCurrentTeamIndex]           = useState<number>(0)
  const [itemIndexForTeam, setItemIndexForTeam]           = useState<number>(0)
  const [drinkPopupTitle, setDrinkPopupTitle]             = useState<string>(isBrainrot ? teams[0]?.title : "")
  const [drinkPopupDescription, setDrinkPopupDescription] = useState<string>("🍻")
  const [currentRound, setCurrentRound]                   = useState<number>(1) //1-indexed, not 0-indexed

  /* booleans */
  const [isAnimating, setIsAnimating]                     = useState<boolean>(false)
  const [isTrainingDone, setIsTrainingDone]               = useState<boolean>(false)
  const [isGoldenCardChoice, setIsGoldenCardChoice]       = useState<boolean>(false)
  const refButtonFail = useRef<HTMLButtonElement>(null)
  const refButtonSuccess = useRef<HTMLButtonElement>(null)
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

  const failedLastXTimesThisTurn = (team: Team, x: number) => {
    const index_end = team.score.length
    const index_start = clamp(index_end, 0, Infinity) - clamp(x, 0, Infinity)
    const fails = sum(...team.score.slice(index_start, index_end).map(attempt => attempt.success ? 0 : 1)) 
    // console.log(`Team at index: ${currentTeamIndex} score: \n`, team.score.map(att => att.success))
    return fails === x && fails === clamp(x, 0, itemIndexForTeam + 1) 
  }

  const failedXtimesThisTurn = (team: Team, x: number) => {
    let fails = team.score.map(attempt => attempt.success ? 0 : 1)
    fails = fails.slice(fails.length - clamp(fails.length, 0, itemIndexForTeam + 1))
    const failCount = sum(...fails)
    return failCount >= x
  }

  const showNextItem_Brainrot = async (success: boolean, goldenCardChoice?: GoldenCardChoice) => {
    if(!currentItem) return
    if(items.length <= 1) return trainingStop()
    if(isAnimating) return

    const nextItemIndex = itemIndexForTeam + 1
    const shouldChangeTeam = nextItemIndex > itemsPerTeam - 1

    setIsAnimating(true)

    teams[currentTeamIndex].score.push({success})
    const hasFailed = failedXtimesThisTurn(teams[currentTeamIndex], 3)

    if(success) {
      playSoundRandom(["success_1", "success_2"])
      await waitFor(700)
    }
    else {
      playSoundRandom(["failure_1", "failure_2", "failure_3"])
      await waitFor(600)
    }
    
    //basic drink condition
    if(
      hasFailed && 
      teams[currentTeamIndex].failedThisTurn === false &&
      currentRound > 1
    ) {
      console.log("Has failed this turn: ", teams[currentTeamIndex].failedThisTurn)
      animateDrinkPopup(currentTeam.title)
      teams[currentTeamIndex].failedThisTurn = true
    }

    const failedGoldenCard = !success && currentItem.bucket === bucketCount - 1

    if(failedGoldenCard) {
      animateDrinkPopup(currentTeam.title, String(currentItem.value))
    }


    //change team because the current already gone through the correct amount of cards
    if(shouldChangeTeam) {

      playSoundRandom(["team_change_1", "team_change_2", "team_change_3", "team_change_4"])

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


      // important thing !
      // here must be a choice presented, if you succeed on the card, the success button changes to a double-button
      // "Throw | Return" this will be a choice you have to make, based on that it will actually call the showNextItemBrainrot function
      
      if(success && goldenCardChoice === "throw") {
        item = {...item, bucket: item.bucket + 1}
      } else
      if(success && goldenCardChoice === "return") {
        item = {...item, bucket: item.bucket - 1, value: item.value + 1}
      } else
      if(success) {
        item = {...item, bucket: item.bucket + 1}
      } else
      if(!success) {
        item = {...item, bucket: item.bucket - 1}
      }

      if(item.bucket < 0) {
        item.bucket = 0
        return newItems.concat([item])
      } else
      if(item.bucket >= bucketWeights.length && goldenCardChoice === "throw") {
        return newItems //return without the item, because it was succeeded 5 times and also goldencardchoise was "throw"
      } else {
        return newItems.concat([item])
      }
    })
    
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
    setIsGoldenCardChoice(false)
  }
  const showNextItem_Regular = async (success: boolean) => {
    if(!currentItem) return
    if(items.length <= 1) return trainingStop()
    if(isAnimating) return

    setIsAnimating(true)

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
      if(item.bucket >= bucketCount) {
        return newItems //return without the item, because you succeeded 5 times
      } else {
        return newItems.concat([item])
      }
    })

    let nextItem: ItemWithWeight | undefined

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
      await flipCard()
      setCurrentItem(nextItem) 
    }
    else {
      await cardAnimateFlip()
      setCurrentItem(nextItem) 
    }

    setIsAnimating(false)
  }

  const showNextItem = isBrainrot ? showNextItem_Brainrot : showNextItem_Regular

  const trainingStop = () => {
    setIsTrainingDone(true)
  }

  const trainingResume = () => {
    setIsTrainingDone(false)
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

    await waitFor(800) //to line up better with the sound effect and look nicer
  }

  const calculateTeamSuccessPercentage = (team: Team): number => {
    if(team.score.length === 0) return 0

    const successes = sum(...team.score.map(sc => Number(sc.success)))
    const attempts = team.score.length
    const decimals = 2
    const factor = Math.pow(10, decimals);
    return Math.round((successes/attempts) * 100 * factor) / factor
  }

  const onSuccess = () => {
    if(!currentItem) throw "Wtf, no item?"

    if(currentItem.bucket < bucketCount - 1) {
      showNextItem(true)
    }
    else {
      setIsGoldenCardChoice(true)
    }
  }

  const onFailure = () => {
    showNextItem(false)
  }

  const createTrainingDoneMessage = () => {
    if(trainingMode === "brainrot") {
      const newTeams = [...teams]
      newTeams.sort((a, b) => calculateTeamSuccessPercentage(b) - calculateTeamSuccessPercentage(a))
      const winningTeam = newTeams[0]

      const createTeams = () => {
        return newTeams.map((t, i) => {
          return <div className="training-card--side-end--team" key={i}>
            <div>{t.title}:</div>
            <div>{calculateTeamSuccessPercentage(t) + "%"}</div>
          </div>
        })
      }

      return <div className="training-card side-end">
        <h1 className="training-card--side-end--title">Congratulations!</h1>
        <h1 className="training-card--side-end--winning-team">{winningTeam.title}</h1>
        <div className="training-card--side-end--description">
          <div className="training-card--side-end--teams">
            {createTeams()}
          </div>
        </div>
      </div>
    }
    else
    if(trainingMode === "regular") {
      return <div className="training-card side-end">
        <h1 className="training-card--side-end--title" >Congratulations!</h1>
        <div className="training-card--side-end--description" >You have finished your training. You can rest now.</div>
      </div>
    }
  }

  const createTeam = () => {
    if(!isBrainrot) return null
    return <motion.div className="window--train--team" animate={animatorTeams}>
      <div className="window--train--team--title">Team:</div>
      <div className="window--train--team--description">{currentTeam.title}</div>
      <div className="window--train--team--round">Round: {currentRound}</div>
    </motion.div>
  }

  const animatorDrinkPopup = useAnimation()

  const animateDrinkPopup = async (text: string, description: string = "🍻") => {
    playSound("drink_up")
    setDrinkPopupTitle(text)
    setDrinkPopupDescription(description)
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
                <div className="window--train--drink-popup--description">{drinkPopupDescription}</div>
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
    
    if(isBrainrot) {
      if(currentItem.bucket === 4) className += " golden"
    }

    const createElement = (animator: AnimationControls, isVisible: boolean, onclick?: () => void) => {

      return <motion.div className={className} title="Click or [Arrows] to flip" onClick={onclick ?? undefined} animate={animator} style={
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
    if(e.code === "Delete" || e.code === "Backspace") {
      refButtonFail.current?.classList.add("active")
      waitFor(200).then(() => {
        showNextItem(false)
        refButtonFail.current?.classList.remove("active")
      })
    }
    if(e.code === "Enter" || e.code === "NumpadEnter") {
      refButtonSuccess.current?.classList.add("active")
      waitFor(200).then(() => {
        showNextItem(true)
        refButtonSuccess.current?.classList.remove("active")
      })
    }
    if(e.code === "ArrowLeft" || e.code === "ArrowRight" ||  e.code === "ArrowUp" ||  e.code === "ArrowDown") {
      e.preventDefault()
      flipCard()
    }
    if(e.code === "Backquote") {
      if(isTrainingDone)  trainingResume() 
      else                trainingStop()
    }
  }

  const createButtons = () => {
    const style: Partial<React.CSSProperties> = isTrainingDone ? {opacity: 0.5, pointerEvents: "none"} : {opacity: 1.0, pointerEvents: "all"}
    const preventDefaultButtonBehavior = (e: KeyboardEvent) => {
      e.preventDefault()
    }
    return <div className="window--train--buttons" style={style}>
      <button tabIndex={-1} className="window--train--button--fail warning" title="[Delete or Backspace]" onKeyDown={preventDefaultButtonBehavior} onClick={onFailure} ref={refButtonFail}>
        <div className="icon cross"></div>
        <div>Fail</div>
      </button>
      {
        isGoldenCardChoice &&
        <div className="window--train--buttons--golden-card-choice">
          <button className="window--train--button--golden-card-choice" onClick={() => showNextItem(true, "return")}>Return</button>
          <button className="window--train--button--golden-card-choice" onClick={() => showNextItem(true, "throw")}>Throw</button>
        </div>
      }
      {
        !isGoldenCardChoice &&
        <button tabIndex={-1} className="window--train--button--success" title="[Enter]" onKeyDown={preventDefaultButtonBehavior} onClick={onSuccess} ref={refButtonSuccess}>
          <div className="icon tick"></div>
          <div>Success</div>
        </button>
      }
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