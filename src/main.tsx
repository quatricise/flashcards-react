import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import './index.css'
import App from './App.tsx'
import { AppProvider } from './GlobalContext';

const isTunnel = (window.location.href as string).includes("brainrot.loca.lt") === true
let API_URL = import.meta.env.VITE_GRAPHQL_SERVER_URL
if(isTunnel) API_URL = "https://new-husky-87.loca.lt/graphql"

// 👇 Replace this with your actual GraphQL server URL
const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
  connectToDevTools: true,
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ApolloProvider client={client}>
          <AppProvider>
            <App/>
          </AppProvider>
      </ApolloProvider>
    </StrictMode>,
)