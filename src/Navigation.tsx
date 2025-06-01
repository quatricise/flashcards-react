import { useAppDispatch, useAppState } from "./GlobalContext"
import { ThemeToggle } from "./ThemeToggle"
import { useRef, useState, type KeyboardEvent } from "react"
import "./Navigation.css"
import "./BrainrotPresentation.css"
import { clamp } from "./GlobalFunctions"

export default function Navigation() {

  const dispatch =  useAppDispatch()
  const state =     useAppState()

  const handleClickHome = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Main}})
  }

  const handleClickEdit = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Edit}})
  }
  
  const handleClickTrain = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.TrainSetup}})
  }
  
  //now how about highlighting the current tag, just 3 if statements?
  //or generate the buttons like this

  const handlers = [handleClickHome, handleClickEdit, handleClickTrain]
  const createButton = () => {

  }

  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isPresenting, setIsPresenting] = useState<boolean>(false)

  const presentationBegin = () => {
    setIsPresenting(true)
    setCurrentSlide(0)
    refPresentation.current?.focus()
  }

  const presentationEnd = () => {
    setIsPresenting(false)
  }

  const slidesTotal = 9

  const handleKeyDown = (e: KeyboardEvent) => {
    if(isPresenting) {
      if(e.code === "ArrowLeft") {
        slidePrev()
      }
      if(e.code === "ArrowRight") {
        slideNext()
      }
      if(e.code === "Escape") {
        presentationEnd()
      }
    }
  }

  const slidePrev = () => {
    setCurrentSlide((prev) => clamp(prev - 1, 0, slidesTotal - 1))
  }

  const slideNext = () => {
    if(currentSlide === slidesTotal - 1) {
      presentationEnd()
    }
    setCurrentSlide((prev) => clamp(prev + 1, 0, slidesTotal - 1))
  }

  const refPresentation = useRef<HTMLDivElement>(null)

  return <>
    <div id="navigation">
      <div 
      className="navigation--tab-button"
      tabIndex={0}
      onClick={handleClickHome}>
        <div className="navigation--tab-button--icon icon home"></div>
        <div className="navigation--tab-button--title">Home</div>
      </div>
      <div 
      className="navigation--tab-button" 
      tabIndex={0}
      onClick={handleClickEdit}>
        <div className="navigation--tab-button--icon icon edit"></div>
        <div className="navigation--tab-button--title">Edit</div>
      </div>
      <div 
      className="navigation--tab-button" 
      tabIndex={0}
      onClick={handleClickTrain}>
        <div className="navigation--tab-button--icon icon train"></div>
        <div className="navigation--tab-button--title">Train</div>
      </div>
      <ThemeToggle/>
      <div className="button--navigation--present" title="Presentation: Brainrot challenge">
        <div className="icon present" onClick={presentationBegin}></div>
        {
        isPresenting &&
         <div className="brainrot-presentation" tabIndex={0} onKeyDown={handleKeyDown} ref={refPresentation}>
            <img src={`./images/brainrot_presentation/${currentSlide + 1}.png`} alt="" className="presentation-slide" />
            <div className="brainrot-presentation--controls">
              <div className="icon arrow back" onClick={slidePrev}></div>
              <div className="brainrot-presentation--current-slide">{currentSlide + 1}</div>
              <div className="icon arrow" onClick={slideNext}></div>
            </div>
        </div>
        }
      </div>
      <div className="button--navigation--info">
        <div className="icon info"></div>
        <div className="navigation--about">
          <div className="navigation--about--contents">
            <h2 className="navigation--about--title">
              <div className="navigation--about--title--text">
                Flashcards App
              </div>
            </h2>
            <div className="navigation--about--description">
              <div className="text--secondary">Frontend:</div>
              TypeScript, React, Framer Motion
              <br /><br />
              <div className="text--secondary">Database:</div>
              Apollo, GraphQL, Prisma, PostgreSQL
              <br /> <br />
              <div className="text--secondary">Packing:</div>
              Vite
              <br /><br />
              <span className="text--secondary">Author:</span> Štěpán Trvaj
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="navigation--presentation">
      {/* this stands separate and is fullscreen and has arrows and a count at the bottom. Visually shows how the Brainrot challenge works. */}
    </div>
  </>
}

/* (Object.keys(state.windows) as (keyof AppWindows)[]).map(key => {
    return <div>
      {key}
    </div>
  }) */