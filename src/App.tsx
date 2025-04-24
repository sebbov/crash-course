import "./App.css";
import Chart from "./Chart";
import crashData from "./crash_data.json";

function App() {
  return (
    <>
      <h2>Current stock market crash against major ones</h2>
      <Chart data={crashData} />
    </>
  );
}

export default App;
