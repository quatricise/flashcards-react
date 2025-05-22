import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { PrismaClient } from '@prisma/client'
import uploadRouter from './upload'
import cors from "cors"
import { ApolloLogger } from './ApolloLogger.plugin'

const prisma = new PrismaClient()
const app = express()

app.use(cors({
  origin: "http://localhost:5173",
}))

app.use("/api", uploadRouter)

app.use("/uploads", express.static("uploads"))

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});


async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloLogger],
    context: () => ({ prisma }),
  })
  await server.start()
  server.applyMiddleware({ app })

  app.listen({ port: 4000 }, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  })
}

startServer()
