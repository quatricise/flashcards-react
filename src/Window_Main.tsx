import "./Window_Main.css"
import { useAppDispatch, useAppState } from "./GlobalContext"

export default function Window_Main() {

  const dispatch = useAppDispatch()
  const state = useAppState()

  const handleClick = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Edit}}) //can't work until I figure out how to globally ref windows
  }

  return <div id="window--main" className="window">
    <h1>Flashcards</h1>
    <div className="buttons">
      <button onClick={handleClick}>Open the torture box</button>
    </div>
  </div>
}