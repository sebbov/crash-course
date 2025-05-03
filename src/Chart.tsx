import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

type CrashData = {
    [label: string]: {
        // y-values like -12.3 (% drop from ATH), keyed by days since ATH.
        [day: string]: number;
    };
};

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function(...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    } as T;
}

function filterData(
    data: CrashData,
    minDays: number,
    maxDays: number,
    minMinDelta: number,
    maxMinDelta: number,
    minYear: number,
    maxYear: number,
    keepLabel?: string,
): CrashData {
    const filtered: CrashData = {};
    for (const [label, series] of Object.entries(data)) {
        if (label === keepLabel) {
            filtered[label] = series;
            continue;
        }
        const dayCount = Object.keys(series).length;
        const values = Object.values(series);
        const minDelta = Math.min(...values);
        const yearStr = label.split(" ")[0].split("-")[0]; // e.g., "2020" from "2020-03-01 ..."
        const year = parseInt(yearStr, 10);
        if (
            dayCount >= minDays &&
            dayCount <= maxDays &&
            minDelta >= minMinDelta &&
            minDelta <= maxMinDelta &&
            year >= minYear &&
            year <= maxYear
        ) {
            filtered[label] = series;
        }
    }
    return filtered;
}

type Props = {
    data: CrashData;
    minDays: number;
    maxDays: number;
    minMinDelta: number;
    maxMinDelta: number;
    minYear: number;
    maxYear: number;
};

export default function Chart({
    data,
    minDays,
    maxDays,
    minMinDelta,
    maxMinDelta,
    minYear,
    maxYear,
}: Props) {
    const ref = useRef<SVGSVGElement | null>(null);
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        const drawChart = () => {
            if (!ref.current) return;

            const svg = d3.select(ref.current);
            svg.selectAll("*").remove(); // Clear previous renders

            const width = ref.current.parentElement!.clientWidth;
            const height = window.innerHeight * 0.85;
            const margin = { top: 10, right: 20, bottom: 30, left: 80 };

            const plotWidth = width - margin.left - margin.right;
            const plotHeight = height - margin.top - margin.bottom;

            const g = svg
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const allLabels = Object.keys(data).sort();
            const currentLabel =
                allLabels.length > 0 ? allLabels[allLabels.length - 1] : "";

            const filteredData = filterData(
                data,
                minDays,
                maxDays,
                minMinDelta,
                maxMinDelta,
                minYear,
                maxYear,
                currentLabel,
            );
            const allSeries = Object.entries(filteredData).map(
                ([label, points]) =>
                    Object.entries(points).map(([x, y]) => ({
                        label,
                        x: +x,
                        y: +y,
                    })),
            );

            const flatData = allSeries.flat();

            const maxX = Math.round(d3.max(flatData, (d) => d.x)! * zoom);
            const visibleData = flatData.filter((d) => d.x <= maxX);
            const xScale = d3
                .scaleLinear()
                .domain([0, maxX])
                .range([0, plotWidth]);
            const minY = d3.min(visibleData, (d) => d.y)!;
            const maxY = d3.max(visibleData, (d) => d.y)!;
            const yPadding = (maxY - minY) * 0.05;
            const yScale = d3
                .scaleLinear()
                .domain([
                    Math.floor(minY - yPadding),
                    Math.ceil(maxY + yPadding),
                ])
                .range([plotHeight, 0]);

            const entries = Object.entries(filteredData);
            const scoredEntries = entries.map(([label, series]) => {
                const duration = Object.keys(series).length;
                const minDrop = Math.min(...Object.values(series));
                const score = duration + 20 * Math.abs(minDrop);
                return { label, series, score };
            });

            const sorted = scoredEntries
                .filter((d) => d.label !== currentLabel)
                .sort((a, b) => b.score - a.score);

            const colorScale = d3
                .scaleSequential<string>()
                .domain([0, sorted.length - 1])
                .interpolator(d3.interpolateWarm);
            const labelToColor = new Map<string, string>();
            sorted.forEach(({ label }, i) => {
                labelToColor.set(label, colorScale(i));
            });
            labelToColor.set(currentLabel, "#e31a1c");

            const orderedEntries = [
                ...sorted,
                ...scoredEntries.filter((d) => d.label === currentLabel),
            ];

            const hoverXLabel = g
                .append("text")
                .attr("y", plotHeight + 30)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .style("fill", "gray")
                .style("pointer-events", "none")
                .style("display", "none");

            const hoverYLabel = g
                .append("text")
                .attr("x", -35)
                .attr("text-anchor", "end")
                .attr("font-size", 12)
                .style("fill", "gray")
                .style("pointer-events", "none")
                .style("display", "none");

            const line = d3
                .line<{ x: number; y: number }>()
                .x((d) => xScale(d.x))
                .y((d) => yScale(d.y));

            for (const { label, series: points } of orderedEntries) {
                const series = Object.entries(points).map(([x, y]) => ({
                    x: +x,
                    y: +y,
                }));
                const visibleSeries = series.filter((d) => d.x <= maxX);
                const sanitizedLabel = label.replace(/[^a-zA-Z0-9-_]/g, "-");
                const labelId = `${sanitizedLabel}-${Math.random().toString(36).substr(2, 9)}`;

                // Add a wider transparent hover path first.
                g.append("path")
                    .datum(visibleSeries)
                    .attr("fill", "none")
                    .attr("stroke", "transparent")
                    .attr("stroke-width", 10) // Wider for easier hover.
                    .attr("d", line)
                    .attr("pointer-events", "stroke")
                    .on("mouseover", function() {
                        d3.select(this.nextSibling as SVGPathElement) // Targets the actual line.
                            .attr("stroke-width", 3)
                            .attr(
                                "stroke",
                                d3
                                    .color(labelToColor.get(label)!)
                                    ?.brighter(0.7)
                                    ?.toString() ?? labelToColor.get(label)!,
                            );
                        g.select(`#label-${labelId}`)
                            .style("visibility", "visible")
                            .style("font-weight", "bold");
                    })
                    .on("mouseout", function() {
                        if (label !== currentLabel) {
                            d3.select(this.nextSibling as SVGPathElement)
                                .attr("stroke-width", 1)
                                .attr("stroke", labelToColor.get(label)!);
                            g.select(`#label-${labelId}`)
                                .style("visibility", "hidden")
                                .style("font-weight", "normal");
                        }
                    });

                // Actual visible line.
                g.append("path")
                    .datum(visibleSeries)
                    .attr("fill", "none")
                    .attr("stroke", labelToColor.get(label)!)
                    .attr("stroke-width", label === currentLabel ? 3 : 1)
                    .attr("d", line)
                    // Prevent interference with the hover path.
                    .attr("pointer-events", "none");

                if (label === currentLabel) {
                    g.select(`#label-${labelId}`)
                        .style("visibility", "visible")
                        .style("font-weight", "bold");

                    g.select(`[id='${labelId}']`).raise();
                }

                const maxDropPoint = visibleSeries.reduce((min, point) =>
                    point.y < min.y ? point : min,
                );
                const text = g
                    .append("text")
                    .attr("id", `label-${labelId}`)
                    .attr("x", xScale(maxDropPoint.x) + 5)
                    .attr("y", yScale(maxDropPoint.y))
                    .attr("fill", labelToColor.get(label)!)
                    .attr("font-size", 18)
                    .style("font-weight", "bold")
                    .style("stroke", "rgba(255, 255, 255, 0.7)")
                    .style("stroke-width", "6px")
                    .style("paint-order", "stroke")
                    .attr("text-anchor", "start")
                    .style(
                        "visibility",
                        label === currentLabel ? "visible" : "hidden",
                    )
                    .text(label);
                const textWidth = (
                    text.node() as SVGTextElement
                ).getComputedTextLength();
                const x = xScale(maxDropPoint.x) + 5;
                if (x + textWidth > width - margin.right) {
                    text.attr("text-anchor", "end");
                }
            }

            g.append("g")
                .attr("transform", `translate(0,${plotHeight})`)
                .call(
                    d3
                        .axisBottom(xScale)
                        .ticks(10)
                        .tickFormat((d) => `${d}d`),
                );

            g.append("g").call(
                d3
                    .axisLeft(yScale)
                    .ticks(10)
                    .tickFormat((d) => `${d}%`),
            );

            svg.on("mousemove", (event: any) => {
                const [mouseX, mouseY] = d3.pointer(event);
                const adjustedX = mouseX - margin.left;
                const adjustedY = mouseY - margin.top;
                const xVal = xScale.invert(adjustedX);
                const yVal = yScale.invert(adjustedY);

                const [xMin, xMax] = xScale.domain();
                if (xVal >= xMin && xVal <= xMax) {
                    hoverXLabel
                        .style("display", null)
                        .attr("x", adjustedX)
                        .text(`${xVal.toFixed(0)}d`);
                } else {
                    hoverXLabel.style("display", "none");
                }
                const [yMin, yMax] = yScale.domain();
                if (yVal >= yMin && yVal <= yMax) {
                    hoverYLabel
                        .style("display", null)
                        .attr("y", adjustedY)
                        .text(`${yVal.toFixed(0)}%`);
                } else {
                    hoverYLabel.style("display", "none");
                }
            }).on("mouseleave", () => {
                hoverXLabel.style("display", "none");
                hoverYLabel.style("display", "none");
            });

            // Desktop zoom.
            // TODO: Mobile zoom.
            const zoomHandler = debounce((deltaY: number) => {
                setZoom((prev) =>
                    Math.max(
                        0.03,
                        Math.min(1.0, prev * (deltaY < 0 ? 1.02 : 0.98)),
                    ),
                );
            }, 2);

            svg.on(
                "wheel",
                (event) => {
                    if (event.deltaY != 0) {
                        // Ensure an actual scroll event.
                        event.preventDefault();
                        zoomHandler(event.deltaY);
                    }
                },
                { passive: false },
            );
        };

        drawChart();

        const observer = new ResizeObserver(drawChart);
        if (ref.current?.parentElement) {
            observer.observe(ref.current.parentElement);
        }

        return () => observer.disconnect();
    }, [
        data,
        zoom,
        minDays,
        maxDays,
        minMinDelta,
        maxMinDelta,
        minYear,
        maxYear,
    ]);

    return <svg ref={ref}></svg>;
}
