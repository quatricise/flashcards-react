import { createContext, useReducer, useContext } from "react"
import type { ReactNode, Dispatch } from "react"
import type { AppState, AppAction, StateTrainingData, Window_Train_Props } from "./GlobalTypes"

import Window_Main from "./Window_Main";
import Window_Edit from "./Window_Edit";
import Window_Train from "./Window_Train";
import Window_TrainSetup from './Window_TrainSetup';

const trainingDataInitial: StateTrainingData = {datasets: [], setup: {A: [], B: []}, mode: "brainrot", teams: []}

const appStateInitial: AppState = {
  window:   () => <Window_TrainSetup/>,
  history:  [],
  training: trainingDataInitial,
  windows:  {
    Main:          () => <Window_Main/>,
    Edit:          () => <Window_Edit/>,
    Train:         (props: Window_Train_Props) => <Window_Train datasetIds={props.datasetIds} trainingSetup={props.trainingSetup} trainingMode={props.trainingMode} teams={props.teams}/>,
    TrainSetup:    () => <Window_TrainSetup/>,
  },
  flags: {showNav: true}
};


const appDispatchInitial: Dispatch<AppAction> = () => {
  throw new Error('Dispatch called outside of GlobalProvider')
}

const AppContextState =     createContext <AppState> (appStateInitial);
const AppContextDispatch =  createContext <Dispatch<AppAction>> (appDispatchInitial);

interface Props {
  children: ReactNode
}

function stateReducer(state: AppState, action: AppAction): AppState {
  const payload = action.payload
  switch (action.name) {
    case 'WINDOW_SET': {
      const training: StateTrainingData = 
      {...state.training, 
        datasets: payload.datasets ?? state.training.datasets, 
        setup: payload.trainingSetup ?? state.training.setup,
        teams: payload.teams ?? state.training.teams
      }

      return { ...state, window: payload.window ?? state.window, training: training, flags: {...state.flags, ...payload.flags} };
    }
    case 'WINDOW_CLOSE': {
      return { ...state, window: state.history.pop() ?? state.window };
    }
    case 'APPLY_FLAGS': {
      return {...state, flags: {...state.flags, ...payload.flags}}
    }
    default: {
      return state;
    }
  }
}

export const AppProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(stateReducer, appStateInitial);
  return (
    <AppContextState.Provider value={state}>
      <AppContextDispatch.Provider value={dispatch}>
        {children}
      </AppContextDispatch.Provider>
    </AppContextState.Provider>
  );
};

export const useAppState =    () => useContext(AppContextState);
export const useAppDispatch = () => useContext(AppContextDispatch);
