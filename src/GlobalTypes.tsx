import Window_Train from      './Window_Train';
import Window_Edit from       './Window_Edit';
import Window_Main from       './Window_Main';
import Window_TrainSetup from './Window_TrainSetup';

//@todo I think there was a little quirk with this somewhere, that the ItemRef[] were actually Item[] but I don't think it matters
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

//@todo add optional fields such as date, century, technique, whatever may exist on an art knowledge-based app
export type Item = {
  id:               number;

  title:            string;

  description:      string;

  images:           ImageType[];

  datasets:         DatasetRef[];

  /** Used in Training. Index of the current bucket the item is in. Items travel in buckets upwards until they reach the last one, after which they are excluded from the training data. */
  bucket:           number;
  
  /** Used in Training>Brainrot. Only used for golden cards. This is their value, how many times the team drinks if they fail it and how many points a team gets for throwing it out.  */
  value:            number;
}

export type ItemAttempt = {
  success: boolean
}

export type ImageType = {
  id:     number
  url:    string;
  items:  Item[];
  title:  string;
}

export type ImageBlob =        File & { previewURL: string }

export type ImageFromServer =  ImageType & { willDelete: boolean }

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
  flags:    AppStateFlags
};

export type AppStateFlags = {
  showNav: boolean
}

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

export type AppActionName = "WINDOW_SET" | "WINDOW_CLOSE" | "APPLY_FLAGS"

export interface AppActionPayload {
  window?:           AppWindow | undefined
  datasets?:        Dataset[]
  trainingSetup?:   TrainingSetup
  trainingMode?:    TrainingMode
  teams?:           Team[]
  flags?:           AppStateFlags
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
  title:          string
  score:          ItemAttempt[]
  failedThisTurn: boolean
}

export const TrainingDataLSKey = "trainingData"