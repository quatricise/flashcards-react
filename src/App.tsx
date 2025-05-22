import Window_DatasetSelect from "./Window_DatasetSelect";
import Window_Main from "./Window_Main";
import Window_Edit from "./Window_Edit";
import Window_Train from "./Window_Train";
import Window_TrainSetup from './Window_TrainSetup';

function App() {

  //I need to push windows into some neat global array, I think, or a map, otherwise I cannot use them

  return <>
    <Window_Main/>
    <Window_DatasetSelect/>
    <Window_Edit datasetIds={[1, 2, 3]} />
    <Window_Train/>
    <Window_TrainSetup/>
  </>
}

export default App;