// src/app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

export default function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  
  const { ChevronLeft, ChevronRight, X } = LucideIcons;
  
  const slides = [
    {
      id: 1,
      title: "Обзорная панель",
      description: "Просматривайте все ключевые показатели в одном месте",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/'
    },
    {
      id: 2,
      title: "Аналитика продаж",
      description: "Детальная статистика по всем продажам компании",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/statistics'
    },
    {
      id: 3,
      title: "Мониторинг продаж",
      description: "Отслеживайте динамику продаж в реальном времени",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/sales-dashboard'
    },
    {
      id: 4,
      title: "Отслеживание моделей",
      description: "Анализ эффективности различных моделей автомобилей",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/model-tracking'
    },
    {
      id: 5,
      title: "Бизнес-аналитика",
      description: "Комплексный анализ всех бизнес-процессов",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/analytics-dashboard'
    },
    {
      id: 6,
      title: "Производство",
      description: "Мониторинг производственных процессов и загруженности",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/auto-market'
    },
    {
      id: 7,
      title: "Финансовая аналитика",
      description: "Подробный анализ финансовых показателей",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/financial-analytics'
    },
    {
      id: 8,
      title: "Контракты",
      description: "Управление и анализ контрактов на автомобили",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/car-contracts'
    },
    {
      id: 9,
      title: "Рассрочки",
      description: "Информация о договорах рассрочки и платежах",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/installment-dashboard'
    },
    {
      id: 10,
      title: "Управление складом",
      description: "Система управления складскими запасами",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/warehouse-dashboard'
    },
    {
      id: 11,
      title: "Аналитика склада",
      description: "Статистика и анализ складских операций",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/warehouse-analytics'
    },
    {
      id: 12,
      title: "Автомобильный склад",
      description: "Мониторинг наличия автомобилей на складах",
      imageUrl: 'https://i.imgur.com/vjFpKay.png', // Замените на соответствующее фото
      path: '/car-warehouse'
    },
  ];
  
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  // Обработка свайпов для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Если свайп влево - следующий слайд
    if (diff > 50) {
      handleNext();
    } 
    // Если свайп вправо - предыдущий слайд
    else if (diff < -50) {
      handlePrev();
    }
  };
  
  // Обработка клавиш для навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);
  
  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];
  
  return (
    <div 
      className="h-screen w-screen overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Полноэкранные фоновые изображения с анимацией */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-cover absolute inset-0"
          />
          
          {/* Градиентный оверлей для лучшей читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </motion.div>
      </AnimatePresence>
      
      {/* Заголовок и описание текущего слайда */}
      <div className="absolute bottom-48 left-0 right-0 px-6 z-10">
        <div className="max-w-md mx-auto text-center">
          <motion.h2
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {currentSlide.title}
          </motion.h2>
          <motion.p
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-white/80 text-sm"
          >
            {currentSlide.description}
          </motion.p>
        </div>
      </div>
      
      {/* Верхний правый угол - кнопки авторизации и пропуска */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
        {!isLastSlide && (
          <>
            <Link href="/auth">
              <motion.button
                className="px-5 py-2.5 rounded-full text-white font-medium bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Авторизоваться
              </motion.button>
            </Link>
            <Link href="/auth">
              <motion.button
                className="px-5 py-2.5 rounded-full text-white font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Пропустить
              </motion.button>
            </Link>
          </>
        )}
      </div>
      
      {/* Индикатор прогресса */}
      <div className="absolute bottom-32 left-0 right-0 px-6 z-10">
        <div className="max-w-md mx-auto bg-white/20 backdrop-blur-sm rounded-full h-1.5">
          <div 
            className="h-1.5 rounded-full transition-all duration-300 ease-out bg-white"
            style={{ 
              width: `${((currentIndex + 1) / slides.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
      
      {/* Нижний правый угол - кнопки навигации */}
      <div className="absolute bottom-10 right-6 z-10">
        {isLastSlide ? (
          <Link href="/auth">
            <motion.button
              className="px-8 py-3 rounded-full text-white font-medium bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Авторизоваться
            </motion.button>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:bg-black/50'}`}
              whileHover={currentIndex !== 0 ? { scale: 1.1 } : undefined}
              whileTap={currentIndex !== 0 ? { scale: 0.95 } : undefined}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
            
            <motion.button
              onClick={handleNext}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm hover:bg-black/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        )}
      </div>
      
      {/* Точечные индикаторы */}
      <div className="absolute bottom-10 left-6 z-10">
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ 
                backgroundColor: index === currentIndex 
                  ? 'white' 
                  : 'rgba(255, 255, 255, 0.4)',
                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}