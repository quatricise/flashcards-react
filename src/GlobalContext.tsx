import { createContext, useReducer, useContext } from "react"
import type { ReactNode, Dispatch } from "react"
import type { AppWindow, AppAction, AppActionPayload } from "./GlobalTypes"

import Window_DatasetSelect from "./Window_DatasetSelect";
import Window_Main from "./Window_Main";
import Window_Edit from "./Window_Edit";
import Window_Train from "./Window_Train";
import Window_TrainSetup from './Window_TrainSetup';

export type AppState = {
  window:   AppWindow,
  windows:  AppWindows,
  history:  AppWindowHistory,
}

type AppWindows = {
  Main:          typeof Window_Main,
  DatasetSelect: typeof Window_DatasetSelect,
  Edit:          typeof Window_Edit,
  Train:         typeof Window_Train,
  TrainSetup:    typeof Window_TrainSetup,
}

type AppWindowHistory = AppWindow[]

const appStateInitial: AppState = {
  window:   () => <Window_DatasetSelect/>,
  history:  [],
  windows:  {
    Main:          () => <Window_Main/>,
    DatasetSelect: () => <Window_DatasetSelect/>,
    Edit:          () => <Window_Edit/>,
    Train:         () => <Window_Train/>,
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
  switch (action.name) {
    case 'WINDOW_SET': {
      return { ...state, window: action.payload.window ?? state.window };
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
