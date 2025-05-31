import "./ImageDropZone.css";
import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from 'react';
import type { ItemImage, ImageFromServer, ImageBlob } from "./GlobalTypes";
import ItemImage from "./ItemImage";

type Props = {
  itemId:                     number | null,
  onImagesChange:             (files: File[]) => void
  onImagesFromServerChange:   (images: ImageFromServer[]) => void
  imagesFromServerInput:      ItemImage[] | undefined
}

//@todo there is some weird setState rendering trouble again in this component
export default function ImageDropZone({ itemId, onImagesChange, onImagesFromServerChange, imagesFromServerInput }: Props) {
  
  const [images, setImages] = useState<ImageBlob[]>([]);
  const [imagesFromServer, setImagesFromServer] = useState<ImageFromServer[]>([])

  useEffect(() => {
    setImagesFromServer(() => {
      if (!imagesFromServerInput) return []

      return imagesFromServerInput.map(i => {return {...i, willDelete: false}})
    })
  }, [imagesFromServerInput])

  //it should keep the state for imagesFromServer locally 
  //the images which will be removed from the server later, I need to first load them here and then this component takes over and makes modifications

  const onDrop = useCallback((acceptedFiles: ImageBlob[]) => {
    const newFiles = acceptedFiles.map(file => {
      file.previewURL = URL.createObjectURL(file)
      return file
    })
    setImages((prev) => {
      return prev.concat(...newFiles)
    });
    onImagesChange(newFiles)
  }, [onImagesChange]);
  
  // useEffect(() => {
  //   return () => {
  //     //@todo I believe I need to revokeObjectURL when this component resets state, otherwise there may be memory leaks
  //   };
  // }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop, //this does not accept ImageBlob[], only File[], but it works in practice
  });

  const removeImageBlob = (index: number) => {
    const removedImage = images[index]
    const newImages = images.filter((_img, i) => i !== index)
    
    URL.revokeObjectURL(removedImage.previewURL)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const removeImageFromServer = (id: number) => {
    //no, actually toggle the delete state for the item, diff the two arrays 'imagesFromServerInput' and 'imagesFromServer'
    //and then fade the images which will be deleted. The delete icon will actually cause a toggle here, not immediate delete.

    const newImages = imagesFromServer.map(i => {
      if(i.id === id) {
        return {...i, willDelete: !i.willDelete}
      }
      return i
    })
    console.log(`ImageDropZone: Flagged imageFromServer with id: '${id}' for removal`)
    onImagesFromServerChange(newImages)
    setImagesFromServer(newImages)
  }

  const [isMouseOver, setIsMouseOver] = useState(false)

  let className = "image-drop-zone text--secondary" 
  if(isDragActive) className += " active"

  let message = "Drop images here"
  if(isMouseOver)   message = "...or click to choose files"
  if(isDragActive)  message = "Release to drop files"

  return  <>
          <div className={className} {...getRootProps()} onMouseEnter={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)}>
            <input {...getInputProps()}/>
            {message}
          </div>
          <div className="image-drop-zone--images">
            {
              imagesFromServer.length !== 0 &&
              <div style={{width: "100%"}} >Existing images: </div>
            }
            {
              /*
                here the handling must be very different, these images are to be deleted locally, but not from the server until you hit 'Update item'
                so this means that images and imagesFromServer should be merged for the purposes of editing an item.
                the output of this imagedropzone will then be 'imagesToUpload' and 'imagesToDelete'
                images which were fetched and not deleted remain untouched, their data simply is not sent at all.
              */

              itemId !== null &&
              imagesFromServer?.map((image, index) => (
                <ItemImage 
                key={index} 
                flags={{ editable: true, fromServer: true, willDelete: image.willDelete }} 
                image={image} 
                url={image.url} 
                onDelete={() => removeImageFromServer(image.id)}/>
              ))
            }
            {
              imagesFromServer.length !== 0 && images.length !== 0 &&
              <div style={{width: "100%"}} >For upload: </div>
            }
            {
              itemId !== null &&
              images?.map((image, index) => (
                <ItemImage 
                key={index} 
                flags={{ editable: true, fromServer: false, willDelete: false }} 
                image={image} 
                url={image.previewURL} 
                onDelete={() => removeImageBlob(index)}/>
              ))
            }
          </div>
          </>
}