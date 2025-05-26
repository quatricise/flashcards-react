import { gql } from 'apollo-server-express'

export const typeDefs = gql`
  type Item {
    id:           Int!
    title:        String!
    description:  String!
    datasets:     [Dataset!]!
    images:       [Image!]!
  }

  type Dataset {
    id:     Int!
    title:  String!
    items:  [Item!]!
  }

  type Image {
    id:     Int!
    url:    String!
    title:  String
    items:  [Item!]!
  }

  type Query {
    items:    [Item!]!
    datasets: [Dataset!]!
    images:   [Image!]!
    datasetsByIds(ids: [Int!]!): [Dataset!]!
  }

  type Mutation {
    createItem(title: String!, description: String!, datasets: [Int!]!): Item!
    createDataset(title: String!, items: [Int!]): Dataset!
    createImage(url: String!, title: String!, items: [Int!]!): Image!

    deleteItem(id: Int!): Int!
    deleteDatasets(ids: [Int!]!): [Int!]!
    deleteImages(ids: [Int!]!): [Int!]!

    updateItem(id: Int!, title: String!, description: String!, datasets: [Int!]!): Item!
    renameDataset(id: Int!, title: String!): Dataset!
  }
`
