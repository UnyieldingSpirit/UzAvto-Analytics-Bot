import * as d3 from 'd3';
import { SALE_TYPES } from './constants/saleTypes';

export const renderCustomLineChart = (data, options) => {
    const { container, title, height = 400 } = options;

    const width = container.clientWidth;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };

    // Создаем SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#1f2937')
        .style('border-radius', '0.5rem');

    // Добавляем заголовок
    if (title) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '1.2rem')
            .style('font-weight', 'bold')
            .style('fill', '#f9fafb')
            .text(title);
    }

    // Создаем шкалы
    const x = d3.scaleBand()
        .domain(data.map(d => d.x))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.y) * 1.1]) // добавляем 10% сверху для отступа
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Создаем оси
    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text')
            .style('fill', '#f9fafb')
            .style('font-size', '0.8rem')
            .attr('dy', '0.5em')
            .attr('transform', 'rotate(-25)')
            .attr('text-anchor', 'end'));

    const yAxis = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(',.0f')(d)))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').style('fill', '#f9fafb'))
        .call(g => g.selectAll('.tick line')
            .attr('x2', width - margin.left - margin.right)
            .attr('stroke-opacity', 0.1));

    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);

    // Создаем линию
    const line = d3.line()
        .x(d => x(d.x) + x.bandwidth() / 2)
        .y(d => y(d.y))
        .curve(d3.curveMonotoneX);

    // Добавляем фоновый градиент для линии
    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');

    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color);

    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', focusCategory === 'all' ? '#8b5cf6' : SALE_TYPES[focusCategory.toUpperCase()].color);

    // Добавляем линию
    const path = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'url(#line-gradient)')
        .attr('stroke-width', 3)
        .attr('d', line);

    // Добавляем анимацию линии
    const totalLength = path.node().getTotalLength();

    path
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .attr('stroke-dashoffset', 0);

    // Добавляем точки
    svg.selectAll('.data-point')
        .data(data)
        .join('circle')
        .attr('class', 'data-point')
        .attr('cx', d => x(d.x) + x.bandwidth() / 2)
        .attr('cy', d => y(d.y))
        .attr('r', 0)
        .attr('fill', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color)
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .transition()
        .delay((_, i) => i * 100 + 500)
        .duration(300)
        .attr('r', 5);

    // Добавляем подписи значений над точками
    svg.selectAll('.data-label')
        .data(data)
        .join('text')
        .attr('class', 'data-label')
        .attr('x', d => x(d.x) + x.bandwidth() / 2)
        .attr('y', d => y(d.y) - 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb')
        .style('opacity', 0)
        .text(d => d3.format(',.0f')(d.y))
        .transition()
        .delay((_, i) => i * 100 + 800)
        .duration(300)
        .style('opacity', 1);

    // Добавляем области для интерактивности
    svg.selectAll('.hover-area')
        .data(data)
        .join('rect')
        .attr('class', 'hover-area')
        .attr('x', d => x(d.x))
        .attr('y', margin.top)
        .attr('width', x.bandwidth())
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', 'transparent')
        .on('mouseover', function (event, d) {
            // Увеличиваем соответствующую точку
            svg.selectAll('.data-point')
                .filter(point => point.x === d.x)
                .transition()
                .duration(100)
                .attr('r', 8)
                .attr('fill', focusCategory === 'all' ? '#60a5fa' : SALE_TYPES[focusCategory.toUpperCase()].color);

            // Делаем подпись более заметной
            svg.selectAll('.data-label')
                .filter(point => point.x === d.x)
                .transition()
                .duration(100)
                .style('font-size', '0.9rem')
                .style('font-weight', 'bold');

            // Добавляем вертикальную направляющую
            svg.append('line')
                .attr('class', 'guide-line')
                .attr('x1', x(d.x) + x.bandwidth() / 2)
                .attr('x2', x(d.x) + x.bandwidth() / 2)
                .attr('y1', y(d.y))
                .attr('y2', height - margin.bottom)
                .attr('stroke', '#f9fafb')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('opacity', 0.6);
        })
        .on('mouseout', function (event, d) {
            // Возвращаем точку к нормальному размеру
            svg.selectAll('.data-point')
                .filter(point => point.x === d.x)
                .transition()
                .duration(100)
                .attr('r', 5)
                .attr('fill', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color);

            // Возвращаем подпись к нормальному виду
            svg.selectAll('.data-label')
                .filter(point => point.x === d.x)
                .transition()
                .duration(100)
                .style('font-size', '0.7rem')
                .style('font-weight', 'normal');

            // Удаляем направляющую
            svg.selectAll('.guide-line').remove();
        });

    // Добавляем фоновую сетку
    svg.selectAll('.grid-line')
        .data(y.ticks(5))
        .join('line')
        .attr('class', 'grid-line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke', '#374151')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '3,3')
        .style('opacity', 0.5);

    // Добавляем тренд (скользящее среднее)
    if (data.length > 2) {
        // Расчет скользящего среднего
        const movingAverage = [];
        const windowSize = 3; // Размер окна для скользящего среднего

        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;

            for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
                sum += data[j].y;
                count++;
            }

            movingAverage.push({
                x: data[i].x,
                y: sum / count
            });
        }

        // Создаем линию для тренда
        const trendLine = d3.line()
            .x(d => x(d.x) + x.bandwidth() / 2)
            .y(d => y(d.y))
            .curve(d3.curveMonotoneX);

        // Добавляем линию тренда
        svg.append('path')
            .datum(movingAverage)
            .attr('fill', 'none')
            .attr('stroke', '#10b981') // Зеленый цвет для тренда
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', trendLine)
            .style('opacity', 0)
            .transition()
            .delay(2000)
            .duration(500)
            .style('opacity', 0.8);

        // Добавляем легенду
        const legend = svg.append('g')
            .attr('transform', `translate(${width - margin.right - 150}, ${margin.top + 10})`);

        // Легенда для основной линии
        const lineLegend = legend.append('g');

        lineLegend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', 'url(#line-gradient)')
            .attr('stroke-width', 3);

        lineLegend.append('text')
            .attr('x', 30)
            .attr('y', 4)
            .text('Фактические продажи')
            .style('font-size', '0.8rem')
            .style('fill', '#f9fafb');

        // Легенда для тренда
        const trendLegend = legend.append('g')
            .attr('transform', 'translate(0, 20)');

        trendLegend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');

        trendLegend.append('text')
            .attr('x', 30)
            .attr('y', 4)
            .text('Тренд (скользящее среднее)')
            .style('font-size', '0.8rem')
            .style('fill', '#f9fafb');
    }
};