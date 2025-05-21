import Window_DatasetSelect from "./Window_DatasetSelect";
import Window_Main from "./Window_Main";
import Window_Edit from "./Window_Edit";
import Window_Train from "./Window_Train";
import Window_TrainSetup from './Window_TrainSetup';

function App() {
  return <>
    <Window_Main/>
    <Window_DatasetSelect/>
    <Window_Edit datasetIds={[1, 2, 3]} />
    <Window_Train/>
    <Window_TrainSetup/>
  </>
}

export default App;