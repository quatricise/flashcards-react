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
      // This runs **when the component unmounts**
      // images?.forEach(img => URL.revokeObjectURL(img.previewURL)) 
      // //actually this caused a bug ↑
    };
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop, //not sure what the rror here is
  });

  const removeImage = (index: number) => {
    const newImages = images?.filter((_img, i) => i !== index)
    if(newImages) onImagesChange(newImages)
    
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
              images?.map((file, index) => (
                <ItemImage flags={{editable: true}} url={file.previewURL} key={index} itemId={itemId} onDelete={() => removeImage(index)} ></ItemImage>
              ))
            }
          </div>
          </>
}