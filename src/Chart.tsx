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

export default function StockCrashChart({ data }: Props) {
    const ref = useRef<SVGSVGElement | null>(null);
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        if (!ref.current) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove(); // Clear previous renders

        const width = window.innerWidth * 0.9;
        const height = window.innerHeight * 0.8;
        const margin = { top: 40, right: 40, bottom: 40, left: 60 };

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
        console.log(`minY: ${minY}`);
        const maxY = d3.max(visibleData, (d) => d.y)!;
        const yPadding = (maxY - minY) * 0.05;
        const yScale = d3
            .scaleLinear()
            .domain([Math.floor(minY - yPadding), Math.ceil(maxY + yPadding)])
            .range([plotHeight, 0]);

        const color = d3
            .scaleOrdinal(d3.schemeCategory10)
            .domain(Object.keys(data));

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
            .attr("x", -30)
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
                .attr("stroke", color(label)!)
                .attr("stroke-width", 2)
                .attr("d", line)
                .attr("pointer-events", "visibleStroke")
                .on("mouseover", function() {
                    d3.select(this)
                        .attr("stroke-width", 4)
                        .attr(
                            "stroke",
                            d3
                                .color(color(label)!)
                                ?.brighter(0.7)
                                ?.toString() ?? color(label)!,
                        );
                    g.select(`#label-${labelId}`)
                        .style("visibility", "visible")
                        .style("font-weight", "bold");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr("stroke-width", 2)
                        .attr("stroke", color(label)!);
                    g.select(`#label-${labelId}`)
                        .style("visibility", "hidden")
                        .style("font-weight", "normal");
                });

            const lastPoint = visibleSeries[visibleSeries.length - 1];
            const text = g
                .append("text")
                .attr("id", `label-${labelId}`)
                .attr("x", xScale(lastPoint.x) + 5)
                .attr("y", yScale(lastPoint.y))
                .attr("fill", color(label)!)
                .attr("font-size", 18)
                .style("font-weight", "bold")
                .attr("text-anchor", "start")
                .style("visibility", "hidden")
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

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", 24)
            .attr("font-weight", "bold")
            .text("Current stock market crash against major ones");

        const mouseMove = (event: any) => {
            const [mouseX, mouseY] = d3.pointer(event);
            const adjustedX = mouseX - margin.left;
            const adjustedY = mouseY - margin.top;

            hoverXLabel
                .style("display", null)
                .attr("x", adjustedX)
                .text(`${xScale.invert(adjustedX).toFixed(0)}d`);

            hoverYLabel
                .style("display", null)
                .attr("y", adjustedY)
                .text(`${yScale.invert(adjustedY).toFixed(0)}%`);
        };
        svg.on("mousemove", mouseMove).on("mouseleave", () => {
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
                    setZoom(Math.min(1.0, zoom * (1 + event.deltaY / 200)));
                }
            },
            { passive: false },
        );
    }, [data, zoom]);

    return <svg ref={ref}></svg>;
}
