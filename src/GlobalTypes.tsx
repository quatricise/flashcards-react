import Window_Train from './Window_Train';
import Window_Edit from './Window_Edit';
import Window_DatasetSelect from './Window_DatasetSelect';
import Window_Main from './Window_Main';
import Window_TrainSetup from './Window_TrainSetup';

export type Dataset = {
  id:           number;
  title:        string;
  items:        ItemRef[];
}

export type DatasetRef = {
  id: number
}

export type ItemRef = {
  id: number
}

export type Item = {
  id:               number;
  title:            string;
  description:      string;
  images:           number[];
  datasets:         DatasetRef[];

  /** Used only in training. Ephemeral, is not kept between sessions. Tracks how well the trainee is doing. Percentage of successful card draws (0-100%).  */
  success:   number;

  /** Used only in training. Ephemeral, is not kept between sessions. Tracks how well the trainee is doing. Total attempts this session.  */
  attempts:  number;
}

export type ImageType = {
  url:    string;
  items:  Item[];
  title:  string;
}

/** Refers to properties on type Item */
export type TrainingData = "title" | "description" | "images"

export type TrainingSetup = {
  A: TrainingData[]
  B: TrainingData[]
}

export type AppWindow =
  | typeof Window_Train
  | typeof Window_Edit
  | typeof Window_DatasetSelect
  | typeof Window_Main
  | typeof Window_TrainSetup;

export type AppActionName = "WINDOW_SET" | "WINDOW_CLOSE" | "EDIT_DATA"

export interface AppActionPayload {
  window:     AppWindow | undefined
  datasets?:   number[]
}

export interface AppAction {
  name:     AppActionName
  payload:  AppActionPayload
}

export type ImageUploadResult = {
  url: string,
  thumbnailUrl: string,
}

