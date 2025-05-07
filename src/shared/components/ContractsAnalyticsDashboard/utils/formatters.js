// Функция форматирования чисел для отображения
export const formatNumber = (num) => {
    if (num === undefined || num === null) return '—';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString(); // Убедимся, что возвращается строка
};

// Получаем названия периодов
export const getPeriodLabel = (period) => {
    switch (period) {
        case 'year':
            return 'За год';
        case 'quarter':
            return 'За полгода';
        case 'month':
            return 'За месяц';
        case 'week':
            return 'За неделю';
        case 'custom':
            return 'За выбранный период';
        default:
            return 'За год';
    }
};

// Получаем названия периодов для описания
export const getPeriodDescription = (period, customStartDate, customEndDate) => {
    switch (period) {
        case 'year':
            return 'годовой отчет';
        case 'quarter':
            return 'отчет за полгода';
        case 'month':
            return 'отчет за последний месяц';
        case 'week':
            return 'отчет за последнюю неделю';
        case 'custom':
            if (customStartDate && customEndDate) {
                return `отчет за период ${customStartDate?.toLocaleDateString('ru-RU')} — ${customEndDate.toLocaleDateString('ru-RU')}`;
            }
            return 'отчет за выбранный период';
        default:
            return 'годовой отчет';
    }
};