import "./Window_Main.css"
import { ThemeToggle } from "./ThemeToggle"

function Window_Main() {

  return <div id="window-main" className="window">
    <h1>Flashcards</h1>
    <div className="buttons">
      <button>Open the torture box</button>
      {ThemeToggle()}
    </div>
  </div>
}

export default Window_Main