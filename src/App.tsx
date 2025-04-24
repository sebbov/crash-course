import "./App.css";
import Chart from "./Chart";
import crashData from "./crash_data.json";
import { useEffect, useState } from "react";
import "./Modal.css"; // for custom styling

function App() {
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "Enter") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Welcome to Crash Course</h2>
            <p>
              Crash Course shows a chart of the S&P 500 index during historic
              downturns, as well as for the current 2025 downturn, normalized to
              their all-time-high (ATH) leading to the downturn. The y axis
              shows the drop since the ATH and the x axis the number of days
              since the ATH.
            </p>
            <p>Hover over chart lines to show their label.</p>
            <p>Zoom in the chart using your mouse wheel.</p>
            <p>
              For background see this{" "}
              <a href="https://www.reddit.com/r/dataisbeautiful/comments/1k2i027/current_stock_market_crash_against_major_ones_oc/">
                Reddit thread
              </a>
              .
            </p>
            <p>
              Original concept and{" "}
              <a href="https://github.com/resendedaniel/drawdown">
                implementation
              </a>{" "}
              by <a href="http://x.com/resende451">@resende451</a>. Crash Course
              adds interactivity, daily updates, and other features.
            </p>
            <button onClick={() => setShowModal(false)}>OK</button>
          </div>
        </div>
      )}

      <div className={showModal ? "blurred" : ""}>
        <h2>Current stock market crash against major ones</h2>
        <Chart data={crashData} />
        <footer>
          <a onClick={() => setShowModal(true)} style={{ cursor: "pointer" }}>
            Help
          </a>
          {" | "}
          <a href="/privacy.html">Privacy</a>
          {" | "}
          <a href="https://github.com/sebbov/crash-course">Source</a>
        </footer>
      </div>
    </>
  );
}

export default App;
