import { useAppState } from './GlobalContext';
import Navigation from './Navigation';


export default function App() {
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

//@todo open on last opened tab? open on main?