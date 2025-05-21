export type Dataset = {
  id:           number;
  title:        string;
  items:        Item[];
}

export type DatasetRef = {
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