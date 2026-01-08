import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BarChartData {
  label: string;
  value: number;
  category?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  onBarClick?: (item: BarChartData) => void;
}

const categoryColors: Record<string, string> = {
  power: '#ef4444',
  aero: '#3b82f6',
  weight: '#8b5cf6',
  tire: '#f59e0b',
  fuel: '#10b981',
};

export const BarChart = ({ data, height = 400, onBarClick }: BarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const width = svgRef.current.clientWidth;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 1])
      .nice()
      .range([innerHeight, 0]);

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
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%')))
      .style('font-size', '12px');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'currentColor')
      .text('Impact Factor');

    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (d) => (d.category ? categoryColors[d.category] || '#6366f1' : '#6366f1'))
      .attr('rx', 4)
      .style('cursor', onBarClick ? 'pointer' : 'default')
      .on('click', (event, d) => {
        if (onBarClick) {
          onBarClick(d);
        }
      });

    bars
      .transition()
      .duration(800)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => innerHeight - y(d.value));

    bars.append('title').text((d) => `${d.label}: ${(d.value * 100).toFixed(1)}%`);
  }, [data, height, onBarClick]);

  return (
    <div className="w-full">
      <svg ref={svgRef} width="100%" height={height} className="text-gray-700 dark:text-gray-300" />
    </div>
  );
};
