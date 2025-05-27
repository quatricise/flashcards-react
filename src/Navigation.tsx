import { useAppDispatch, useAppState } from "./GlobalContext"
import "./Navigation.css"
import type { AppWindow } from './GlobalTypes';

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
    </div>
  </>
}

/* (Object.keys(state.windows) as (keyof AppWindows)[]).map(key => {
    return <div>
      {key}
    </div>
  }) */