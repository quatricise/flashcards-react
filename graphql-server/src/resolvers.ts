import { PrismaClient } from '@prisma/client'

interface Context {
  prisma: PrismaClient
}



/* QUERY ARGS */

interface DatasetsByIdsArgs {
  ids: number[]
}

interface ItemsByDatasetIdsArgs {
  datasetIds: number[]
}



/* MUTATION ARGS */

interface CreateItemArgs {
  title:        string
  description:  string
  datasets:     number[]
}

interface CreateImageArgs {
  url:      string
  title:    string
  items:    number[] /* this array might actually contain a singular Item for a long time. But it's no harm if this is an array. */
}

interface DeleteItemArgs {
  id: number
}

interface DeleteDatasetsArgs {
  ids: number[]
}

interface DeleteImageArgs {
  ids: number[]
}

interface CreateDatasetArgs {
  title:    string
}

interface UpdateItemArgs {
  id:           number
  title:        string
  description:  string
  datasets:     number[]
}

interface UpdateDatasetArgs {
  id:           number
  title:        string
}

export const resolvers = {
  Query: {
    datasets: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.dataset.findMany({
        include: {
          items: {
            include: {
              images: true,
              datasets: true
            }
          }
        }
      })
    },
    items: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.item.findMany({
        include: {
          datasets: {
            include: {
              items: {
                include: {
                  images: true
                }
              }
            }
          }, 
          images: true 
        },
      })
    },
    images: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.prisma.image.findMany({
        include: { items: true },
      })
    },
    datasetsByIds: async (_parent: unknown, args: DatasetsByIdsArgs, context: Context) => {
      return await context.prisma.dataset.findMany({
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
    },
    itemsByDatasetIds: async(_parent: unknown, args: ItemsByDatasetIdsArgs, context: Context) => {
      return await context.prisma.item.findMany({
        where: {datasets: {some: {id: {in: args.datasetIds}}}},
        include: {datasets: true, images: true}
      })
    }
  },

  Mutation: {
    createItem: async (
      _parent: unknown,
      args: CreateItemArgs,
      context: Context
    ) => {
      return await context.prisma.item.create({
        data: {
          title:        args.title,
          description:  args.description,
          datasets: {
            connect: args.datasets.map(datasetId => ({id: datasetId}))
          },
        },
        include: { datasets: true },
      })
    },

    createDataset: async (
      _parent: unknown,
      args: CreateDatasetArgs,
      context: Context
    ) => {
      return await context.prisma.dataset.create({
        data: {
            title: args.title
          },
        })
    },
    
    createImage: async (
      _parent: unknown,
      args: CreateImageArgs, 
      context: Context
    ) => {
      return await context.prisma.image.create({
        data: {
          url: args.url,
          title: args.title,
          items: { 
            connect: args.items.map(itemId => ({ id: itemId })) //will only be one item most likely, but still
          },
        },
        include: { items: true }
      })
    },

    deleteItem: async (
      _parent: unknown,
      args: DeleteItemArgs, 
      context: Context
    ) => {
      return args.id //temp for trying this out publicly
      console.log("Hi, deleting item.")
      await context.prisma.item.delete({where: {id: args.id}})
      //@todo delete images if they only had this item as reference
      return args.id
    },

    deleteDatasets: async (
      _parent: unknown,
      args: DeleteDatasetsArgs,
      context: Context
    ) => {
      return args.ids //temp for trying this out publicly
      console.log("Ids: " + args.ids)
      for(const id of args.ids) {
        await context.prisma.dataset.update({
          where: {id: id},
          data: {
            items: {
              set: []
            }
          }
        })
      }
      await context.prisma.dataset.deleteMany({where: {id: {in: args.ids}}})

      /* gonna do some transactions or shit to delete items, but the 'none: true' throws error */

      /* await context.prisma.item.deleteMany({
        where: {
          datasets: {
            none: true
          }
        }
      }) */
      return args.ids
    },

    deleteImages: async (
      _parent: unknown,
      args: DeleteImageArgs,
      context: Context
    ) => {
      //@todo this does not probably unregister them from the Item table
      await context.prisma.image.deleteMany({
        where: {id: {in: args.ids}}
      })
      return args.ids
    },

    updateItem: async (
      _parent: unknown,
      args: UpdateItemArgs,
      context: Context
    ) => {
      return await context.prisma.item.update({
        where: {id: args.id},
        data: {
          title: args.title,
          description: args.description,
          datasets: {
            set: args.datasets.map(datasetId => ({id: datasetId}))
          },
        },
        include: {images: true, datasets: true}
      })
    },

    renameDataset: async (
      _parent: unknown,
      args: UpdateDatasetArgs,
      context: Context
    ) => {
      return await context.prisma.dataset.update({
        where: {id: args.id},
        data: {
          title: args.title,
        },
      })
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
