// src/components/layout/ContentReadyLoader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentReadyLoaderProps {
  isLoading?: boolean; // Внешнее состояние загрузки (опционально)
  setIsLoading?: (loading: boolean) => void; // Функция для обновления состояния (опционально)
  timeout?: number; // Таймаут автоматического закрытия в мс (опционально)
}

/**
 * Компонент улучшенного базового лоадера без лишних деталей
 */
export default function ContentReadyLoader({ 
  isLoading: externalLoading, 
  setIsLoading: setExternalLoading,
  timeout = 4000 
}: ContentReadyLoaderProps) {
  const pathname = usePathname();
  // Используем внутреннее состояние, если внешнее не предоставлено
  const [internalLoading, setInternalLoading] = useState(true);
  
  // Определяем, какое состояние и функцию обновления использовать
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const setIsLoading = setExternalLoading || setInternalLoading;
  
  // Используем ref для отслеживания таймера и его сброса при необходимости
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Эффект для автоматического закрытия лоадера через определенное время
  useEffect(() => {
    // Если лоадер показан, запускаем таймер для его автоматического закрытия
    if (isLoading) {
      console.log(`⏱️ Запускаем таймер автоматического закрытия лоадера: ${timeout/1000} секунд`);
      
      // Очищаем предыдущий таймер, если он существует
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Устанавливаем новый таймер
      timerRef.current = setTimeout(() => {
        console.log("✅ Автоматическое закрытие лоадера по таймеру");
        setIsLoading(false);
      }, timeout);
    }
    
    // Очистка таймера при размонтировании или изменении состояния
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, setIsLoading, timeout]);
  
  // Эффект для перезапуска внутреннего лоадера при изменении маршрута
  useEffect(() => {
    // Если используется внутреннее состояние, перезапускаем лоадер при смене маршрута
    if (setExternalLoading === undefined) {
      setInternalLoading(true);
      
      // Таймер будет создан в основном эффекте выше
    }
  }, [pathname, setExternalLoading]);

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