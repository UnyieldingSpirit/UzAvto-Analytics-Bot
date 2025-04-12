import * as d3 from 'd3';


export class D3Visualizer {
    // Default themes and colors
     static darkTheme = {
        background: '#1f2937',
        text: '#f9fafb',
        axis: '#6b7280',
        grid: '#374151',
        tooltip: '#111827',
        tooltipText: '#f9fafb'
    };

     static lightTheme = {
        background: '#f9fafb',
        text: '#1f2937',
        axis: '#6b7280',
        grid: '#e5e7eb',
        tooltip: '#ffffff',
        tooltipText: '#1f2937'
    };

     static defaultColors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
        '#10b981', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'
    ];

     static getTheme(theme = 'dark') {
        return theme === 'dark' ? this.darkTheme : this.lightTheme;
    }

    static createBarChart(data, options) {
        const {
            container,
            width = container.clientWidth,
            height = 400,
            margin = { top: 30, right: 30, bottom: 60, left: 60 },
            title,
            onClick,
            animated = true,
            showLabels = true,
            theme = 'dark'
        } = options;

        // Clear container
        container.innerHTML = '';
        const themeColors = this.getTheme(theme);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', themeColors.background)
            .style('border-radius', '0.5rem');

        // Add title if provided
        if (title) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '1.2rem')
                .style('font-weight', 'bold')
                .style('fill', themeColors.text)
                .text(title);
        }

        // Create scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([margin.left, width - margin.right])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Create axes
        const xAxis = (g) => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text')
                .style('fill', themeColors.text)
                .style('font-size', '0.8rem')
                .attr('dy', '0.5em')
                .attr('transform', 'rotate(-25)')
                .attr('text-anchor', 'end'));

        const yAxis = (g) => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text').style('fill', themeColors.text))
            .call((g) => g.selectAll('.tick line')
                .attr('x2', width - margin.left - margin.right)
                .attr('stroke-opacity', 0.1));

        // Add axes to the SVG
        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // Create tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background-color', themeColors.tooltip)
            .style('color', themeColors.tooltipText)
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10);

        // Add bars
        const colorScale = options.colors
            ? (typeof options.colors === 'function'
                ? options.colors
                : d3.scaleOrdinal()
                    .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                    .range(options.colors))
            : d3.scaleOrdinal()
                .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                .range(this.defaultColors);

        const bars = svg.append('g')
            .selectAll('rect')
            .data(data)
            .join('rect')
            .attr('x', d => x(d.label))
            .attr('width', x.bandwidth())
            .attr('fill', (d, i) => typeof colorScale === 'function' ? colorScale(d, i) : (d.color || colorScale(d.id.toString())))
            .attr('rx', 4)
            .attr('ry', 4)
            .style('cursor', onClick ? 'pointer' : 'default')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.8);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()}`)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (onClick) onClick(d);
            });

        // Animation
        if (animated) {
            bars.attr('y', height - margin.bottom)
                .attr('height', 0)
                .transition()
                .duration(800)
                .delay((d, i) => i * 50)
                .attr('y', d => y(d.value))
                .attr('height', d => height - margin.bottom - y(d.value))
                .attr('opacity', 0.9);
        } else {
            bars.attr('y', d => y(d.value))
                .attr('height', d => height - margin.bottom - y(d.value))
                .attr('opacity', 0.9);
        }

        // Add value labels
        if (showLabels) {
            svg.append('g')
                .selectAll('text')
                .data(data)
                .join('text')
                .attr('x', d => (x(d.label)) + x.bandwidth() / 2)
                .attr('y', d => y(d.value) - 5)
                .attr('text-anchor', 'middle')
                .style('fill', themeColors.text)
                .style('font-size', '0.8rem')
                .style('opacity', 0)
                .text(d => d.value)
                .transition()
                .duration(1000)
                .delay((d, i) => i * 50 + 800)
                .style('opacity', 1);
        }

        return svg.node();
    }

    static createPieChart(data, options) {
        const {
            container,
            width = container.clientWidth,
            height = 400,
            margin = { top: 30, right: 30, bottom: 30, left: 30 },
            title,
            onClick,
            animated = true,
            showLabels = true,
            theme = 'dark',
            legendPosition = 'right'
        } = options;

        // Clear container
        container.innerHTML = '';
        const themeColors = this.getTheme(theme);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', themeColors.background)
            .style('border-radius', '0.5rem');

        // Add title if provided
        if (title) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '1.2rem')
                .style('font-weight', 'bold')
                .style('fill', themeColors.text)
                .text(title);
        }

        // Calculate total for percentage
        const total = d3.sum(data, d => d.value);

        // Legend dimensions and position
        const legendWidth = 150;
        const legendX = legendPosition === 'right' ? width - legendWidth - margin.right : margin.left;
        const legendY = legendPosition === 'right' ? margin.top : height - 100;

        // Adjust pie chart size and position based on legend
        const pieWidth = legendPosition === 'right' ? width - legendWidth - margin.left - margin.right : width - margin.left - margin.right;
        const pieHeight = legendPosition === 'bottom' ? height - 100 - margin.top - margin.bottom : height - margin.top - margin.bottom;
        const pieRadius = Math.min(pieWidth, pieHeight) / 2;
        const pieX = legendPosition === 'right' ? margin.left + pieRadius : width / 2;
        const pieY = legendPosition === 'bottom' ? margin.top + pieRadius : height / 2;

        // Create pie generator
        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(pieRadius * 0.3) // Donut hole size
            .outerRadius(pieRadius);

        const hoverArc = d3.arc()
            .innerRadius(pieRadius * 0.3)
            .outerRadius(pieRadius * 1.05);

        // Create tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background-color', themeColors.tooltip)
            .style('color', themeColors.tooltipText)
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10);

        // Create color scale
        const colorScale = options.colors
            ? (typeof options.colors === 'function'
                ? options.colors
                : d3.scaleOrdinal()
                    .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                    .range(options.colors))
            : d3.scaleOrdinal()
                .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                .range(this.defaultColors);

        // Create pie chart group
        const g = svg.append('g')
            .attr('transform', `translate(${pieX},${pieY})`);

        // Add arcs
        const arcs = g.selectAll('path')
            .data(pie(data))
            .join('path')
            .attr('d', d => arc(d))
            .attr('fill', (d, i) => typeof colorScale === 'function' ? colorScale(d.data, i) : (d.data.color || colorScale(d.data.id.toString())))
            .attr('stroke', themeColors.background)
            .attr('stroke-width', 2)
            .style('cursor', onClick ? 'pointer' : 'default')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', hoverArc);

                const percent = ((d.data.value / total) * 100).toFixed(1);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.data.label}</strong><br>${d.data.value.toLocaleString()} (${percent}%)`)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc);
                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (onClick) onClick(d.data);
            });

        // Animation
        if (animated) {
            arcs.each(function (d) {
                const initialArc = { ...d, startAngle: d.endAngle - 0.0001, endAngle: d.endAngle };
                d3.select(this)
                    .attr('d', arc(initialArc))
                    .transition()
                    .duration(800)
                    .delay((d, i) => i * 80)
                    .attrTween('d', function (d) {
                        const interpolate = d3.interpolate(
                            { ...d, startAngle: d.endAngle - 0.0001, endAngle: d.endAngle },
                            d
                        );
                        return function (t) {
                            return arc(interpolate(t));
                        };
                    });
            });
        }

        // Add center text with total
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '1.5rem')
            .style('font-weight', 'bold')
            .style('fill', themeColors.text)
            .text(total.toLocaleString());

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('y', 25)
            .style('font-size', '0.9rem')
            .style('fill', themeColors.text)
            .style('opacity', 0.8)
            .text('Всего');

        // Create legend
        const legend = svg.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        data.forEach((d, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`)
                .style('cursor', onClick ? 'pointer' : 'default')
                .on('mouseover', function () {
                    d3.select(this).style('opacity', 0.8);
                    const arcSelection = arcs.filter((arc, j) => j === i);
                    arcSelection.transition().duration(200).attr('d', hoverArc);

                    const percent = ((d.value / total) * 100).toFixed(1);
                    tooltip.style('opacity', 1)
                        .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()} (${percent}%)`)
                        .style('left', `${event.pageX + 15}px`)
                        .style('top', `${event.pageY - 28}px`);
                })
                .on('mouseout', function () {
                    d3.select(this).style('opacity', 1);
                    arcs.transition().duration(200).attr('d', arc);
                    tooltip.style('opacity', 0);
                })
                .on('click', () => {
                    if (onClick) onClick(d);
                });

            // Add colored rectangle
            legendRow.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('rx', 3)
                .attr('fill', typeof colorScale === 'function' ? colorScale(d, i) : (d.color || colorScale(d.id.toString())));

            // Add text
            legendRow.append('text')
                .attr('x', 25)
                .attr('y', 12)
                .text(d.label)
                .style('font-size', '0.8rem')
                .style('fill', themeColors.text);

            // Add percentage
            const percent = ((d.value / total) * 100).toFixed(1);
            legendRow.append('text')
                .attr('x', 25)
                .attr('y', 25)
                .text(`${percent}% (${d.value})`)
                .style('font-size', '0.7rem')
                .style('fill', themeColors.text)
                .style('opacity', 0.7);
        });

        return svg.node();
    }

    static createStackedBarChart(data, options) {
        const {
            container,
            width = container.clientWidth,
            height = 400,
            margin = { top: 40, right: 30, bottom: 60, left: 60 },
            title,
            onClick,
            animated = true,
            theme = 'dark'
        } = options;

        // Clear container
        container.innerHTML = '';
        const themeColors = this.getTheme(theme);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', themeColors.background)
            .style('border-radius', '0.5rem');

        // Add title if provided
        if (title) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '1.2rem')
                .style('font-weight', 'bold')
                .style('fill', themeColors.text)
                .text(title);
        }

        // Process data for stacking
        const categories = data.map(d => d.category);
        const subgroups = Array.from(new Set(data.flatMap(d => d.values.map(v => v.label))));

        // Transform data for stacking
        const stackData = categories.map(category => {
            const item = { category };
            const categoryData = data.find(d => d.category === category);
            subgroups.forEach(subgroup => {
                const value = categoryData?.values.find(v => v.label === subgroup)?.value || 0;
                item[subgroup] = value;
            });
            return item;
        });

        // Create scales
        const x = d3.scaleBand()
            .domain(categories)
            .range([margin.left, width - margin.right])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackData, d => {
                return d3.sum(subgroups, subgroup => d[subgroup]);
            })])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Create color scale
        const colorScale = options.colors
            ? (typeof options.colors === 'function'
                ? options.colors
                : d3.scaleOrdinal()
                    .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                    .range(options.colors))
            : d3.scaleOrdinal()
                .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                .range(this.defaultColors);

        // Create stack generator
        const stack = d3.stack()
            .keys(subgroups)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(stackData);

        // Create tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background-color', themeColors.tooltip)
            .style('color', themeColors.tooltipText)
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10);

        // Create axes
        const xAxis = (g) => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text')
                .style('fill', themeColors.text)
                .style('font-size', '0.8rem')
                .attr('dy', '0.5em')
                .attr('transform', 'rotate(-25)')
                .attr('text-anchor', 'end'));

        const yAxis = (g) => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text').style('fill', themeColors.text))
            .call((g) => g.selectAll('.tick line')
                .attr('x2', width - margin.left - margin.right)
                .attr('stroke-opacity', 0.1));

        // Add axes to the SVG
        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // Create stacked bars
        svg.append('g')
            .selectAll('g')
            .data(stackedData)
            .join('g')
            .attr('fill', (d, i) => typeof colorScale === 'function' ? colorScale(d, i) : colorScale(d.key))
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('x', d => x(d.data.category))
            .attr('width', x.bandwidth())
            .attr('rx', 2)
            .attr('ry', 2)
            .style('cursor', onClick ? 'pointer' : 'default')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.8);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.data.category} - ${d[0] === 0 ? subgroups[0] : subgroups[d.index]}</strong><br>${(d[1] - d[0]).toLocaleString()}`)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (onClick) onClick({
                    category: d.data.category,
                    subgroup: d[0] === 0 ? subgroups[0] : subgroups[d.index],
                    value: d[1] - d[0]
                });
            });

        // Animation
        if (animated) {
            svg.selectAll('rect')
                .attr('y', height - margin.bottom)
                .attr('height', 0)
                .transition()
                .duration(800)
                .delay((d, i) => i * 20)
                .attr('y', d => y(d[1]))
                .attr('height', d => y(d[0]) - y(d[1]));
        } else {
            svg.selectAll('rect')
                .attr('y', d => y(d[1]))
                .attr('height', d => y(d[0]) - y(d[1]));
        }

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top - 10})`);

        subgroups.forEach((subgroup, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(${i * 120}, 0)`);

            legendItem.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('rx', 2)
                .attr('fill', typeof colorScale === 'function' ? colorScale(null, i) : colorScale(subgroup));

            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .text(subgroup)
                .style('font-size', '0.8rem')
                .style('fill', themeColors.text);
        });

        return svg.node();
    }

    static createAreaChart(data, options) {
        const {
            container,
            width = container.clientWidth,
            height = 400,
            margin = { top: 40, right: 30, bottom: 60, left: 60 },
            title,
            theme = 'dark',
            animated = true,
            colors = ['#3b82f6']
        } = options;

        // Clear container
        container.innerHTML = '';
        const themeColors = this.getTheme(theme);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', themeColors.background)
            .style('border-radius', '0.5rem');

        // Add title if provided
        if (title) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '1.2rem')
                .style('font-weight', 'bold')
                .style('fill', themeColors.text)
                .text(title);
        }

        // Parse dates if needed
        const isDate = data.length > 0 && (data[0].x instanceof Date || typeof data[0].x === 'string');
        const parsedData = isDate ? data.map(d => ({
            x: typeof d.x === 'string' ? new Date(d.x) : d.x,
            y: d.y
        })) : data;

        // Create scales
        const x = isDate
            ? d3.scaleTime()
                .domain(d3.extent(parsedData, d => d.x instanceof Date ? d.x : new Date(d.x)))
                .range([margin.left, width - margin.right])
            : d3.scaleLinear()
                .domain(d3.extent(parsedData, d => +d.x))
                .nice()
                .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(parsedData, d => d.y)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Create axes
        const xAxis = (g) => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(isDate
                ? d3.axisBottom(x).ticks(5).tickFormat(d => d3.timeFormat('%b %Y')(d))
                : d3.axisBottom(x).ticks(5))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text')
                .style('fill', themeColors.text)
                .style('font-size', '0.8rem'));

        const yAxis = (g) => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text').style('fill', themeColors.text))
            .call((g) => g.selectAll('.tick line')
                .attr('x2', width - margin.left - margin.right)
                .attr('stroke-opacity', 0.1));

        // Add axes to the SVG
        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // Create area generator
        const area = d3.area()
            .x(d => x(d.x))
            .y0(y(0))
            .y1(d => y(d.y))
            .curve(d3.curveMonotoneX);

        // Create line generator (for the top of the area)
        const line = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y))
            .curve(d3.curveMonotoneX);

        // Add gradient
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', typeof colors === 'function' ? colors(null, 0) : colors[0])
            .attr('stop-opacity', 0.8);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', typeof colors === 'function' ? colors(null, 0) : colors[0])
            .attr('stop-opacity', 0.1);

        // Add area path
        const areaPath = svg.append('path')
            .datum(parsedData)
            .attr('fill', 'url(#area-gradient)')
            .attr('stroke', 'none')
            .attr('d', area);

        // Add line path
        const linePath = svg.append('path')
            .datum(parsedData)
            .attr('fill', 'none')
            .attr('stroke', typeof colors === 'function' ? colors(null, 0) : colors[0])
            .attr('stroke-width', 2)
            .attr('d', line);

        // Create tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background-color', themeColors.tooltip)
            .style('color', themeColors.tooltipText)
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10);

        // Add invisible overlay for tooltip
        svg.append('rect')
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom)
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mousemove', function (event) {
                const [xPos] = d3.pointer(event, this);
                const xDate = x.invert(xPos + margin.left);

                // Find closest data point
                const bisect = d3.bisector((d) => d.x).left;
                const index = bisect(parsedData, xDate);
                const d0 = parsedData[index - 1];
                const d1 = parsedData[index];
                const d = d0 && d1 ? (xDate - d0.x > d1.x - xDate ? d1 : d0) : (d0 || d1);

                if (d) {
                    const formatDate = isDate ? d3.timeFormat('%b %d, %Y') : (x) => x;
                    tooltip.style('opacity', 1)
                        .html(`<strong>${isDate ? formatDate(d.x) : d.x}</strong><br>${d.y.toLocaleString()}`)
                        .style('left', `${event.pageX + 15}px`)
                        .style('top', `${event.pageY - 28}px`);

                    // Add point at position
                    svg.selectAll('.hover-point').remove();
                    svg.append('circle')
                        .attr('class', 'hover-point')
                        .attr('cx', x(d.x))
                        .attr('cy', y(d.y))
                        .attr('r', 5)
                        .attr('fill', typeof colors === 'function' ? colors(null, 0) : colors[0])
                        .attr('stroke', themeColors.background)
                        .attr('stroke-width', 2);
                }
            })
            .on('mouseleave', function () {
                tooltip.style('opacity', 0);
                svg.selectAll('.hover-point').remove();
            });

        // Animation
        if (animated) {
            const totalLength = linePath.node().getTotalLength();

            linePath
                .attr('stroke-dasharray', totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(1500)
                .attr('stroke-dashoffset', 0);

            areaPath
                .attr('opacity', 0)
                .transition()
                .duration(500)
                .delay(1000)
                .attr('opacity', 1);
        }

        return svg.node();
    }

    static createScatterPlot(data, options) {
        const {
            container,
            width = container.clientWidth,
            height = 400,
            margin = { top: 40, right: 30, bottom: 60, left: 60 },
            title,
            theme = 'dark',
            animated = true,
            onClick
        } = options;

        // Clear container
        container.innerHTML = '';
        const themeColors = this.getTheme(theme);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', themeColors.background)
            .style('border-radius', '0.5rem');

        // Add title if provided
        if (title) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '1.2rem')
                .style('font-weight', 'bold')
                .style('fill', themeColors.text)
                .text(title);
        }

        // Create scales
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x))
            .nice()
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d.y))
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Create size scale if sizes are provided
        const sizeScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.size || 5))
            .range([5, 15]);

        // Create color scale for groups if available
        const groups = Array.from(new Set(data.map(d => d.group || 'default')));
        const colorScale = options.colors
            ? (typeof options.colors === 'function'
                ? options.colors
                : d3.scaleOrdinal()
                    .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                    .range(options.colors))
            : d3.scaleOrdinal()
                .domain(data.map((d, i) => d.id ? d.id.toString() : i.toString()))
                .range(this.defaultColors);

        // Create axes
        const xAxis = (g) => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text').style('fill', themeColors.text));

        const yAxis = (g) => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call((g) => g.select('.domain').remove())
            .call((g) => g.selectAll('text').style('fill', themeColors.text))
            .call((g) => g.selectAll('.tick line')
                .attr('x2', width - margin.left - margin.right)
                .attr('stroke-opacity', 0.1));

        // Add axes to the SVG
        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // Create tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background-color', themeColors.tooltip)
            .style('color', themeColors.tooltipText)
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10);

        // Add points
        const points = svg.append('g')
            .selectAll('circle')
            .data(data)
            .join('circle')
            .attr('cx', d => x(d.x))
            .attr('cy', d => y(d.y))
            .attr('r', d => d.size ? sizeScale(d.size) : 5)
            .attr('fill', d => typeof colorScale === 'function' ? colorScale(d, 0) : colorScale(d.group || 'default'))
            .attr('stroke', themeColors.background)
            .attr('stroke-width', 1)
            .style('cursor', onClick ? 'pointer' : 'default')
            .style('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', 2)
                    .style('opacity', 1);

                tooltip.style('opacity', 1)
                    .html(`<strong>${d.label || `Point (${d.x}, ${d.y})`}</strong><br>
               X: ${d.x}<br>
               Y: ${d.y}${d.group ? `<br>Group: ${d.group}` : ''}${d.size ? `<br>Size: ${d.size}` : ''}`)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('stroke-width', 1)
                    .style('opacity', 0.8);
                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (onClick) onClick(d);
            });

        // Animation
        if (animated) {
            points
                .attr('r', 0)
                .transition()
                .duration(800)
                .delay((d, i) => i * 10)
                .attr('r', d => d.size ? sizeScale(d.size) : 5);
        }

        // Add legend for groups if necessary
        if (groups.length > 1 && groups[0] !== 'default') {
            const legend = svg.append('g')
                .attr('transform', `translate(${margin.left}, ${margin.top - 10})`);

            groups.forEach((group, i) => {
                const legendItem = legend.append('g')
                    .attr('transform', `translate(${i * 120}, 0)`);

                legendItem.append('circle')
                    .attr('r', 6)
                    .attr('fill', typeof colorScale === 'function' ? colorScale(null, i) : colorScale(group));

                legendItem.append('text')
                    .attr('x', 15)
                    .attr('y', 5)
                    .text(group)
                    .style('font-size', '0.8rem')
                    .style('fill', themeColors.text);
            });
        }

        return svg.node();
    }
}