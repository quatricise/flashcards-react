import { useState } from "react"
import "./ItemImage.css"
import type { ImageBlob, ImageFromServer, ImageType } from "./GlobalTypes"

type Props = {
  image:  ImageType | ImageBlob | ImageFromServer
  url:    string
  flags:  ItemImageFlags,
  onDelete?: () => void
}

interface ItemImageFlags {
  editable:   boolean
  fromServer: boolean
  willDelete: boolean
}

export default function ItemImage({ image, url, flags, onDelete }: Props) {

  const [isMouseOver, setIsMouseOver] = useState<boolean>(false)

  let iconDeleteTitle = "Remove image"
  if(flags.fromServer) iconDeleteTitle = "Flag image for removal. It'll only apply once you update the whole item."

  let className = "item-image"
  if(flags.willDelete) className += " will-delete"
  if(flags.editable)   className += " editable"

  const handleClick = () => {
    onDelete?.()
    console.log("ItemImage: onDelete() \n")
  }

  const iconDelete =      <div className="item-image--icon-delete" title={iconDeleteTitle} onClick={handleClick} tabIndex={0}>🞤</div>
  const iconDatabaseYes = <div className="icon database-yes" title="✔️ Already uploaded"></div>
  return (
        <div className={className} onMouseEnter={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)}>
          <img className="item-image--img" src={url} draggable={false}/>
          <div className="item-image--icons">
            {
              flags.editable && flags.fromServer && !isMouseOver && 
              iconDatabaseYes
            }
            {
              flags.editable && isMouseOver &&
              iconDelete
            }
          </div>
        </div>
        )
}