import "./App.css";
import { useAppSelector } from "./app/hooks";
import { manifestLoaded } from "./features/manifestSlice";
import Landing from "./Landing";
import Manifest from "./Manifest";

function App() {
  const wasLoaded = useAppSelector(manifestLoaded);
  return <>{wasLoaded ? <Manifest /> : <Landing />}</>;
}

export default App;
