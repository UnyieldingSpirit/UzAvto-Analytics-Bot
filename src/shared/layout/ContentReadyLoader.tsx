// src/components/layout/ContentReadyLoader.tsx
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentReadyLoaderProps {
  isLoading?: boolean; // Внешнее состояние загрузки (опционально)
  setIsLoading?: (loading: boolean) => void; // Функция для обновления состояния (опционально)
}

/**
 * Компонент улучшенного базового лоадера без лишних деталей
 */
export default function ContentReadyLoader({ 
  isLoading: externalLoading, 
  setIsLoading: setExternalLoading 
}: ContentReadyLoaderProps) {
  const pathname = usePathname();
  // Используем внутреннее состояние, если внешнее не предоставлено
  const [internalLoading, setInternalLoading] = useState(true);
  
  // Определяем, какое состояние и функцию обновления использовать
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const setIsLoading = setExternalLoading || setInternalLoading;
  
  useEffect(() => {
    // Если используется внутреннее состояние, настраиваем базовый автоматический таймер
    if (setExternalLoading === undefined) {
      setInternalLoading(true);
      
      // Базовая задержка в 2 секунды, если управление не передано извне
      const baseTimer = setTimeout(() => {
        setInternalLoading(false);
      }, 2000);
      
      return () => {
        clearTimeout(baseTimer);
      };
    }
    // Если используется внешнее состояние, не делаем ничего в этом эффекте
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