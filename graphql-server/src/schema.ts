import { gql } from 'apollo-server-express'

export const typeDefs = gql`
  type Item {
    id:           Int!
    title:        String!
    description:  String
    datasets:     [Dataset!]!
    images:       [Image!]
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
  }

  type Mutation {
    createItem(title: String!, description: String!): Item!
    createDataset(title: String!, items: [Int!]): Dataset!
    addImageToItem(url: String!, items: [Int!]!): Image!
  }
`
