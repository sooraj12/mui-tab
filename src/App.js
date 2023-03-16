import "./App.css";

import { Tabs } from "./Tabs";

function App() {
  const generateItems = () => {
    return [...Array(14)].map((j, i) => (
      <div className="Tab">{`item-${i + 1}`}</div>
    ));
  };

  return (
    <div className="container">
      <Tabs>{generateItems()}</Tabs>
    </div>
  );
}

export default App;
