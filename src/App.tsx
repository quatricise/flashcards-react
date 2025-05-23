import { useEffect } from 'react';
import { useAppState } from './GlobalContext';


function App() {
  const state = useAppState()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', "dark"); //temp hack, I suppose
  });

  return <>
    {state.window()}
  </>
}

export default App;