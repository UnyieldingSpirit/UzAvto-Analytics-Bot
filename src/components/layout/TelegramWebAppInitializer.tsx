// src/components/layout/TelegramWebAppInitializer.tsx
'use client';

import { JSX, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function TelegramWebAppInitializer(): JSX.Element | null {
  const pathname = usePathname();
  const router = useRouter();
  const tgInitialized = useRef(false);
  const handleBackRef = useRef(() => router.back());
  const viewportSetterRef = useRef<(() => void) | null>(null);

  // Основная инициализация - выполняется один раз
  useEffect(() => {
    if (!tgInitialized.current && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        
        // Определение мобильной платформы по User-Agent
        const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        
        console.log('User-Agent:', navigator.userAgent);
        console.log('Определена платформа:', isMobileDevice ? 'Мобильная' : 'Десктоп');
        
        // Сообщаем Telegram, что приложение готово
        if (typeof tg.ready === 'function') {
          tg.ready();
        }

        // Общие настройки (применяются всегда)
        if (typeof tg.enableClosingConfirmation === 'function') {
          tg.enableClosingConfirmation(true);
        }
        
        // Полноэкранный режим ТОЛЬКО для мобильных устройств
        if (isMobileDevice && typeof tg.expand === 'function') {
          tg.expand();
        }

        // Настройка кнопки "Назад"
        if (tg.BackButton && typeof tg.BackButton.onClick === 'function') {
          tg.BackButton.onClick(handleBackRef.current);
          
          // Скрываем на главной, показываем на других страницах
          if (pathname === '/') {
            if (typeof tg.BackButton.hide === 'function') {
              tg.BackButton.hide();
            }
          } else {
            if (typeof tg.BackButton.show === 'function') {
              tg.BackButton.show();
            }
          }
        }

        // Мобильно-специфичные методы
        if (isMobileDevice) {
          console.log('Активация мобильных функций');

          // Отключение вертикальных свайпов
          if (typeof tg.disableClosingConfirmation === 'function') {
            tg.disableClosingConfirmation();
          }
          
          // Настройка viewport для мобильных устройств
          const setViewportHeight = () => {
            if (typeof tg.viewportStableHeight === 'number') {
              document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportStableHeight}px`);
              document.documentElement.style.setProperty('--vh', `${tg.viewportStableHeight * 0.01}px`);
              document.documentElement.style.minHeight = `${tg.viewportStableHeight}px`;
              document.body.style.minHeight = `${tg.viewportStableHeight}px`;
            }
          };

          viewportSetterRef.current = setViewportHeight;
          
          setViewportHeight();
          window.addEventListener('resize', setViewportHeight);
        } else {
          console.log('Мобильные функции не активированы (десктопная платформа)');
        }

        console.log('Telegram WebApp инициализирован');
        tgInitialized.current = true;
      } catch (error) {
        console.error("Ошибка при инициализации Telegram WebApp:", error);
      }
    }
  }, [pathname, router]);

  // Эффект для управления кнопкой "Назад" при изменении маршрута
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      try {
        const backButton = window.Telegram.WebApp.BackButton;
        
        if (pathname === '/') {
          if (typeof backButton.hide === 'function') {
            backButton.hide();
          }
        } else {
          if (typeof backButton.show === 'function') {
            backButton.show();
          }
        }
      } catch (error) {
        console.error("Ошибка при обработке BackButton:", error);
      }
    }
  }, [pathname]);

  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      try {
        // Удаляем обработчик изменения размера, если он был добавлен
        if (viewportSetterRef.current) {
          window.removeEventListener('resize', viewportSetterRef.current);
        }
        
        // Отключаем обработчик кнопки "Назад"
        const backButton = window.Telegram?.WebApp?.BackButton;
        if (backButton && typeof backButton.offClick === 'function') {
          backButton.offClick();
        }
      } catch (error) {
        console.error("Ошибка при очистке ресурсов:", error);
      }
    };
  }, []);

  return null;
}