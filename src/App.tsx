import { useEffect } from 'react';
import { useAppState } from './GlobalContext';
import Navigation from './Navigation';


function App() {
  const state = useAppState()

  /* useEffect(() => {
    document.documentElement.setAttribute('data-theme', "dark"); //temp hack, I suppose
  }); */

  return <>
    <Navigation/>
    {state.window()}
  </>
}

export default App;