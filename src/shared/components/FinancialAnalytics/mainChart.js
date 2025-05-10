import * as d3 from 'd3';
import { SALE_TYPES } from './constants/saleTypes';

export const renderMainChart = () => {
    if (!mainChartRef.current) return;

    // Очистка контейнера
    mainChartRef.current.innerHTML = '';

    // Подготовка данных в зависимости от представления
    let chartData;

    if (displayMode === 'yearly') {
        // Для годового представления - суммарное значение по месяцам
        chartData = filteredData.map(month => ({
            id: month.month,
            label: month.name,
            value: focusCategory === 'all' ? month.total : month[focusCategory],
            month: month,
            color: focusCategory === 'all' ? undefined : SALE_TYPES[focusCategory.toUpperCase()].color
        }));
    } else if (displayMode === 'compare') {
        // Для сравнения - данные сгруппированные по месяцам с разбивкой по годам
        const monthGroups = {};

        filteredData.forEach(month => {
            if (!monthGroups[month.month]) {
                monthGroups[month.month] = {
                    month: month.month,
                    name: month.name,
                    years: {}
                };
            }

            monthGroups[month.month].years[month.year] = focusCategory === 'all' ?
                month.total : month[focusCategory];
        });

        // Конвертируем в формат для stacked bar chart
        chartData = Object.values(monthGroups).map(group => {
            return {
                category: group.name,
                values: Object.entries(group.years).map(([year, value]) => ({
                    label: year.toString(),
                    value
                }))
            };
        }).sort((a, b) => {
            // Сортируем по номеру месяца
            const monthA = MONTHS.indexOf(a.category);
            const monthB = MONTHS.indexOf(b.category);
            return monthA - monthB;
        });
    } else {
        // Для периода - группировка по месяцам и годам
        chartData = filteredData.map(month => ({
            id: `${month.year}-${month.month}`,
            label: month.label || `${month.name} ${month.year}`,
            value: focusCategory === 'all' ? month.total : month[focusCategory],
            month: month,
            color: focusCategory === 'all' ? undefined : SALE_TYPES[focusCategory.toUpperCase()].color
        }));
    }

    // Настройки графика
    let chartTitle;
    if (displayMode === 'yearly') {
        chartTitle = `Финансовые показатели за ${selectedYears[0]} год` +
            (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
    } else if (displayMode === 'compare') {
        chartTitle = `Сравнение продаж по месяцам ${selectedYears.join(', ')}` +
            (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
    } else {
        chartTitle = `Финансовые показатели за выбранный период` +
            (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
    }

    const chartOptions = {
        container: mainChartRef.current,
        title: chartTitle,
        height: 400,
        colors: focusCategory === 'all' ? d3.schemeBlues[9].slice(3) : [SALE_TYPES[focusCategory.toUpperCase()].color],
        animated: true
    };

    // Отрисовка в зависимости от выбранного типа графика
    if (viewType === 'bar') {
        if (displayMode === 'compare') {
            // Подготовка данных для сравнения двух лет в виде сгруппированных столбцов
            const monthGroups = [];

            // Получаем уникальные месяцы из данных
            const allMonths = [...new Set(filteredData.map(item => item.month))].sort((a, b) => a - b);

            // Для каждого месяца создаем группу с данными обоих годов
            allMonths.forEach(monthNum => {
                const monthName = MONTHS[monthNum - 1];
                const monthData = {
                    month: monthNum,
                    name: monthName,
                    years: {}
                };

                // Собираем данные для каждого года в этом месяце
                selectedYears.forEach(year => {
                    const yearData = filteredData.find(
                        item => item.month === monthNum && item.year === year
                    );

                    if (yearData) {
                        monthData.years[year] = focusCategory === 'all' ?
                            yearData.total : yearData[focusCategory];
                    } else {
                        monthData.years[year] = 0;
                    }
                });

                monthGroups.push(monthData);
            });

            // Создаем данные для D3
            const chartConfig = {
                container: mainChartRef.current,
                title: `Сравнение продаж по месяцам ${selectedYears.join(' и ')}` +
                    (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : ''),
                height: 400,
                animated: true
            };

            // Создаем кастомную группированную диаграмму с месяцами и годами
            renderGroupedBarChart(monthGroups, chartConfig);
        } else {
            D3Visualizer.createBarChart(chartData, chartOptions);
        }
    } else if (viewType === 'line' || viewType === 'area') {
        if (displayMode === 'compare') {
            renderMultiLineChart(); // Добавьте этот метод, если он не реализован
        } else {
            const lineData = chartData.map(item => ({
                x: item.label,
                y: item.value
            }));

            if (viewType === 'line') {
                // Ручная отрисовка линейного графика
                renderCustomLineChart(lineData, chartOptions);
            } else {
                D3Visualizer.createAreaChart(lineData, {
                    ...chartOptions,
                    colors: [focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color]
                });
            }
        }
    } else if (viewType === 'stacked') {
        const stackedData = filteredData.map(month => {
            return {
                category: displayMode === 'yearly' ? month.name : (month.label || `${month.name} ${month.year}`),
                values: [
                    { label: SALE_TYPES.RETAIL.name, value: month.retail },
                    { label: SALE_TYPES.WHOLESALE.name, value: month.wholesale },
                    { label: SALE_TYPES.PROMO.name, value: month.promo }
                ]
            };
        });

        D3Visualizer.createStackedBarChart(stackedData, {
            ...chartOptions,
            title: 'Структура продаж по месяцам',
            colors: [SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color]
        });
    } else if (viewType === 'radar') {
        renderRadarChart();
    } else if (viewType === 'mixed') {
        renderMixedChart();
    }
};