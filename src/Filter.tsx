import "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

type FilterProps = {
    allDays: number[];
    allMinDeltas: number[];
    allYears: number[];
    minDays: number;
    maxDays: number;
    minMinDelta: number;
    maxMinDelta: number;
    minYear: number;
    maxYear: number;
    setMinDays: (val: number) => void;
    setMaxDays: (val: number) => void;
    setMinMinDelta: (val: number) => void;
    setMaxMinDelta: (val: number) => void;
    setMinYear: (val: number) => void;
    setMaxYear: (val: number) => void;
};

const Filter: React.FC<FilterProps> = ({
    allDays,
    allMinDeltas,
    allYears,
    minDays,
    maxDays,
    minMinDelta,
    maxMinDelta,
    minYear,
    maxYear,
    setMinDays,
    setMaxDays,
    setMinMinDelta,
    setMaxMinDelta,
    setMinYear,
    setMaxYear,
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
                    reverse={true}
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
                    <span>Drop: {-maxMinDelta}%</span> -{" "}
                    <span>{-minMinDelta}%</span>
                </div>
            </div>
            <br />
            <div className="filter-slider">
                <Slider
                    range
                    allowCross={false}
                    min={Math.min(...allYears)}
                    max={Math.max(...allYears)}
                    value={[minYear, maxYear]}
                    onChange={(value) => {
                        const [min, max] = value as number[];
                        setMinYear(min);
                        setMaxYear(max);
                    }}
                />
                <div className="slider-values">
                    <span>Year: {minYear}</span> - <span>{maxYear}</span>
                </div>
            </div>
        </div>
    );
};

export default Filter;
