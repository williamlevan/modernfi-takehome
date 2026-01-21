/**
 * D3.js chart component for visualizing the Treasury Yield Curve
 * Displays yield rates across different terms (1M through 30Y) as a line chart
 * Responsive design that adapts to container size
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { YieldData } from '@modernfi-takehome/shared';
import styles from '../styles/components/YieldCurveChart.module.scss';
import { TERM_ORDER } from '../constants/constants';

interface YieldCurveChartProps {
    yieldsData: YieldData[];
    width?: number;
    height?: number;
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number
    };
}

export default function YieldCurveChart({
    yieldsData,
    width: initialWidth = 900,
    height: initialHeight = 500,
    margin: initialMargin = { top: 20, right: 0, bottom: 100, left: 80 },
}: YieldCurveChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    /**
     * Calculate responsive dimensions based on container size
     * Updates on window resize to maintain responsiveness
     */
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                // The container is already 80% width via CSS, so use its width directly
                const containerWidth = containerRef.current.offsetWidth;
                // Account for padding inside chartContainer (1.5rem = 24px on each side)
                const padding = 48; // 24px * 2
                const calculatedWidth = Math.max(containerWidth - padding, 400);
                const calculatedHeight = Math.max(calculatedWidth * 0.5, 300);

                setDimensions({
                    width: calculatedWidth,
                    height: calculatedHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    /**
     * Render D3 chart when yields data or dimensions change
     * Creates scales, axes, line, and interactive tooltips
     */
    useEffect(() => {
        if (!svgRef.current || yieldsData.length === 0) return;

        const { width, height } = dimensions;

        // Calculate responsive margins (scale down on smaller screens)
        const margin = {
            ...initialMargin,
            left: Math.max(initialMargin.left * (width / initialWidth), 50), // Increased minimum
            right: Math.max(initialMargin.right * (width / initialWidth), 50), // Increased to prevent cutoff
            bottom: Math.max(initialMargin.bottom * (width / initialWidth), 70),
        };

        // Clear previous chart rendering
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Get most recent yield for each term (in TERM_ORDER sequence)
        const latestYields = TERM_ORDER.map((term: string) => {
            const termData = yieldsData.filter((yieldData: YieldData) => yieldData.term === term);
            if (termData.length === 0) return null;

            // Find the most recent data point for this term
            const latest = termData.reduce((latest, current) => {
                return new Date(current.date) > new Date(latest.date) ? current : latest;
            });

            return {
                term,
                value: latest.value,
                date: latest.date
            };
        }).filter(Boolean) as Array<{ term: string; value: number; date: Date }>;

        if (latestYields.length === 0) return;

        // Format chart date for subtitle
        const chartDate = latestYields[0].date;
        const dateFormatter = d3.timeFormat('%B %d, %Y');
        const formattedDate = dateFormatter(chartDate);

        // Adjust top margin to accommodate title and subtitle
        const adjustedMargin = { ...margin, top: margin.top + 40 };
        const adjustedInnerHeight = height - adjustedMargin.top - adjustedMargin.bottom;

        // Create main chart group (translated to account for margins)
        const g = svg
            .append('g')
            .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);

        // Calculate responsive font sizes based on chart width
        const titleFontSize = Math.max(16, width / 45);
        const subtitleFontSize = Math.max(12, width / 64);
        const axisFontSize = Math.max(10, width / 90);

        // Chart title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', `${titleFontSize}px`)
            .style('font-weight', '600')
            .style('fill', 'currentColor')
            .text('Treasury Yield Curve');

        // Chart subtitle with date
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', `${subtitleFontSize}px`)
            .style('fill', '#64748b')
            .text(`As of ${formattedDate}`);

        // X-axis scale (terms evenly spaced, not normalized by time)
        const xScale = d3
            .scalePoint()
            .domain(latestYields.map(d => d.term))
            .range([0, innerWidth])
            .padding(0.1);

        // Y-axis scale (yield rates with padding)
        const yMin = d3.min(latestYields, d => d.value) ?? 0;
        const yMax = d3.max(latestYields, d => d.value) ?? 5;
        const yPadding = (yMax - yMin) * 0.1; // 10% padding above and below

        const yScale = d3
            .scaleLinear()
            .domain([yMin - yPadding, yMax + yPadding])
            .range([adjustedInnerHeight, 0]);

        // Line generator for the yield curve
        const line = d3
            .line<{ term: string; value: number; date: Date }>()
            .x(d => xScale(d.term) ?? 0)
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX); // Smooth curve interpolation

        // X-axis (terms)
        const xAxis = d3.axisBottom(xScale);

        g.append('g')
            .attr('transform', `translate(0,${adjustedInnerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'middle')
            .style('font-size', `${axisFontSize}px`);

        // X-axis label
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', adjustedInnerHeight + 50)
            .attr('fill', 'currentColor')
            .style('text-anchor', 'middle')
            .style('font-size', `${subtitleFontSize}px`)
            .style('font-weight', '500')
            .text('Term');

        // Y-axis (rates)
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${d}%`);

        g.append('g')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', `${axisFontSize}px`);

        // Y-axis label (rotated -90 degrees)
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50) // Increased from -40 to -50 for more space
            .attr('x', -adjustedInnerHeight / 2)
            .attr('fill', 'currentColor')
            .style('text-anchor', 'middle')
            .style('font-size', `${subtitleFontSize}px`)
            .style('font-weight', '500')
            .text('Rate (%)');

        // Grid lines (vertical)
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${adjustedInnerHeight})`)
            .call(
                d3
                    .axisBottom(xScale)
                    .tickSize(-adjustedInnerHeight)
                    .tickFormat(() => '')
            )
            .selectAll('line')
            .attr('stroke', '#e0e0e0')
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.5);

        // Grid lines (horizontal)
        g.append('g')
            .attr('class', 'grid')
            .call(
                d3
                    .axisLeft(yScale)
                    .tickSize(-innerWidth)
                    .tickFormat(() => '')
            )
            .selectAll('line')
            .attr('stroke', '#e0e0e0')
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.5);

        // Yield curve line
        g.append('path')
            .datum(latestYields)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2.5)
            .attr('d', line);

        // Data points (circles)
        g.selectAll('.dot')
            .data(latestYields)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.term) ?? 0)
            .attr('cy', d => yScale(d.value))
            .attr('r', 5)
            .attr('fill', '#3b82f6')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Tooltip element (created once, reused for all dots)
        const tooltip = d3
            .select('body')
            .append('div')
            .style('position', 'absolute')
            .style('padding', '8px 12px')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('font-size', '12px')
            .style('z-index', '1000');

        // Tooltip interactions (show on hover, hide on mouseout)
        g.selectAll('.dot')
            .on('mouseover', function (event, d) {
                tooltip
                    .style('opacity', 1)
                    .html(() => {
                        const datum = d as { term: string; value: number };
                        return `<strong>${datum.term}</strong><br/>Rate: ${datum.value.toFixed(2)}%`;
                    });
            })
            .on('mousemove', function (event: MouseEvent) {
                tooltip
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`);
            })
            .on('mouseout', function () {
                tooltip.style('opacity', 0);
            });

        // Cleanup: remove tooltip when component unmounts or re-renders
        return () => {
            tooltip.remove();
        };
    }, [yieldsData, dimensions, initialMargin]);

    return (
        <div className={styles.yieldCurveChart}>
            <div className={styles.container} ref={containerRef}>
                <div className={styles.chartContainer}>
                    <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
                </div>
            </div>
        </div>
    );
}