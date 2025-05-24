import "./ImageDropZone.css";
import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from 'react';
import ItemImage from "./ItemImage";

type ImagePreview = File & { previewURL: string}

type Props = {
  itemId: number | null,
  onImagesChange: (files: File[]) => void
}

export default function ImageDropZone({ itemId, onImagesChange }: Props) {
  
  const [images, setImages] = useState<ImagePreview[]>();

  const onDrop = useCallback((acceptedFiles: ImagePreview[]) => {
    setImages(acceptedFiles.map(file => {
      file.previewURL = URL.createObjectURL(file)
      return file
    }));
    onImagesChange(acceptedFiles)
  }, [onImagesChange]);

  useEffect(() => {
    return () => {
      //@todo I actually need this to work in the future to avoid hogging up much memory if users upload shit tons of images
      // images?.forEach(img => URL.revokeObjectURL(img.previewURL)) 
      // //actually this caused a bug ↑ but it should ideally run when the component is dismounted??
    };
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop, //not sure what the error here is
  });

  const removeImage = (index: number) => {
    const newImages = images?.filter((_img, i) => i !== index)
    if(newImages) onImagesChange(newImages)

    //maybe here I revoke the url for the image blobs and this has to be called even when resetting state ?? perhaps I'd need something here that's called when the component resets state
    
    setImages(newImages)
  }

  const [isMouseOver, setIsMouseOver] = useState(false)

  let className = "image-drop-zone text--secondary" 
  if(isDragActive) className += " active"

  let message = "Drop images here"
  if(isMouseOver) message = "...or click to choose files"
  if(isDragActive) message = "Release to drop files"

  return  <>
          <div className={className} {...getRootProps()} onMouseEnter={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)}>
            <input {...getInputProps()} />
            {message}
          </div>
          <div className="image-drop-zone--images">
            {
              itemId !== null &&
              images?.map((file, index) => (
                <ItemImage flags={{editable: true}} url={file.previewURL} key={index} itemId={itemId} onDelete={() => removeImage(index)} ></ItemImage>
              ))
            }
          </div>
          </>
}