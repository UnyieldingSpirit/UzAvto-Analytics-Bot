// src/shared/layout/EnhancedMainWrapper.tsx
'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TelegramWebAppInitializer from './TelegramWebAppInitializer';
import ResponsiveNav from './ResponsiveNav';
import ContentReadyLoader from './ContentReadyLoader';
import { setupAxiosInterceptors } from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/theme';

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
  const router = useRouter();
  const { checkAuth } = useAuth();
  const { initializeTheme, mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  // Проверяем, находимся ли мы на странице авторизации
  const isAuthPage = pathname === '/auth';
  // Проверяем, находимся ли мы на странице онбординга
  const isOnboardingPage = pathname === '/onboarding';

  // Настройка axios перехватчиков при монтировании
useEffect(() => {
    setupAxiosInterceptors(() => {
        router.push('/auth');
    });
}, [router]);

  // Проверка авторизации
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      // Если нет токена или не авторизован, и мы не на странице авторизации или онбординга
      if ((!token || !isAuthenticated) && !isAuthPage && !isOnboardingPage) {
        router.push('/auth');
      }
    }
  }, [pathname, router, isAuthPage, isOnboardingPage]);

  // Инициализация темы
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

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
    
    // Проверка размера экрана для адаптивности
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      if (!isMobile && isMobileSize) {
        setIsMobile(true);
      } else if (isMobile && !isMobileSize) {
        setIsMobile(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [isMobile]);

  // Отслеживаем изменение пути для сброса скролла
  useEffect(() => {
    if (prevPath !== pathname) {
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

  // Для страницы авторизации не показываем боковую панель
  if (isAuthPage) {
    return (
      <>
        <ContentReadyLoader />
        <div className="flex h-screen w-screen overflow-hidden">
          <div 
            ref={mainRef}
            className={`flex-grow h-full relative ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
          >
            <TelegramWebAppInitializer />
            
            <div 
              ref={contentRef}
              className={`content-scroll-container h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} overflow-auto`}
            >
              {children}
            </div>
          </div>
        </div>
        
        <style jsx global>{`
          /* Стили для скролла и темы */
          :root {
            color-scheme: light dark;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100%;
            width: 100%;
          }
          
          body {
            background-color: ${isDark ? '#111827' : '#f9fafb'};
            color: ${isDark ? 'white' : '#1f2937'};
          }
          
          .content-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .content-scroll-container::-webkit-scrollbar {
            display: none;
          }
          
          .scrollable-content, .page-scrollable {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            max-height: 100%;
          }
          
          .tg-expanded .fixed-navigation {
            bottom: env(safe-area-inset-bottom, 0px) !important;
          }
        `}</style>
      </>
    );
  }

  // Полноэкранный режим для страницы онбординга
  if (isOnboardingPage) {
    return (
      <>
        <ContentReadyLoader />
        <div className="flex h-screen w-screen overflow-hidden">
          <div 
            ref={mainRef}
            className={`flex-grow h-full relative ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
          >
            <TelegramWebAppInitializer />
            
            <div 
              ref={contentRef}
              className={`content-scroll-container h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} overflow-auto`}
            >
              {children}
            </div>
          </div>
        </div>
        
        <style jsx global>{`
          /* Стили для скролла и темы */
          :root {
            color-scheme: light dark;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100%;
            width: 100%;
          }
          
          body {
            background-color: ${isDark ? '#111827' : '#f9fafb'};
            color: ${isDark ? 'white' : '#1f2937'};
          }
          
          .content-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .content-scroll-container::-webkit-scrollbar {
            display: none;
          }
          
          .scrollable-content, .page-scrollable {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            max-height: 100%;
          }
          
          .tg-expanded .fixed-navigation {
            bottom: env(safe-area-inset-bottom, 0px) !important;
          }
        `}</style>
      </>
    );
  }

  // Стандартный режим с боковой панелью
  return (
    <>
      <ContentReadyLoader />
      
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="h-full">
          <ResponsiveNav />
        </div>
        <div 
          ref={mainRef}
          className={`flex-grow h-full relative ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        >
          <TelegramWebAppInitializer />
          
          <div 
            ref={contentRef}
            className={`content-scroll-container h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} overflow-auto`}
          >
            {children}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        /* Устанавливаем цвета темы для всего приложения */
        :root {
          color-scheme: light dark;
        }
        
        /* Убираем стандартные отступы и поля */
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }
        
        /* Стили для светлой темы */
        body {
          background-color: ${isDark ? '#111827' : '#f9fafb'};
          color: ${isDark ? 'white' : '#1f2937'};
          transition: background-color 0.3s ease, color 0.3s ease;
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