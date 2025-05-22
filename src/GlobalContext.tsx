import { createContext, useReducer, useContext } from "react"
import type { ReactNode, Dispatch } from "react"
import type { AppWindow, AppAction, AppActionPayload } from "./GlobalTypes"

export type AppState = {
  window:   AppWindow | undefined
  history:  AppWindowHistory
}

type AppWindowHistory = AppWindow[]

const appStateInitial: AppState = {
  window:   undefined,
  history:  []
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
    case 'WINDOW_SET':
      return { ...state, window: action.payload.window };
    case 'WINDOW_CLOSE':
      return { ...state, window: state.history.pop() };
    default:
      return state;
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

export const useAppValue =    () => useContext(AppContextState);
export const useAppDispatch = () => useContext(AppContextDispatch);
