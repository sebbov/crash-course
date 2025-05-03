import "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

type FilterProps = {
    allDays: number[];
    allMinDeltas: number[];
    minDays: number;
    maxDays: number;
    minMinDelta: number;
    maxMinDelta: number;
    setMinDays: (val: number) => void;
    setMaxDays: (val: number) => void;
    setMinMinDelta: (val: number) => void;
    setMaxMinDelta: (val: number) => void;
};

const Filter: React.FC<FilterProps> = ({
    allDays,
    allMinDeltas,
    minDays,
    maxDays,
    minMinDelta,
    maxMinDelta,
    setMinDays,
    setMaxDays,
    setMinMinDelta,
    setMaxMinDelta,
}) => {
    return (
        <div className="filter-panel">
            <div className="filter-slider">
                <Slider
                    range
                    allowCross={false}
                    min={Math.min(...allDays)}
                    max={Math.max(...allDays)}
                    value={[minDays, maxDays]}
                    onChange={(value) => {
                        const [min, max] = value as number[];
                        setMinDays(min);
                        setMaxDays(max);
                    }}
                />
                <div className="slider-values">
                    <span>Duration: {minDays}</span> -{" "}
                    <span>{maxDays} days</span>
                </div>
            </div>
            <br />
            <div className="filter-slider">
                <Slider
                    range
                    allowCross={false}
                    min={Math.min(...allMinDeltas)}
                    max={Math.max(...allMinDeltas)}
                    value={[minMinDelta, maxMinDelta]}
                    onChange={(value) => {
                        const [min, max] = value as number[];
                        setMinMinDelta(min);
                        setMaxMinDelta(max);
                    }}
                />
                <div className="slider-values">
                    <span>Drop: {minMinDelta}%</span> -{" "}
                    <span>{maxMinDelta}%</span>
                </div>
            </div>
        </div>
    );
};

export default Filter;
