import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { PrismaClient } from '@prisma/client'
import cors from "cors"
import uploadRouter from './upload'

const prisma = new PrismaClient()
const app = express()
app.use(cors({
  origin: "http://localhost:5173",
}))
app.use("/api", uploadRouter)
app.use("/uploads", express.static("uploads"))

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ prisma }),
  })
  await server.start()
  server.applyMiddleware({ app })

  app.listen({ port: 4000 }, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  })
}

startServer()
