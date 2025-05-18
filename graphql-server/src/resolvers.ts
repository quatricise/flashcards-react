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

interface DeleteItemArgs {
  id: number
}


/* dataset is created wrong, it should be possile to create it empty, and later add items into it. Items by default must belong to a dataset */
interface CreateDatasetArgs {
  title:    string
}

interface DatasetsByIdsArgs {
  ids: number[]
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
        include: { datasets: true, images: true },
      })
    },
    images: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.image.findMany({
        include: { items: true },
      })
    },
    datasetsByIds: async (_parent: unknown, args: DatasetsByIdsArgs, context: Context) => {
      console.log("Looking for IDs:", args.ids)
      const result = await context.prisma.dataset.findMany({
        where: { id: { in: args.ids } },
        include: {
          items: {
            include: {
              images: true,
              datasets: true
            }
          }
        }
      })
      console.log(JSON.stringify(result, null, 2))
      return result
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

    deleteItem: async (
      _parent: unknown,
      args: DeleteItemArgs, 
      context: Context
    ) => {
      return await context.prisma.item.delete({where: {id: args.id}})
    },
  },

  // Dataset: {
  //   items: (parent: { id: number }, _args: unknown, context: Context) =>
  //     context.prisma.dataset
  //     .findUnique({ where: { id: parent.id } })
  //     .items(),
  // },
  Dataset: {
    items: (parent) => parent.items,
  },

  // Item: {
  //   datasets: (parent: { id: number }, _args: unknown, context: Context) =>
  //     context.prisma.item
  //     .findUnique({ where: { id: parent.id } })
  //     .datasets(),
  //   },
  //   images: (parent: {id: number}, _args: unknown, context: Context) => 
  //     context.prisma.image
  //     .findUnique({ where: {id: parent.id}}),
  Item: {
    datasets: (parent) => parent.datasets,
    images: (parent) => parent.images
  },

  // Image: {
  //   items: (parent: { id: number }, _args: unknown, context: Context) =>
  //     context.prisma.dataset
  //     .findUnique({ where: { id: parent.id } })
  //     .items(),
  // }
}
