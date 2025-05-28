import { createContext, useReducer, useContext } from "react"
import type { ReactNode, Dispatch } from "react"
import type { AppWindow, AppState, AppAction, AppActionPayload, Dataset, StateTrainingData, Window_Train_Props } from "./GlobalTypes"

import Window_Main from "./Window_Main";
import Window_Edit from "./Window_Edit";
import Window_Train from "./Window_Train";
import Window_TrainSetup from './Window_TrainSetup';

// const trainingDataInitial: StateTrainingData = {datasets: []}

const appStateInitial: AppState = {
  window:   () => <Window_TrainSetup/>,
  history:  [],
  training: {datasets: []},
  windows:  {
    Main:          () => <Window_Main/>,
    Edit:          () => <Window_Edit/>,
    Train:         (props: Window_Train_Props) => <Window_Train datasetIds={props.datasetIds}/>,
    TrainSetup:    () => <Window_TrainSetup/>,
  },
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
      const training: StateTrainingData = {...state.training, datasets: payload.datasets ?? state.training.datasets}

      return { ...state, window: payload.window ?? state.window, training: training };
    }
    case 'WINDOW_CLOSE': {
      return { ...state, window: state.history.pop() ?? state.window };
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
