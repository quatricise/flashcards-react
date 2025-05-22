import "./Window_Main.css"
import { useRef } from "react"
import { ThemeToggle } from "./ThemeToggle"
import type { AppAction, AppActionPayload, AppWindow } from "./GlobalTypes"
import { useAppDispatch } from "./GlobalContext"

function Window_Main() {

  const dispatch = useAppDispatch()

  const setWindowSelf = () => {
    console.log("hi")
    if(self.current) dispatch({name: "WINDOW_SET", payload: {window: self.current}})
  }

  const setWindowDatasetSelect = () => {
    // dispatch({name: "WINDOW_SET", payload: {window: self.current}}) //can't work until I figure out how to globally ref windows
  }

  const self = useRef(null)

  return <div id="window-main" className="window" onClick={setWindowSelf} ref={self}>
    <h1>Flashcards</h1>
    <div className="buttons">
      <button onClick={setWindowDatasetSelect}>
        Open the torture box
      </button>
      {ThemeToggle()}
    </div>
  </div>
}

export default Window_Main