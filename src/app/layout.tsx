import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import EnhancedMainWrapper from "../shared/layout/EnhancedMainWrapper";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Telegram Mini App",
  description: "Next.js template for Telegram Mini Apps",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    minimumScale: 1,
    userScalable: false,
  },
  other: {
    'user-scalable': '0',
    'apple-mobile-web-app-capable': 'yes',
    'viewport-fit': 'cover',
    'HandheldFriendly': 'true'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="overscroll-none">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="theme-color" content="#f7f7f7" />
        
        {/* Загрузка Telegram Web App скрипта */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        
        {/* Скрипт для предотвращения масштабирования и жестов на мобильных устройствах */}
        <Script
          id="prevent-zoom"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('touchstart', (event) => {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              document.addEventListener('gesturestart', (event) => {
                event.preventDefault();
              }, { passive: false });
            `
          }}
        />
        
        {/* Стили для основного layout */}
        <style>
          {`
            :root {
              --safe-area-inset-top: env(safe-area-inset-top, 0px);
              --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
              --tg-viewport-stable-height: 100vh;
            }
            
            /* Жестко отключаем скролл на html и body */
            html, body {
              overflow: hidden !important;
              height: 100% !important;
              position: fixed !important;
              width: 100% !important;
              touch-action: manipulation !important;
            }
            
            /* Базовые стили для main-content */
            .main-content {
              flex: 1;
              background-color: #f7f7f7;
              position: relative;
              /* Отключаем скролл на основном контейнере */
              overflow: hidden !important;
              min-height: 100vh;
              min-height: var(--tg-viewport-stable-height, 100vh);
              /* Добавляем отступы для полноэкранного режима */
              padding-top: var(--safe-area-inset-top, 0px);
              padding-bottom: calc(var(--safe-area-inset-bottom, 0px) + 100px);
            }
            
            /* Стили для режима Telegram expanded */
            body.tg-expanded .main-content {
              padding-top: var(--safe-area-inset-top, 0px);
              padding-bottom: var(--safe-area-inset-bottom, 0px);
            }
          `}
        </style>
      </head>
      <body
        className={`${inter.variable} antialiased touch-manipulation`}
        style={{ fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}
      >
        <EnhancedMainWrapper>
          {children}
        </EnhancedMainWrapper>
      </body>
    </html>
  );
}