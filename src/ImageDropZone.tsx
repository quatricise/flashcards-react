import "./ImageDropZone.css";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from 'react';
import ItemImage from "./ItemImage";

type ImagePreview = File & { previewURL: string}

type Props = {
  itemId: number
}

export default function ImageDropZone({ itemId }: Props) {
  const [images, setImages] = useState<ImagePreview[]>();

  const onDrop = useCallback((acceptedFiles: ImagePreview[]) => {
    setImages(acceptedFiles.map(file => {
      file.previewURL = URL.createObjectURL(file)
      return file
    }));
  }, []);

  //@todo URL.revokeObjectURL(url) on the file preview, to release the memory for the blob

  //   useEffect(() => {
  //   return () => {
  //     // This runs **when the component unmounts**
  //     cleanupStuff();
  //   };
  // }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop,
  });

  const removeImage = (index: number) => {
    setImages(images?.filter((_img, i) => i !== index))
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
            {images?.map((file, index) => (
              // <img
              //   key={index}
              //   src={file.previewURL}
              //   alt="preview"
              //   width={100}
              //   style={{ margin: '5px' }}
              // />
              <ItemImage flags={{editable: true}} url={file.previewURL} key={index} itemId={itemId} onDelete={() => removeImage(index)} ></ItemImage>
            ))}
          </div>
          </>
}