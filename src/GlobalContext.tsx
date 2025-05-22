import { createContext, useReducer, useContext } from "react"
import type { ReactNode } from "react"
import type { AppWindow } from "./GlobalTypes"

export type AppState = {
  window: AppWindow | null
}

const appStateInitial = {
  window: null,
};

const AppContext = createContext(appStateInitial);

interface Props {
  children: ReactNode
}

interface AppAction {
  name:     AppActionName
  payload:  AppActionPayload
}

interface AppActionPayload {
  window: AppWindow,
}

type AppActionName = "WINDOW_SET" | "WINDOW_CLOSE"

function stateReducer(state: AppState, action: AppAction) {
  switch (action.name) {
    case 'WINDOW_SET':
      return { ...state, window: action.payload.window };
    case 'WINDOW_CLOSE':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

export const AppProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(stateReducer, appStateInitial);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
