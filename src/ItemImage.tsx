import "./ItemImage.css"

type Props = {
  itemId: number,
  url:    string,
  flags:  ItemImageFlags,
  onDelete: () => void | undefined
}

interface ItemImageFlags {
  editable: boolean
}

export default function ItemImage({ itemId, url, flags, onDelete }: Props) {

  //state editable<false | true>, this will be flagged so that this component can possibly be used in both training and editing.
  const iconDelete = <div className="item-image--icon-delete" onClick={() => onDelete?.()}>🞤</div>

  return (
        <div className="item-image">
          <img className="item-image--img" src={url}/>
          {flags.editable ? iconDelete : null}
        </div>
        )
}