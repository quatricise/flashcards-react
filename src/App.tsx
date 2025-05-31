import { useAppState } from './GlobalContext';
import Navigation from './Navigation';


function App() {
  const state = useAppState()
  console.log(state.training.setup)
  return <>
    <Navigation/>
    {state.window({datasetIds: state.training.datasets.map(d => d.id), trainingSetup: state.training.setup, trainingMode: state.training.mode})}
  </>
}

export default App;