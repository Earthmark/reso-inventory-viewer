import "./App.css";
import { useAppSelector } from "./app/hooks";
import { manifestLoaded } from "./features/manifestSlice";
import Landing from "./viewer/Landing";
import Manifest from "./viewer/Manifest";

const App = () => {
  const currentUnloaded = !useAppSelector(manifestLoaded);
  return currentUnloaded ? <Landing /> : <Manifest />;
};

export default App;
