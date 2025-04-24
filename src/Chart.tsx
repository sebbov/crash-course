import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

type CrashData = {
    [label: string]: {
        [day: string]: number; // y-values like 94.02 (% of ATH), keyed by days since ATH
    };
};

type Props = {
    data: CrashData;
};

const currentLabel = "2025 (Current)";

export default function Chart({ data }: Props) {
    const ref = useRef<SVGSVGElement | null>(null);
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        if (!ref.current) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove(); // Clear previous renders

        const width = window.innerWidth;
        const height = window.innerHeight * 0.9;
        const margin = { top: 10, right: 20, bottom: 30, left: 80 };

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const allSeries = Object.entries(data).map(([label, points]) =>
            Object.entries(points).map(([x, y]) => ({
                label,
                x: +x,
                y: +y,
            })),
        );

        const flatData = allSeries.flat();

        const maxX = Math.round(d3.max(flatData, (d) => d.x)! * zoom);
        const visibleData = flatData.filter((d) => d.x <= maxX);
        const xScale = d3.scaleLinear().domain([0, maxX]).range([0, plotWidth]);
        const minY = d3.min(visibleData, (d) => d.y)!;
        const maxY = d3.max(visibleData, (d) => d.y)!;
        const yPadding = (maxY - minY) * 0.05;
        const yScale = d3
            .scaleLinear()
            .domain([Math.floor(minY - yPadding), Math.ceil(maxY + yPadding)])
            .range([plotHeight, 0]);

        const labels = Object.keys(data);
        const color = d3
            .scaleSequential<string>()
            .domain([0, labels.length - 1])
            .interpolator(d3.interpolatePlasma);
        const labelToColor = new Map(
            labels.map((label, i) => [label, color(i)]),
        );
        labelToColor.set(currentLabel, "#e31a1c");

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

        for (const [label, points] of Object.entries(data)) {
            const series = Object.entries(points).map(([x, y]) => ({
                x: +x,
                y: +y,
            }));
            const visibleSeries = series.filter((d) => d.x <= maxX);
            const sanitizedLabel = label.replace(/[^a-zA-Z0-9-_]/g, "-");
            const labelId = `${sanitizedLabel}-${Math.random().toString(36).substr(2, 9)}`;
            g.append("path")
                .datum(visibleSeries)
                .attr("fill", "none")
                .attr("stroke", labelToColor.get(label)!)
                .attr("stroke-width", label === currentLabel ? 3 : 1)
                .attr("d", line)
                .attr("pointer-events", "visibleStroke")
                .on("mouseover", function() {
                    d3.select(this)
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
                        d3.select(this)
                            .attr("stroke-width", 1)
                            .attr("stroke", labelToColor.get(label)!);
                        g.select(`#label-${labelId}`)
                            .style("visibility", "hidden")
                            .style("font-weight", "normal");
                    }
                });

            if (label === currentLabel) {
                g.select(`#label-${labelId}`)
                    .style("visibility", "visible")
                    .style("font-weight", "bold");

                g.select(`[id='${labelId}']`).raise();
            }

            const lastPoint = visibleSeries[visibleSeries.length - 1];
            const text = g
                .append("text")
                .attr("id", `label-${labelId}`)
                .attr("x", xScale(lastPoint.x) + 5)
                .attr("y", yScale(lastPoint.y))
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
            const x = xScale(lastPoint.x) + 5;
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
        svg.on(
            "wheel",
            (event) => {
                if (event.deltaY != 0) {
                    // Ensure an actual scroll event.
                    event.preventDefault();
                    setZoom(
                        Math.max(
                            0.05,
                            Math.min(1.0, zoom * (1 + event.deltaY / 200)),
                        ),
                    );
                }
            },
            { passive: false },
        );
    }, [data, zoom]);

    return <svg ref={ref}></svg>;
}
