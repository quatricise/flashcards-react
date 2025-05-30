import { useAppDispatch, useAppState } from "./GlobalContext"
import { ThemeToggle } from "./ThemeToggle"
import "./Navigation.css"

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
  </>
}

/* (Object.keys(state.windows) as (keyof AppWindows)[]).map(key => {
    return <div>
      {key}
    </div>
  }) */