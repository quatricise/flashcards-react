import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { PrismaClient } from '@prisma/client'
import { ApolloLogger } from './ApolloLogger.plugin'
import uploadRouter from './upload'
import cors from "cors"
import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
dotenv.config({path: envFile})

const brainrotUrl = "https://brainrot.loca.lt"

const frontendUrl = process.env.FRONTEND_BASE_URL
const backendUrl =  process.env.API_BASE_URL
const port =        new URL(backendUrl).port
if(!port) throw new Error("Could not extract port from: " + backendUrl)

const prisma = new PrismaClient()
const app = express()

app.use(cors({
  origin: [frontendUrl, brainrotUrl],
}))

app.use("/api", uploadRouter)

app.use("/uploads", express.static("uploads"))

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

const plugins = process.env.NODE_ENV === "development" ? [] : [ApolloLogger]

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins,
    context: () => ({ prisma }),
  })
  await server.start()
  server.applyMiddleware({ app })

  app.listen({ port }, () => {
    console.log(`🚀 Server ready at ${backendUrl}${server.graphqlPath}`)
  })
}

startServer()
