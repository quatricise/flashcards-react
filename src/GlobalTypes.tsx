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
  images:           ImageType[];
  datasets:         DatasetRef[];

  /** Used only in training. Ephemeral, is not kept between sessions. Tracks how well the trainee is doing. Percentage of successful card draws (0-100%).  */
  success:   number;

  /** Used only in training. Ephemeral, is not kept between sessions. Tracks how well the trainee is doing. Total attempts this session.  */
  attempts:  number;
}

export type ImageType = {
  id:     number
  url:    string;
  items:  Item[];
  title:  string;
}

/* 
export type ImageTypeFlags = {
  willDelete: boolean
} */

export type ImageBlob =        File & { previewURL: string }

export type ImageFromServer =  ImageType & { willDelete: boolean }

/** Refers to properties on type Item */
export type TrainingData = "title" | "description" | "images"

export type TrainingSetup = {
  A: TrainingData[]
  B: TrainingData[]
};

export type AppWindow =
  | typeof Window_Train
  | typeof Window_Edit
  | typeof Window_DatasetSelect
  | typeof Window_Main
  | typeof Window_TrainSetup;

export type AppState = {
  window:   AppWindow,
  windows:  AppWindows,
  history:  AppWindowHistory,
};

export type AppWindows = {
  Main:          typeof Window_Main,
  DatasetSelect: typeof Window_DatasetSelect,
  Edit:          typeof Window_Edit,
  Train:         typeof Window_Train,
  TrainSetup:    typeof Window_TrainSetup,
}

export type AppWindowHistory = AppWindow[]

export const WindowKeys_To_Names: Record<keyof AppWindows, string> = {
  Main:          "Home",
  DatasetSelect: "Select datasets",
  Edit:          "Edit",
  Train:         "Train",
  TrainSetup:    "Setup training",
}

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

