import "./Window_Main.css"
import { ThemeToggle } from "./ThemeToggle"
import { useAppDispatch, useAppState } from "./GlobalContext"

function Window_Main() {

  const dispatch = useAppDispatch()
  const state = useAppState()

  const setWindowDatasetSelect = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.DatasetSelect}}) //can't work until I figure out how to globally ref windows
  }

  return <div id="window-main" className="window">
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