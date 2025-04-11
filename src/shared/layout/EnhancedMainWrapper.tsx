/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TelegramWebAppInitializer from './TelegramWebAppInitializer';
import ResponsiveNav from './ResponsiveNav';
import ContentReadyLoader from './ContentReadyLoader';

interface EnhancedMainWrapperProps {
  children: ReactNode;
}

export default function EnhancedMainWrapper({ children }: EnhancedMainWrapperProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [prevPath, setPrevPath] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const pathname = usePathname();

  // Определение типа устройства
  useEffect(() => {
    const detectDeviceType = () => {
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const iosUA = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      setIsMobile(mobileUA);
      setIsIOS(iosUA);
    };
    
    detectDeviceType();
    
    // Также проверяем размер экрана для адаптивности
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      // Если UserAgent не определил как мобильное, но ширина экрана мобильная
      if (!isMobile && isMobileSize) {
        setIsMobile(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Принудительное применение темной темы
    document.documentElement.classList.add('dark');
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [isMobile]);

  // Отслеживаем изменение пути для сброса скролла
  useEffect(() => {
    if (prevPath !== pathname) {
      // Сбрасываем скролл при смене страницы
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
    
    setPrevPath(pathname);
  }, [pathname, prevPath]);

  // Функция для прокрутки вверх
  const forceScrollToTop = () => {
    try {
      // Скроллим все потенциальные контейнеры
      document.querySelectorAll('.scrollable-content, .page-container, [class*="scroll"], [style*="overflow"]')
        .forEach(el => {
          if (el instanceof HTMLElement) {
            el.scrollTop = 0;
            
            try {
              el.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant'
              });
            } catch (e) {
              el.scrollTo(0, 0);
            }
          }
        });
      
      // Пробуем скроллить window
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (error) {
      console.error('Ошибка при прокрутке вверх:', error);
    }
  };

  // При изменении маршрута выполняем прокрутку вверх
  useEffect(() => {
    forceScrollToTop();
  }, [pathname]);

  // Получаем отступы в зависимости от типа устройства
  const getPaddings = () => {
    // Константы для отступов
    const MOBILE_TOP_PADDING = '5rem';                      // Отступ сверху для мобильных
    const MOBILE_BOTTOM_PADDING = isIOS ? '6rem' : '5rem';  // Увеличенный отступ снизу для iOS
    const DESKTOP_TOP_PADDING = '1rem';                     // Отступ сверху для десктопа
    const DESKTOP_LEFT_PADDING = '16rem';                   // Отступ слева для сайдбара на десктопе
    const DESKTOP_BOTTOM_PADDING = '1rem';                  // Отступ снизу для десктопа
    
    // Учет safe-area-inset для iOS
    const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';
    
    return {
      paddingTop: isMobile ? MOBILE_TOP_PADDING : DESKTOP_TOP_PADDING,
      paddingBottom: isMobile 
        ? `calc(${MOBILE_BOTTOM_PADDING} + ${safeAreaBottom})`
        : DESKTOP_BOTTOM_PADDING,
      paddingLeft: isMobile ? '16px' : `calc(${DESKTOP_LEFT_PADDING} + 16px)`,  // Добавляем место для сайдбара на десктопе
      paddingRight: '16px',
      transition: 'padding 0.3s ease'
    };
  };
  
  // Получаем стили для контента
  const contentPaddings = getPaddings();

  return (
    <>
      {/* Лоадер, исчезающий при фактической готовности контента */}
      <ContentReadyLoader />
      
      {/* Добавляем ResponsiveNav перед основным содержимым */}
      <ResponsiveNav />
      
      {/* Неподвижная основная оболочка */}
      <div 
        ref={mainRef}
        className="main-content relative bg-white dark:bg-gray-900"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 40,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TelegramWebAppInitializer />
        
        {/* Скроллируемый контейнер для содержимого */}
        <div 
          ref={contentRef}
          className="content-scroll-container bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          style={{ 
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            ...contentPaddings
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Стили для скролла и темы */}
      <style jsx global>{`
        /* Устанавливаем цвета темы для всего приложения */
        :root {
          color-scheme: light dark;
        }
        
        /* Стили для светлой темы */
        body {
          background-color: white;
          color: #1f2937;
        }
        
        /* Стили для темной темы */
        body.dark,
        .dark body,
        html.dark,
        .dark html {
          background-color: #111827;
          color: white;
        }
        
        /* Скрыть скроллбар, но оставить функциональность */
        .content-scroll-container {
          -ms-overflow-style: none;  /* IE и Edge */
          scrollbar-width: none;     /* Firefox */
        }
        
        .content-scroll-container::-webkit-scrollbar {
          display: none;             /* Chrome, Safari и Opera */
        }
        
        /* Стили для скроллируемых элементов внутри страниц */
        .scrollable-content, .page-scrollable {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          max-height: 100%;
        }
        
        /* Стили для безопасного отображения в Telegram Mini App */
        .tg-expanded .fixed-navigation {
          bottom: env(safe-area-inset-bottom, 0px) !important;
        }
      `}</style>
    </>
  );
}