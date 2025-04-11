'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { MoonIcon, SunIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { useLanguageStore } from "../store/language";
import { useTelegram } from "../hooks/useTelegram";

// Локализация для страницы
const pageLocalization = {
  ru: {
    title: "Начните с редактирования",
    save: "Сохраните и увидите изменения мгновенно.",
    deploy: "Развернуть сейчас",
    docs: "Наша документация",
    learn: "Обучение",
    examples: "Примеры",
    goto: "Перейти на nextjs.org →"
  },
  en: {
    title: "Get started by editing",
    save: "Save and see your changes instantly.",
    deploy: "Deploy now",
    docs: "Read our docs",
    learn: "Learn",
    examples: "Examples",
    goto: "Go to nextjs.org →"
  },
  uz: {
    title: "Tahrirlashdan boshlang",
    save: "Saqlang va o'zgarishlarni darhol ko'ring.",
    deploy: "Hozir joylash",
    docs: "Hujjatlarimizni o'qing",
    learn: "O'rganish",
    examples: "Misollar",
    goto: "nextjs.org saytiga o'tish →"
  }
};

export default function Home() {
  const { hapticFeedback } = useTelegram();
  const { currentLocale, availableLocales, setLocale } = useLanguageStore();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Определяем тексты для текущего языка
  const t = pageLocalization[currentLocale as keyof typeof pageLocalization] || pageLocalization.en;

  // Проверка монтирования для избежания проблем с SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Функция для переключения темы
  const handleToggleTheme = () => {
    if (hapticFeedback) {
      hapticFeedback('selection');
    }
  };

  // Функция для смены языка
  const handleLanguageChange = (locale: 'ru' | 'en' | 'uz') => {
    setLocale(locale);
    setShowLanguageSelector(false);
    if (hapticFeedback) {
      hapticFeedback('selection');
    }
  };

  // Пока компонент не монтирован, возвращаем null
  if (!mounted) {
    return null;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Кнопки переключения темы и языка */}
      <div className="fixed top-4 right-4 flex space-x-3 z-10">
        {/* Переключатель языка */}
        <div className="relative">
          <button 
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
            aria-label="Изменить язык"
          >
            <div className="flex items-center">
              <LanguageIcon className="h-5 w-5 mr-1" />
              <span className="text-xs uppercase">{currentLocale}</span>
            </div>
          </button>
          
          {/* Выпадающее меню языков */}
          {showLanguageSelector && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 overflow-hidden">
              {Object.entries(availableLocales).map(([locale, label]) => (
                <button
                  key={locale}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentLocale === locale 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleLanguageChange(locale as 'ru' | 'en' | 'uz')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            {t.title}{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            {t.save}
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row"
          
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            {t.deploy}
          <a
          
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.docs}
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"
        
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
            className="dark:invert"
          />
          {t.learn}
        <a
        
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
            className="dark:invert"
          />
          {t.examples}
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
            className="dark:invert"
          />
          {t.goto}
        </a>
      </footer>
    </div>
  );
}