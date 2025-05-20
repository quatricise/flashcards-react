export type Dataset = {
  id:           number;
  title:        string;
  items:        Item[];
}

export type DatasetRef = {
  id: number
}

export type Item = {
  id:           number;
  title:        string;
  description:  string;
  images:       number[];
  datasets:     DatasetRef[];
}

export type ImageType = {
  url:    string;
  items:  Item[];
  title:  string;
}