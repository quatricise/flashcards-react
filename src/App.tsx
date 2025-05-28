import { useAppState } from './GlobalContext';
import Navigation from './Navigation';


function App() {
  const state = useAppState()
  console.log("<App/>: Dataset ids:\n", state.training.datasets)
  return <>
    <Navigation/>
    {state.window({datasetIds: state.training.datasets.map(d => d.id)})}
  </>
}

export default App;