import Window_Train from      './Window_Train';
import Window_Edit from       './Window_Edit';
import Window_Main from       './Window_Main';
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

/*@todo add optional fields such as date, century, technique, whatever may exist on an art knowledge-based app */
export type Item = {
  id:               number;
  title:            string;
  description:      string;
  images:           ItemImage[];
  datasets:         DatasetRef[];
  bucket:           number; //used in training only
}

export type ItemAttempt = {
  success: boolean
}

export type ItemImage = {
  id:     number
  url:    string;
  items:  Item[];
  title:  string;
}

export type ImageBlob =        File & { previewURL: string }

export type ImageFromServer =  ItemImage & { willDelete: boolean }

/** Refers to properties on type Item */
export type TrainingData = "title" | "description" | "images"

export type TrainingSetup = {
  A: TrainingData[]
  B: TrainingData[]
};

export type TrainingMode = "regular" | "brainrot"

export type AppWindow =
  | typeof Window_Train
  | typeof Window_Edit
  | typeof Window_Main
  | typeof Window_TrainSetup;

export type AppState = {
  window:   AppWindow,
  windows:  AppWindows,
  history:  AppWindowHistory,
  training: StateTrainingData
};

export type AppWindows = {
  Main:          typeof Window_Main,
  Edit:          typeof Window_Edit,
  Train:         typeof Window_Train,
  TrainSetup:    typeof Window_TrainSetup,
}

export type AppWindowHistory = AppWindow[]

export const WindowKeys_To_Names: Record<keyof AppWindows, string> = {
  Main:          "Home",
  Edit:          "Edit",
  Train:         "Train",
  TrainSetup:    "Setup training",
}

export type AppActionName = "WINDOW_SET" | "WINDOW_CLOSE" | "EDIT_DATA"

export interface AppActionPayload {
  window:         AppWindow | undefined
  datasets?:      Dataset[]
  trainingSetup:  TrainingSetup
  trainingMode:   TrainingMode
  teams:          Team[]
}

export interface AppAction {
  name:     AppActionName
  payload:  AppActionPayload
}

export type ImageUploadResult = {
  url: string,
  thumbnailUrl: string,
}

export type StateTrainingData = {
  datasets:   Dataset[],
  setup:      TrainingSetup
  mode:       TrainingMode
  teams:      Team[]
}

export type Window_Train_Props = {
  datasetIds:     number[],
  trainingSetup:  TrainingSetup
  trainingMode:   TrainingMode
  teams:          Team[]
};

export type Team = {
  title:    string
  score:    ItemAttempt[]
}