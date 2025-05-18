import "./ItemCard.css"
import { useState, useRef } from "react"
import type { KeyboardEvent } from "react"
import { gql } from "@apollo/client"

type Props = {
  id: number
  title: string
  description: string
}

const DELETE_ITEM = gql`
  
`


export default function ItemCard({ id, title, description }: Props) {

  const [isActive, setIsActive] = useState(false)
  const [isTryToDelete, setIsTryToDelete] = useState(false)

  const deleteTry = () => {
    if(isTryToDelete) {
      deleteFrFr()
    } else {
      setIsTryToDelete(true)
    }
  }

  const deleteFrFr = () => {
    
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if(!isTryToDelete) return

    if(e.code === "Enter" || e.code === "NumpadEnter") {
      deleteFrFr()
    } else
    if(e.code === "Escape" || e.code === "Backspace") {
      setIsTryToDelete(false)
    }
  }

  let className = "item-card"
  if(isActive) className += " active"

  const contentsNormal = <>
    <div className="item-card--title">{title}</div>
    <div className="item-card--description">{description}</div>
  </>

  const contentsWarning = <div className="item-card--title">Really delete?</div>

  const inputTrap = useRef<HTMLInputElement>(null)
  if(isTryToDelete) inputTrap.current?.focus() //@todo this is disgraceful, I need to do this topdown and trap the input differently.

  return  <>
            <div className={className} onClick={() => setIsActive(isActive ? false : true)} onKeyDown={handleKeyDown}>
              <input ref={inputTrap} type="text" name="" id="" style={{filter: "opacity(0)", position: "absolute"}}/>
              {isTryToDelete ? contentsWarning : contentsNormal}
              <img src="./images/ui/icon_trash.png" alt="" className="item-card--icon-delete" onClick={deleteTry} />
            </div>
          </>
}