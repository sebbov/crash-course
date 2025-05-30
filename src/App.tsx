import "./App.css";
import Chart from "./Chart";
import crashData from "./crash_data.json";
import { useEffect, useState } from "react";
import "./Modal.css"; // for custom styling
import { SlidersHorizontal } from "lucide-react";
import Filter from "./Filter";

function App() {
  const [showModal, setShowModal] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const crashEntries = Object.entries(crashData);
  const allDays = crashEntries.map(([_, series]) => Object.keys(series).length);
  const allMinDeltas = crashEntries.map(([_, series]) =>
    Math.floor(Math.min(...Object.values(series))),
  );
  const allYears = Object.keys(crashData).map((label) => {
    const yearStr = label.split(" ")[0].split("-")[0];
    return parseInt(yearStr, 10);
  });

  const [minDays, setMinDays] = useState(Math.min(...allDays));
  const [maxDays, setMaxDays] = useState(Math.max(...allDays));
  const [minMinDelta, setMinMinDelta] = useState(Math.min(...allMinDeltas));
  const [maxMinDelta, setMaxMinDelta] = useState(Math.max(...allMinDeltas));
  const [minYear, setMinYear] = useState(Math.min(...allYears));
  const [maxYear, setMaxYear] = useState(Math.max(...allYears));

  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "Enter") {
        setShowModal(false);
      }
      if (event.key === "f") {
        setShowFilter((prev) => !prev);
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
              shows the drop from the ATH and the x axis the number of days
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
      <div className={`app-wrapper ${showModal ? "blurred" : ""}`}>
        <button
          className="filter-button"
          onClick={() => setShowFilter((prev) => !prev)}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <div className={`main-container ${showFilter ? "with-filter" : ""}`}>
          <div className="content">
            <h2>Current stock market crash against major ones</h2>
            <Chart
              data={crashData}
              minDays={minDays}
              maxDays={maxDays}
              minMinDelta={minMinDelta}
              maxMinDelta={maxMinDelta}
              minYear={minYear}
              maxYear={maxYear}
            />
            <footer>
              <a
                onClick={() => setShowModal(true)}
                style={{ cursor: "pointer" }}
              >
                Help
              </a>
              {" | "}
              <a href="/privacy.html">Privacy</a>
              {" | "}
              <a href="https://github.com/sebbov/crash-course">Source</a>
            </footer>
          </div>
        </div>
      </div>

      {showFilter && (
        <Filter
          allDays={allDays}
          allMinDeltas={allMinDeltas}
          allYears={allYears}
          minDays={minDays}
          maxDays={maxDays}
          minMinDelta={minMinDelta}
          maxMinDelta={maxMinDelta}
          minYear={minYear}
          maxYear={maxYear}
          setMinDays={setMinDays}
          setMaxDays={setMaxDays}
          setMinMinDelta={setMinMinDelta}
          setMaxMinDelta={setMaxMinDelta}
          setMinYear={setMinYear}
          setMaxYear={setMaxYear}
        />
      )}
    </>
  );
}

export default App;
