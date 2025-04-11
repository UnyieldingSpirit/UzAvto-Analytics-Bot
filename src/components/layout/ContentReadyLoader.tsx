// src/components/layout/ContentReadyLoader.tsx
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Компонент улучшенного базового лоадера без лишних деталей
 */
export default function ContentReadyLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // При смене маршрута, показываем лоадер
    setIsLoading(true);
    
    // Определяем, какую задержку применить для конкретного маршрута
    const getRouteDelay = (path: string) => {
      // Для страниц с большим количеством компонентов или тяжелой графикой
      if (path.includes('/journal')) {
        return 1000; // 1 секунда дополнительной задержки для страницы журнала
      }
      // Для страниц с графиками и данными
      if (path.includes('/workout') || path.includes('/analytics')) {
        return 800; // 800мс для страниц с графиками
      }
      // Для обычных страниц
      return 600; // 600мс для стандартных страниц
    };
    
    // Используем requestAnimationFrame для проверки, когда контент будет готов
    let checkCount = 0;
    
    const checkContentReady = () => {
      checkCount++; // Инкрементируем счетчик проверок
      
      // Ищем основной контент-контейнер
      const contentContainer = document.querySelector('.content-scroll-container');
      
      // Проверяем, есть ли в контейнере фактический контент
      if (contentContainer && contentContainer.children.length > 0) {
        // Получаем соответствующую задержку для текущего маршрута
        const routeSpecificDelay = getRouteDelay(pathname);
        
        // Добавляем значительную задержку для гарантии завершения рендеринга всех блоков
        setTimeout(() => {
          setIsLoading(false);
        }, routeSpecificDelay);
      } else if (checkCount < 20) { // Ограничиваем количество проверок
        // Если контент еще не готов, проверяем снова через requestAnimationFrame
        requestAnimationFrame(checkContentReady);
      } else {
        // Если после 20 проверок контент все еще не готов, 
        // скрываем лоадер принудительно через 2 секунды
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };
    
    // Запускаем первую проверку в следующем кадре анимации
    requestAnimationFrame(checkContentReady);
    
    // Принудительно скрываем лоадер через 5 секунд (защита от зависания)
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => {
      clearTimeout(safetyTimer);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          className="fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <div className="flex justify-center items-center h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {/* Улучшенный базовый лоадер */}
              <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-primary dark:border-primary-dark"></div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}