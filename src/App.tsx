import "./App.css";
import Chart from "./Chart";
import crashData from "./crash_data.json";
import { useState } from "react";
import "./Modal.css"; // for custom styling

function App() {
  const [showModal, setShowModal] = useState(true);

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Welcome to Crash Course</h2>
            <br />
            <p>Hover over chart lines to show their label.</p>
            <p>Zoom in the chart using your mouse wheel.</p>
            <br />
            <p>
              For background see this{" "}
              <a href="https://www.reddit.com/r/dataisbeautiful/comments/1k2i027/current_stock_market_crash_against_major_ones_oc/">
                Reddit thread
              </a>
              .
            </p>
            <br />
            <p>
              Original concept and Python implementation by @resende451 on
              Twitter (
              <a href="https://github.com/resendedaniel/drawdown">Source</a>).
              This site enhances the original by adding interactivity, daily
              updates, and additional features.
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
          <a href="/privacy">Privacy</a>
          {" | "}
          <a href="https://github.com/sebbov/crash-course">Source</a>
        </footer>
      </div>
    </>
  );
}

export default App;
