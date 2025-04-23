import "./App.css";
import Chart from "./Chart";
import crashData from "./crash_data.json";

function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <Chart data={crashData} />
    </div>
  );
}

export default App;
