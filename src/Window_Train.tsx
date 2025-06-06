/* dependencies */
import React, { useState, useCallback, useEffect, type KeyboardEvent, useRef } from "react"
import { useQuery, gql } from "@apollo/client"
import { motion, useAnimation } from "motion/react"
import { cloneDeep } from "@apollo/client/utilities"
import type { AnimationControls } from "motion/react"

/* my stuff */
import type { Item, Window_Train_Props, Team } from "./GlobalTypes"
import { TrainingDataLSKey } from "./GlobalTypes"
import { useAppDispatch, useAppState } from "./GlobalContext"
import { clamp, downloadJSON, getCurrentDate, sum, waitFor } from "./GlobalFunctions"
import { playSound, playSoundRandom } from './SFX'
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
const bucketWeights = [6, 4, 3, 2, 1]
const bucketCount = bucketWeights.length

type GET_ITEMS_RETURN = {
  itemsByDatasetIds: Item[]
}

type ItemWithWeight = Item & { weight: number }

type GoldenCardChoice = "return" | "throw"

/** Contains important state vars which need to be saved to localStorage so the window can restore its state after closing unintentionally. It's a bit hacky and needs to be kept in sync with the window's actual vars. */
const lsSchemaInitial = {
  currentSide:            "A" as "A" | "B",
  currentItem:            {id: 0, title: "", description: "", images: [], datasets: [], bucket: 0, value: 0 } as Item | null,
  items:                  [] as Item[],
  teams:                  [] as Team[],
  currentTeam:            {title: "", score: [], failedThisTurn: false} as Team,
  currentTeamIndex:       0,
  itemIndexForTeam:       0,
  currentRound:           0,
  drinkPopupTitle:        "",
  drinkPopupDescription:  "",
  isAnimating:            false,
  isTrainingDone:         false,
  isGoldenCardChoice:     false,
}

type LSSchema = typeof lsSchemaInitial

const validateLSSchema = (obj: Record<string, unknown>): boolean => {
  return (Object.keys(lsSchemaInitial) as (keyof LSSchema)[]).every((key) => {
    const schemaVal = lsSchemaInitial[key]
    const objVal = obj[key]

    if (!(key in obj)) {
      console.log("No key in object: ", key)
      return false
    }
    if (schemaVal === null) {
      return objVal === null
    }
    if (Array.isArray(schemaVal)) {
      return Array.isArray(objVal)
    }
    return typeof objVal === typeof schemaVal
  })
}

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






export default function Window_Train({ datasetIds, trainingSetup, trainingMode, teams: teamsInput }: Window_Train_Props) {

  const {data, loading: dataLoading, error: dataError} = useQuery<GET_ITEMS_RETURN>(GET_ITEMS, {
    variables: {datasetIds}
  })

  const dispatch  = useAppDispatch()
  const state     = useAppState()

  const isBrainrot: boolean = trainingMode === "brainrot"
  const dummyTeam: Team = {title: "", score: [], failedThisTurn: false}
  const itemsPerTeam = 6

  const [currentSide, setCurrentSide]                       = useState<"A"|"B">("A")
  const [currentItem, setCurrentItem]                       = useState<Item | null>(null)
  const [items, setItems]                                   = useState<Item[]>([])
  const [teams, setTeams]                                   = useState<Team[]>([])
  const [currentTeam, setCurrentTeam]                       = useState<Team>(dummyTeam)
  const [currentTeamIndex, setCurrentTeamIndex]             = useState<number>(0)
  const [itemIndexForTeam, setItemIndexForTeam]             = useState<number>(0)
  const [drinkPopupTitle, setDrinkPopupTitle]               = useState<string>("Title missing!")
  const [drinkPopupDescription, setDrinkPopupDescription]   = useState<string>("🍻")
  const [cardReturnTitle, setCardReturnTitle]               = useState<string>("Title missing!")
  const [teamGetPointsTitle, setTeamGetPointsTitle]         = useState<string>("Title missing!")
  const [currentRound, setCurrentRound]                     = useState<number>(1) //1-indexed, not 0-indexed

  /* booleans */
  const [isAnimating, setIsAnimating]                       = useState<boolean>(false)
  const [isTrainingDone, setIsTrainingDone]                 = useState<boolean>(false)
  const [isGoldenCardChoice, setIsGoldenCardChoice]         = useState<boolean>(false)
  const [isRestoreSessionDialog, setIsRestoreSessionDialog] = useState<boolean>(false)

  /* refs */
  const refButtonFail =                     useRef<HTMLButtonElement>(null)
  const refButtonSuccess =                  useRef<HTMLButtonElement>(null)
  const refButtonGoldenCardChoiceReturn =   useRef<HTMLButtonElement>(null)
  const refButtonGoldenCardChoiceThrow =    useRef<HTMLButtonElement>(null)

  /* animators */
  const animatorCard =          useAnimation()
  const animatorTeams =         useAnimation()
  const animatorDrinkPopup =    useAnimation()
  const animatorCardReturn =    useAnimation()
  const animatorTeamGetPoints = useAnimation()
  const animatorCardEnd =       useAnimation()

  //updates fetched items so they contain the necessary important properties for this window to work, these are not found in the database and so cannot be fetched
  useEffect(() => {
    if(data === undefined) return
    const bucket = 0 //outside of testing, this is always === 0, items start in the first bucket, obviously
    setItems(data.itemsByDatasetIds.map(i => { return {...i, bucket: bucket, value: 0}}))
    setCurrentItem({...data.itemsByDatasetIds[0], bucket: bucket, value: 0})
  }, [data])

  useEffect(() => {
    setTeams(teamsInput)
    setCurrentTeam(teamsInput[0])
  }, [teamsInput])

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
    const failedGoldenCard = !success && currentItem.bucket === bucketCount - 1

    //we write data here and then assign it in the only setTeams() call
    const currTeamNewVal = cloneDeep(teams[currentTeamIndex])

    setIsAnimating(true)

    currTeamNewVal.score.push({success})
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
      !failedGoldenCard &&
      currTeamNewVal.failedThisTurn === false &&
      currentRound > 1
    ) {
      animateDrinkPopup(currentTeam.title)
      currTeamNewVal.failedThisTurn = true
    }

    if(failedGoldenCard && currentItem.value > 0) {
      let drinkCount = currentItem.value
      if(hasFailed) {
        drinkCount++
      }
      animateDrinkPopup(currentTeam.title, String(drinkCount) + "🍻")
    }


    //change team because the current already gone through the correct amount of cards
    if(shouldChangeTeam) {

      playSoundRandom(["team_change_1", "team_change_2", "team_change_3", "team_change_4"])

      /* reset the fail state for current team */
      currTeamNewVal.failedThisTurn = false

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

    //we simply add an extra success point for the goldenCardChoice here
    //no - actually the value on the card is what you get, so now there is a degree of strategy, do you cash in or let somebody else do it.
    if(goldenCardChoice === "throw") {
      for(let i = 0; i < currentItem.value; ++i) {
        currTeamNewVal.score.push({success: true})
      }
      // console.log(`Added ${currentItem.value} to team ${currentTeam.title}'s score.`)
      if(currentItem.value > 0) {
        animateTeamGetPoints(`Team ${currentTeam.title} \n gains ${String(currentItem.value)} extra ${currentItem.value !== 1 ? "points" : "point"}!`)
      }
    }

    setTeams(() => {
      ///we trust the currentTeamIndex to be accurate here, which it fucking should
      console.log("showNextItem_Brainrot(): setTeams()")
      const newTeams = [...teams]
      newTeams[currentTeamIndex] = currTeamNewVal
      return newTeams
    })

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



      //goodness gracious these if statements

      if(success && goldenCardChoice === "throw") {
        item = {...item, bucket: item.bucket + 1}
        playSound("card_throw")
      } else

      if(success && goldenCardChoice === "return") {
        item = {...item, bucket: item.bucket - 1, value: item.value + 1}
        animateCardReturn(String(item.value))
        playSound("card_return")
      } else

      if(success) {
        item = {...item, bucket: item.bucket + 1}
      } else

      if(!success && failedGoldenCard) {
        item = {...item, bucket: item.bucket - 1} //failing a golden card does not increase value
      } else

      if(!success && !failedGoldenCard) {
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
        if(typeof weight !== "number") throw new Error(`No weight for bucket: ${i.bucket}`)
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

  //this is a bit weird, but training is done even when there was one card and it was failed. Probably should not happen but fuck it, it doesn't break the game
  const trainingStop = () => {
    if(trainingMode === "brainrot") {
      playSound("card_throw")
      waitFor(1200).then(() => {
        setIsTrainingDone(true)
        waitFor(10).then(() => cardEndAnimate()) //the wait is here cos of state update delay
      })
    }
    if(trainingMode === "regular") {
      setIsTrainingDone(true)
    }
  }

  const trainingResume = () => {
    setIsTrainingDone(false)
  }

  const cardEndAnimate = async () => {
    animatorCardEnd.set(cardEndAnimations.initial)
    await animatorCardEnd.start({
      rotateZ: [2, -2, 0, 0],
      scale: [0.98, 0.95, 0.98, 1.0],
      transition: {duration: 0.25, easings: ["circInOut"], times: [0.1, 0.8, 0.5, 1.0]}
    })
  }

  const cardEndAnimations = {
    initial: {rotateZ: 2, scale: 0.98}
  }

  const flipCard = async () => {
    await cardAnimateFlip()
    setCurrentSide((prev) => prev === "A" ? "B" : "A")
  }

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

  const calculateTeamScore = (team: Team) => {
    return sum(...team.score.map(s => Number(s.success)))
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

  const downloadResults = () => {

    //@todo this should download something useful, but maybe it's actually nice to get the state data.

    const schema = createLSSchema()
    const results = {
      teams: schema.teams.map(t => {
        return {
          title: t.title,
          points: calculateTeamScore(t),
          percent: calculateTeamSuccessPercentage(t)
        }
      }),
    }
    downloadJSON(results, "brainrot_quiz__results_" + getCurrentDate() + ".json")
  }

  const createLSSchema = (): LSSchema => {
    const stateData: LSSchema = {
      currentSide,
      currentItem,
      items,
      teams,
      currentTeam,
      currentTeamIndex,
      itemIndexForTeam,
      drinkPopupTitle,
      drinkPopupDescription,
      currentRound,
      isAnimating,
      isTrainingDone,
      isGoldenCardChoice,
    }
    return stateData
  }

  const createTrainingDoneMessage = () => {
    if(trainingMode === "brainrot") {

      const newTeams = [...teams]
      newTeams.sort((a, b) => calculateTeamSuccessPercentage(b) - calculateTeamSuccessPercentage(a))
      const highestPercent = calculateTeamSuccessPercentage(newTeams[0])

      const winningTeams = newTeams.filter(t => calculateTeamSuccessPercentage(t) === highestPercent)
      winningTeams.sort((a, b) => calculateTeamScore(b) - calculateTeamScore(a))
      const winningTeam = winningTeams[0]
      
      const createTeams = () => {
        return newTeams.map((t, i) => {
          return <div className="training-card--side-end--team" key={i}>
            <div style={{whiteSpace: "nowrap", textOverflow: "ellipsis"}} >{t.title}</div>
            <div style={{display: "flex", gap: "15px"}}>
              <div style={{whiteSpace: "nowrap", fontWeight: 600}} >{calculateTeamSuccessPercentage(t) + "%"}</div>
              <div style={{whiteSpace: "nowrap"}} >(Points: {sum(...t.score.map(sc => Number(sc.success)).filter(sc => sc !== 0))})</div>
            </div>
          </div>
        })
      }

      return <motion.div className="training-card side-end" animate={animatorCardEnd} variants={cardEndAnimations} initial="initial">
        <h1 className="training-card--side-end--title">Congratulations,</h1>
        <h1 className="training-card--side-end--winning-team">🎉 {winningTeam.title}! 🎉</h1>
        <div className="training-card--side-end--description">
          <div className="training-card--side-end--teams">
            {createTeams()}
          </div>
        </div>
        <button className="training-card--side-end--button--download-data" tabIndex={-1} onClick={downloadResults} >Download results</button>
      </motion.div>
    }
    else
    if(trainingMode === "regular") {
      return <div className="training-card side-end">
        <h1 className="training-card--side-end--title" >Congratulations,</h1>
        <div className="training-card--side-end--description" >You have finished your training!</div>
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


  const animateDrinkPopup = async (text: string, description: string = "🍻") => {
    playSound("drink_up")
    setDrinkPopupTitle(text)
    setDrinkPopupDescription(description)
    const animator = animatorDrinkPopup
    await animator.start({
      scale: [0, 1.2, 0.9, 1.1, 1],
      rotate: [0, 360, 330, 360, 0],
      opacity: [0, 0.8, 1, 1, 1],
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

  const animateCardReturn = async (title: string) => {
    setCardReturnTitle(title)
    await animatorCardReturn.start({
      scale: [0, 1.2, 0.9, 1.1, 1],
      rotate: [0, 360, 330, 360, 0],
      opacity: [0, 0.8, 1, 1, 1],
      y: 50,
      transition: {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.3, 0.6, 0.8, 1],
      }
    })
    await animatorCardReturn.start({
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

  const createCardReturn = () => {
    return  <motion.div 
            className="window--train--card-return-popup"
            animate={animatorCardReturn}>
              <div className="window--train--card-return-popup--title" >
                {cardReturnTitle}
              </div>
            </motion.div>
  }

  const animateTeamGetPoints = async (title: string) => {
    setTeamGetPointsTitle(title)
    await animatorTeamGetPoints.start({
      scale: [0, 1.2, 0.9, 1.1, 1],
      rotate: [0, 360, 330, 360, 0],
      opacity: [0, 0.8, 1, 1, 1],
      y: 50,
      transition: {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.3, 0.6, 0.8, 1],
      }
    })
    await animatorTeamGetPoints.start({
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

  const createTeamGetPoints = () => {
    return  <motion.div 
            className="window--train--team-get-points"
            animate={animatorTeamGetPoints}>
              <div className="window--train--team-get-points--title" >
                {teamGetPointsTitle}
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
    </>
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const actionLeftButton = e.code === "Delete" || e.code === "Backspace"
    const actionRightButton = e.code === "Enter" || e.code === "NumpadEnter"
    const buttonWaitMS = 200

    const shouldFlip = e.code === "ArrowLeft" || e.code === "ArrowRight" ||  e.code === "ArrowUp" ||  e.code === "ArrowDown"
    
    if(e.code === "Escape") {
      dispatch({name: "APPLY_FLAGS", payload: {flags: {showNav: !state.flags.showNav}}})
    }
    
    if(e.code === 'KeyA') {
      cardEndAnimate()
    }

    if(actionLeftButton) {
      if(isGoldenCardChoice) {
        const button = refButtonGoldenCardChoiceReturn

        button.current?.classList.add("active")
        waitFor(buttonWaitMS).then(() => {
          showNextItem(true, "return")
          button.current?.classList.remove("active")
        })
      } 
      else {
        const button = refButtonFail

        button.current?.classList.add("active")
        waitFor(buttonWaitMS).then(() => {
          showNextItem(false)
          button.current?.classList.remove("active")
        })
      }
    } else
    if(actionRightButton) {
      if(isGoldenCardChoice) {
        const button = refButtonGoldenCardChoiceThrow

        button.current?.classList.add("active")
        waitFor(buttonWaitMS).then(() => {
          showNextItem(true, "throw")
          button.current?.classList.remove("active")
        })
      } 
      else {
        const button = refButtonSuccess

        button.current?.classList.add("active")
        waitFor(buttonWaitMS).then(() => {
          onSuccess()
          button.current?.classList.remove("active")
        })
      }
    }

    if(shouldFlip) {
      e.preventDefault()
      flipCard()
    }

    if(e.code === "Backquote") {
      if(isTrainingDone) {
        trainingResume()
      }
      else {
        trainingStop()
      }
    }
  }

  const createButtons = () => {
    const style: Partial<React.CSSProperties> = isTrainingDone ? {opacity: 0.5, pointerEvents: "none"} : {opacity: 1.0, pointerEvents: "all"}
    const preventDefaultButtonBehavior = (e: KeyboardEvent) => {
      e.preventDefault()
    }
    return <div className="window--train--buttons" style={style}>
      {!isGoldenCardChoice &&
      <button 
      tabIndex={-1} 
      className="window--train--button--fail warning" 
      title="[Delete or Backspace]" 
      onKeyDown={preventDefaultButtonBehavior} 
      onClick={onFailure} 
      ref={refButtonFail}
      >
        <div className="icon cross"></div>
        <div>Fail</div>
      </button>
      }
      {
        isGoldenCardChoice &&
        <div className="window--train--buttons--golden-card-choice">
          <button className="window--train--button--golden-card-choice" onClick={() => showNextItem(true, "return")}  ref={refButtonGoldenCardChoiceReturn} title="[Delete or Backspace]" >
            Return
          </button>
          <button className="window--train--button--golden-card-choice" onClick={() => showNextItem(true, "throw")}   ref={refButtonGoldenCardChoiceThrow} title="[Enter]" >
            Throw
          </button>
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

  window.onbeforeunload = () => {
    if(isTrainingDone) return //we do not store a finished session, no point, hopefully

    const stateData = createLSSchema()

    localStorage.setItem(TrainingDataLSKey, JSON.stringify({...stateData}, undefined, 2))
  }

  const sessionRestore = () => {
    const raw = localStorage.getItem(TrainingDataLSKey)
    if(!raw) return
    
    const obj: LSSchema = JSON.parse(raw)

    setCurrentSide(obj.currentSide)
    setCurrentItem(obj.currentItem)
    setItems(obj.items)
    setCurrentTeam(obj.currentTeam)
    setCurrentTeamIndex(obj.currentTeamIndex)
    setItemIndexForTeam(obj.itemIndexForTeam)
    setDrinkPopupTitle(obj.drinkPopupTitle)
    setDrinkPopupDescription(obj.drinkPopupDescription)
    setCurrentRound(obj.currentRound)
    setIsAnimating(obj.isAnimating)
    setIsTrainingDone(obj.isTrainingDone)
    setIsGoldenCardChoice(obj.isGoldenCardChoice)
    setTeams(obj.teams)

    console.log("State data from localStorage successfully loaded: ")
    console.log(obj)

    localStorage.removeItem(TrainingDataLSKey)
    setIsRestoreSessionDialog(false)
  }

  const sessionAbandon = () => {
    localStorage.removeItem(TrainingDataLSKey)
    setIsRestoreSessionDialog(false)
  }


  if(localStorage.getItem(TrainingDataLSKey) && isRestoreSessionDialog === false) {
    const raw = localStorage.getItem(TrainingDataLSKey)
    if(raw) {
      const obj: LSSchema = JSON.parse(raw);
      if(validateLSSchema(obj)) {
        console.info("Data from localStorage appears to be healthy.")
        setIsRestoreSessionDialog(true)
      } else {
        const suffix = "_InvalidData"
        console.info(`Data from localStorage has a mistake. View it at: localStorage['${TrainingDataLSKey + suffix}']`)
        setIsRestoreSessionDialog(false)
        localStorage.removeItem(TrainingDataLSKey)
        localStorage.setItem(TrainingDataLSKey + suffix, raw)
      }
    }
  }
  

  return <div id="window--train" className={classWindow} style={{pointerEvents: isAnimating ? "none" : undefined}} tabIndex={0} onKeyDown={handleKeyDown}>
    {
    dataError &&
    <div>There was error loading data.</div>
    }
    {
    dataLoading &&
    <div>Loading data...</div>
    }

    {
    isRestoreSessionDialog &&
    <div className="window--train--dialog--restore-session">
      <div className="window--train--dialog--restore-session--title">
        Found previous session that hadn't been finished.
      </div>
      <button onClick={sessionRestore} className="window--train--button--restore-session" tabIndex={0}>Restore session</button>
      <button onClick={sessionAbandon} className="window--train--button--restore-session" tabIndex={0}>Abandon session</button>
    </div>
    }
    {
    !isRestoreSessionDialog &&
    <>
      {
      isBrainrot &&
      !isTrainingDone &&
      createTeam()
      }
      {
      !isTrainingDone ? 
      createCard() :
      createTrainingDoneMessage()
      }
      {
      !isTrainingDone &&
      createButtons()
      }

      {/* Popups */}
      {createDrinkPopup()}
      {createCardReturn()}
      {createTeamGetPoints()}
    </>
    }
  </div>
}

  
//this could maybe be used in an easier mode, where people don't fail so often
// const failedLastXTimesThisTurn = (team: Team, x: number) => {
//   const index_end = team.score.length
//   const index_start = clamp(index_end, 0, Infinity) - clamp(x, 0, Infinity)
//   const fails = sum(...team.score.slice(index_start, index_end).map(attempt => attempt.success ? 0 : 1)) 
//   // console.log(`Team at index: ${currentTeamIndex} score: \n`, team.score.map(att => att.success))
//   return fails === x && fails === clamp(x, 0, itemIndexForTeam + 1) 
// }