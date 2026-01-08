import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HeatmapCell {
  row: string;
  column: string;
  value: number;
}

interface HeatmapProps {
  data: HeatmapCell[];
  height?: number;
  onCellClick?: (cell: HeatmapCell) => void;
}

export const Heatmap = ({ data, height = 400, onCellClick }: HeatmapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 30, bottom: 120, left: 150 };
    const width = svgRef.current.clientWidth;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const rows = Array.from(new Set(data.map((d) => d.row)));
    const columns = Array.from(new Set(data.map((d) => d.column)));

    const x = d3.scaleBand().domain(columns).range([0, innerWidth]).padding(0.05);

    const y = d3.scaleBand().domain(rows).range([0, innerHeight]).padding(0.05);

    const colorScale = d3
      .scaleSequential()
      .domain([d3.min(data, (d) => d.value) || 0, d3.max(data, (d) => d.value) || 1])
      .interpolator(d3.interpolateBlues);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');

    g.append('g')
      .call(d3.axisLeft(y))
      .style('font-size', '12px');

    const cells = g
      .selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => x(d.column) || 0)
      .attr('y', (d) => y(d.row) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', (d) => colorScale(d.value))
      .attr('rx', 3)
      .style('cursor', onCellClick ? 'pointer' : 'default')
      .style('opacity', 0)
      .on('click', (event, d) => {
        if (onCellClick) {
          onCellClick(d);
        }
      });

    cells.transition().duration(600).style('opacity', 1);

    cells.append('title').text((d) => `${d.row} - ${d.column}: ${(d.value * 100).toFixed(1)}%`);

    g.selectAll('.cell-text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'cell-text')
      .attr('x', (d) => (x(d.column) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => (y(d.row) || 0) + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '10px')
      .style('fill', (d) => (d.value > 0.7 ? '#fff' : '#000'))
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .text((d) => (d.value * 100).toFixed(0))
      .transition()
      .duration(600)
      .style('opacity', 1);
  }, [data, height, onCellClick]);

  return (
    <div className="w-full">
      <svg ref={svgRef} width="100%" height={height} className="text-gray-700 dark:text-gray-300" />
    </div>
  );
};
