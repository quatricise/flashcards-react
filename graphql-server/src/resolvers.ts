import { PrismaClient } from '@prisma/client'

// Define resolver context type
interface Context {
  prisma: PrismaClient
}

// Args types for your mutations
interface CreateItemArgs {
  title:        string
  description:  string
}


interface CreateImageArgs {
  url:      string
  title:    string
  items:  number[] /* this array might actually contain a singular image for a long time, I'm not sure how uploads will work. */
}


/* dataset is created wrong, it should be possile to create it empty, and later add items into it. Items by default must belong to a dataset */
interface CreateDatasetArgs {
  title:    string
}

export const resolvers = {
  Query: {
    datasets: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.dataset.findMany({
        include: { items: true },
      })
    },
    items: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.item.findMany({
        include: { datasets: true },
      })
    },
  },

  Mutation: {
    createItem: async (
      _parent: unknown,
      args: CreateItemArgs,
      context: Context
    ) => {
      return await context.prisma.item.create({
        data: {
          title: args.title,
          description: args.description,
        },
        include: { datasets: true }
      })
    },

    createDataset: async (
      _parent: unknown,
      args: CreateDatasetArgs,
      context: Context
    ) => {
      try {
        return await context.prisma.dataset.create({
        data: {
          title: args.title
          },
        })
      }
      catch(error) {
        console.error(error)
      }
    },
    
    addImageToItem: async (
      _parent: unknown,
      args: CreateImageArgs, 
      context: Context
    ) => {
      return await context.prisma.image.create({
        data: {
          url: args.url,
          title: args.title,
          items: { 
            connect: args.items.map(id => ({ id })) //will only be one item most likely, but still
          },
        },
      })
    },
  },

  Dataset: {
    items: (parent: { id: number }, _args: unknown, context: Context) =>
      context.prisma.dataset
    .findUnique({ where: { id: parent.id } })
    .items(),
  },

  Item: {
    datasets: (parent: { id: number }, _args: unknown, context: Context) =>
      context.prisma.item
    .findUnique({ where: { id: parent.id } })
    .datasets(),
  },
}
