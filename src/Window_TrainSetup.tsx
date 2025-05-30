import { useAppDispatch, useAppState } from "./GlobalContext"
import DatasetButton from './DatasetButton';
import "./Window_TrainSetup.css"
import { gql, useQuery } from "@apollo/client";
import type { Dataset, TrainingSetup, TrainingData } from "./GlobalTypes";
import { useEffect, useState } from "react";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"


const GET_DATASETS = gql`
  query {
    datasets {
      id
      title
      items {
        id
      }
    }
  }
`

type GET_DATASETS_RETURN = {
  datasets: Dataset[]
}



export default function Window_TrainSetup() {

  const { data, loading, error } = useQuery<GET_DATASETS_RETURN>(GET_DATASETS)
  
  const dispatch =  useAppDispatch()
  const state =     useAppState()

  const [datasetsSelected, setDatasetsSelected] = useState<Dataset[]>([])

  const startTraining = () => {
    dispatch({name: "WINDOW_SET", payload: {window: state.windows.Train, datasets: datasetsSelected}})
  }

  const handleToggleDataset = (dataset: Dataset) => {
    if(datasetsSelected.find(d => d.id === dataset.id)) {
      setDatasetsSelected(prev => prev.filter(d => d.id !== dataset.id))
    } else {
      setDatasetsSelected(prev => prev.concat([dataset]))
    }
  }


  type TrainingDataFieldProps = {
    id: TrainingData
  }
  

  //it's a shame that this now prevents me from having the same field repeated, perhaps id should be something else, the whole structure is terrible btw
  function TrainingDataField({ id }: TrainingDataFieldProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="window--train-setup--training-data--field" title={fieldLabel}>
        {id}
      </div>
    );
  }

  const [containerA, setContainerA] = useState<TrainingData[]>(["title", "images"]);
  const [containerB, setContainerB] = useState<TrainingData[]>(["description",]);

  const [isOverOtherSide, setIsOverOtherSide] = useState<boolean>(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if(!over) return

    console.log(active)

    const activeId = active.id as TrainingData
    const overId =   over.id as TrainingData

    const isInA = containerA.includes(activeId);

    const [source, destination] = isInA ? [containerA, containerB] : [containerB, containerA]
    const [setSource, setDestination] = isInA ? [setContainerA, setContainerB] : [setContainerB, setContainerA]

    if (activeId !== overId) { //this is kinda shit, no?
      if (source !== destination) {
        setSource((prev) => prev.filter((item) => item !== activeId));
        setDestination((prev) => [activeId, ...prev]);
      } else {
        const oldIndex = source.indexOf(activeId);
        const newIndex = source.indexOf(overId);
        setSource((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e

    console.log(active, over)
  }



  const [trainingSetup, setTrainingSetup] = useState<TrainingSetup>({A:[...containerA], B:[...containerB]});

  const fieldLabel = "Click and drag this to the other side of the card to compose the desired training method."

  return <div className="window" id="window--train-setup">
    <div className="window--train-setup--contents">
      <h1 className="window--train-setup--contents--title" >Training setup</h1>
      <div className="window--train-setup--dataset-select">
        <div className="window--train-setup--dataset-select--title" >Datasets:</div>
        {
        loading && 
        "Loading datasets..."
        }
        {
        error && 
        "Error loading datasets: Check the console for more info, if there is any 😈."
        }
        <div className="window--train-setup--dataset-select--datasets">
          {
            data?.datasets !== undefined &&
            data.datasets.map(dataset => {
              const active = datasetsSelected.find(d => d.id === dataset.id) !== undefined
              return <DatasetButton key={dataset.id} dataset={dataset} onToggle={handleToggleDataset} flags={{active}} ></DatasetButton>
            })
          }
        </div>
      </div>
      <div className="window--train-setup--training-method">
        <div style={{userSelect: "none"}} >Training method</div>
        <div className="filler"></div>
        <div className="window--train-setup--training-method--randomize" >
          <label htmlFor="randomize">Randomize each card</label>
          <input type="checkbox" name="randomize" id=""/>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="window--train-setup--training-method-sides">

          <SortableContext items={containerA} strategy={rectSortingStrategy}>
            <div className="window--train-setup--side a">
              <div className="window--train-setup--side--label">Front</div>
              {containerA.map((field) => {
                return <TrainingDataField key={field} id={field}></TrainingDataField>
              })}
          </div>
          </SortableContext>

          <SortableContext items={containerB} strategy={rectSortingStrategy}> {/* this side is broken for some reason */}
            <div className="window--train-setup--side b">
              <div className="window--train-setup--side--label">Back</div>
              {containerB.map((field) => {
                return <TrainingDataField key={field} id={field}></TrainingDataField>
              })}
          </div>
          </SortableContext>

        </div>
      </DndContext>

      <button className="window--train-setup--button--begin" onClick={startTraining}>Begin</button>
    </div>
  </div>
}