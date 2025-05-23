import "./ItemCard.css"
import { useState, useRef } from "react"
import type { KeyboardEvent, MouseEvent } from "react"
import { gql, useMutation } from "@apollo/client"
import type { Item } from "./GlobalTypes"

type Props = {
  item:       Item
  flags:      ItemCardFlags
  onDeleted:  () => unknown
  onSelect:   (itemId: number) => void
}

const DELETE_ITEM = gql`
  mutation DeleteItem($id: Int!) {
    deleteItem(id: $id)
  }
`

type DELETE_ITEM_RETURN = {
  deleteItem: number
}

interface ItemCardFlags {
  isActive:     boolean
  isDim:        boolean 
  canBeDeleted: boolean
}

export default function ItemCard({ item, flags, onDeleted, onSelect }: Props) {

  const [isTryToDelete, setIsTryToDelete] = useState(false)

  const buttonDelete = useRef<HTMLImageElement>(null)

  const deleteTry = () => {
    if(isTryToDelete) {
      deleteFrFr()
    } else {
      setIsTryToDelete(true)
    }
  }

  const deleteFrFr = () => {
    deleteItem({variables: {id: item.id}})
  }

  const [deleteItem] = useMutation<DELETE_ITEM_RETURN>(DELETE_ITEM, {
    onCompleted: (data) => {
      onDeleted?.()
      console.log("Successfully deleted item: " + data.deleteItem)
    },
    onError: (error) => {
      console.log(error.message)
    },
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if(!isTryToDelete) return

    if(e.code === "Enter" || e.code === "NumpadEnter") {
      deleteFrFr()
    } else
    if(e.code === "Escape" || e.code === "Backspace") {
      setIsTryToDelete(false)
    }
  }

  const handleClick = (e: MouseEvent) => {

    if(buttonDelete.current && e.target === buttonDelete.current) {
      //
    } else {
      onSelect?.(item.id)
    }
  }

  let className = "item-card"
  if(flags.isActive) className += " active"
  if(flags.isDim)    className += " dim"
  if(isTryToDelete)  className += " warning"

  const contentsNormal = <>
    <div className="item-card--title">{item.title}</div>
    <div className="item-card--description">{item.description}</div>
  </>

  const contentsWarning = <div className="item-card--title">Really delete?</div>

  const inputTrap = useRef<HTMLInputElement>(null)
  if(isTryToDelete) inputTrap.current?.focus() //@todo this is very disgraceful, I need to do this topdown from Window_Edit and trap the input differently. This can break!

  return  <>
            <div className={className} onClick={handleClick} onKeyDown={handleKeyDown}>
              <input ref={inputTrap} type="text" name="" id="" style={{filter: "opacity(0)", position: "absolute", zIndex: -1}}/>
              {isTryToDelete ? contentsWarning : contentsNormal}
              {flags.canBeDeleted && <img src="./images/ui/icon_trash.png" alt="" className="item-card--icon-delete" onClick={deleteTry} ref={buttonDelete} />}
            </div>
          </>
}