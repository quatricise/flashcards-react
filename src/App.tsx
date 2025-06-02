import { useAppState } from './GlobalContext';
import Navigation from './Navigation';


function App() {
  const state = useAppState()
  return <>
    {
    state.flags.showNav &&
    <Navigation/>
    }
    {state.window({
      datasetIds: state.training.datasets.map(d => d.id), 
      trainingSetup: state.training.setup, 
      trainingMode: state.training.mode, 
      teams: state.training.teams
    })}
  </>
}

export default App;