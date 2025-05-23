import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import './index.css'
import App from './App.tsx'
import { AppProvider } from './GlobalContext';



// 👇 Replace this with your actual GraphQL server URL
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
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