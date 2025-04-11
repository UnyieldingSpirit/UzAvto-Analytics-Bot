"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTelegram } from '../../hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  notification?: number;
  category?: string;
  color?: string;
}

export default function ResponsiveNav() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const { hapticFeedback } = useTelegram();
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Эффекты для обработки событий
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    
    checkMobile();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('resize', checkMobile);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isNavOpen]);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);
  
  const handleNavClick = (path: string) => {
    if (hapticFeedback && path !== pathname) {
      hapticFeedback('selection');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (hapticFeedback) hapticFeedback('impact');
  };

  // Единый источник данных для навигации
  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Панель управления',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      )
    },
    {
      path: '/statistics',
      label: 'Аналитика продаж',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      notification: 5
    },
    {
      path: '/users',
      label: 'Управление сотрудниками',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      path: '/products',
      label: 'Каталог товаров',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
          <path d="M16.5 9.4L7.55 4.24"></path>
          <polyline points="3.29 7 12 12 20.71 7"></polyline>
          <line x1="12" y1="22" x2="12" y2="12"></line>
          <circle cx="18.5" cy="15.5" r="2.5"></circle>
          <path d="M20.27 17.27L22 19"></path>
        </svg>
      ),
      notification: 12
    },
    {
      path: '/orders',
      label: 'Заказы и отгрузки',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      ),
      notification: 3
    },
    {
      path: '/settings',
      label: 'Настройки системы',
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
    {
      path: '/help',
      label: 'Документация и поддержка',
      category: 'utility',
      color: 'rgba(124, 58, 237, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    },
    {
      path: '/backup',
      label: 'Резервное копирование',
      category: 'utility',
      color: 'rgba(6, 182, 212, 0.1)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
          <polyline points="16 16 12 12 8 16"></polyline>
          <line x1="12" y1="12" x2="12" y2="21"></line>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
          <polyline points="16 16 12 12 8 16"></polyline>
        </svg>
      )
    }
  ];

  // Группировка навигационных элементов по категориям
  const mainNavItems = navItems.filter(item => item.category === 'main');
  const utilityNavItems = navItems.filter(item => item.category === 'utility');

  // Компонент для отображения навигационного элемента
  const NavItem = ({ item, index, isMobile = false }: { item: NavItem; index: number; isMobile?: boolean }) => {
    const linkClass = isMobile ? 'mobile-nav-link' : 'nav-link';
    const activeClass = pathname === item.path ? 'active' : '';
    
    return (
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      >
        <Link 
          href={item.path} 
          className={`${linkClass} ${activeClass}`}
          onClick={() => {
            handleNavClick(item.path);
            if (isMobile) setIsNavOpen(false);
          }}
        >
          <div 
            className={isMobile ? "nav-icon-mobile" : "nav-icon-wrapper"} 
            style={item.color ? { background: item.color } : undefined}
          >
            {item.icon}
            {!isMobile && item.notification && (
              <span className="notification-badge">
                {item.notification > 99 ? '99+' : item.notification}
              </span>
            )}
          </div>
          <span>{item.label}</span>
          
          {isMobile && item.notification && (
            <span className="notification-badge-mobile">
              {item.notification > 99 ? '99+' : item.notification}
            </span>
          )}
          
          {!isMobile && pathname === item.path && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex justify-end"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </Link>
      </motion.div>
    );
  };

  // Компонент для отображения информационной сводки
  const InfoSummary = () => (
    <div className="mx-4 mb-6 bg-gray-800/50 rounded-2xl p-4 border border-blue-900/20">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-blue-300 text-sm font-semibold">Статистика системы</h3>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
          <span className="text-xs text-green-400">Активно</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/60 rounded-xl p-3 backdrop-blur">
          <div className="text-gray-400 text-xs mb-1">Активные клиенты</div>
          <div className="text-white text-lg font-bold">4,738</div>
          <div className="text-green-500 text-xs flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            +12.5%
          </div>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-3 backdrop-blur">
          <div className="text-gray-400 text-xs mb-1">Продажи сегодня</div>
          <div className="text-white text-lg font-bold">₽183K</div>
          <div className="text-green-500 text-xs flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            +8.2%
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент для отображения профиля пользователя
  const UserProfile = ({ includeSysInfo = false }) => (
    <div className="px-4 py-4">
      <div className="user-card group">
        <div className="avatar">
          <span>А</span>
          <div className="status-indicator"></div>
        </div>
        <div className="user-info">
          <div className="user-name">Администратор</div>
          <div className="user-status">
            <span className="status-dot"></span>
            Активный сеанс
          </div>
        </div>
        <button className="user-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      
      {includeSysInfo && (
        <div className="mt-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30 text-xs text-gray-400">
          <div className="flex justify-between items-center mb-1.5">
            <span>Версия сервера:</span>
            <span className="text-gray-300">v2.4.13</span>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span>Последнее обновление:</span>
            <span className="text-gray-300">10.04.2025</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Статус системы:</span>
            <span className="text-green-400">Стабильно</span>
          </div>
        </div>
      )}
    </div>
  );

  // Переключатель для темного режима
  const DarkModeToggle = () => (
    <div className="px-4 py-3">
      <button 
        onClick={toggleDarkMode}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 transition-colors hover:bg-gray-700/50"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900 mr-3">
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-300">
            {isDarkMode ? 'Тёмный режим' : 'Светлый режим'}
          </span>
        </div>
        <div className={`w-10 h-5 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-gray-600'} relative transition-colors duration-300`}>
          <motion.div 
            animate={{ x: isDarkMode ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
          />
        </div>
      </button>
    </div>
  );

  // Разделитель категорий
  const CategoryDivider = ({ title, color = "blue" }: { title: string; color?: string }) => (
    <div className="mb-2 ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center">
      <div className={`w-4 h-px bg-gradient-to-r from-${color}-600/50 to-transparent mr-2`}></div>
      {title}
    </div>
  );

  // Десктопная боковая панель
  const DesktopSidebar = (
    <motion.aside 
      initial={{ x: -20, opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="hidden md:flex fixed top-0 left-0 h-full w-80 flex-col bg-gradient-to-b from-gray-900 to-black border-r border-blue-900/20 z-50 backdrop-blur-xl"
    >
      {/* Логотип */}
      <div className="relative z-10 p-5">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 
            flex items-center justify-center mr-4 shadow-lg shadow-blue-600/20 transition-all 
            duration-300 hover:shadow-blue-600/40 hover:scale-105 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">UzAvtoAnalytics</span>
            </div>
            <div className="text-blue-400 font-medium">Управляющая система</div>
          </div>
        </motion.div>
      </div>

      {/* Декоративный элемент */}
      <div className="relative h-px w-full my-4 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/30 to-transparent"></div>
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full
          bg-gray-900 border border-blue-500/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
      </div>

      {/* Информационная сводка */}
      <InfoSummary />

      {/* Навигация */}
      <motion.nav 
        className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <CategoryDivider title="Основное меню" color="blue" />
        
        {mainNavItems.map((item, index) => (
          <NavItem key={item.path} item={item} index={index} />
        ))}

        <div className="relative h-px w-full my-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"></div>
        </div>

        <CategoryDivider title="Вспомогательные" color="purple" />
        
        {utilityNavItems.map((item, index) => (
          <NavItem key={item.path} item={item} index={index + mainNavItems.length} />
        ))}
      </motion.nav>

      {/* Темный режим переключатель */}
      <DarkModeToggle />

      {/* Профиль пользователя */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-auto relative z-10"
      >
        <UserProfile includeSysInfo={true} />
      </motion.div>
      
      {/* Декоративные элементы */}
      <div className="absolute bottom-0 left-0 w-full h-64 pointer-events-none z-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 rounded-full bg-blue-600/10 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-indigo-600/10 blur-3xl"></div>
      </div>
    </motion.aside>
  );

  // Мобильная навигация
  const MobileNavigation = (
    <>
      {/* Шапка */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-30 bg-gray-900/90 backdrop-blur-lg border-b border-blue-900/20 shadow-lg shadow-blue-950/10"
      >
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => {
                setIsNavOpen(!isNavOpen);
                if (hapticFeedback) hapticFeedback('impact');
              }} 
              className="menu-button"
              aria-label="Открыть меню"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
           <h1 className="text-xl font-bold ml-3">
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                 {pathname === '/' ? 'Панель управления' : 
                  pathname === '/statistics' ? 'Аналитика продаж' : 
                  pathname === '/users' ? 'Управление клиентами' :
                  pathname === '/products' ? 'Каталог товаров' :
                  pathname === '/orders' ? 'Заказы и отгрузки' :
                  pathname === '/settings' ? 'Настройки системы' : 'Enterprise'}
               </span>
             </h1>
           </motion.div>
         </div>
         <motion.div
           whileTap={{ scale: 0.95 }}
           className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-400 border border-blue-500/30"
         >
           А
         </motion.div>
       </div>
     </motion.header>
     
     {/* Мобильное боковое меню */}
     <AnimatePresence>
       {isMobile && isNavOpen && (
         <motion.div 
           initial={{ x: -300, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -300, opacity: 0 }}
           transition={{ type: "spring", stiffness: 300, damping: 30 }}
           className="fixed top-0 left-0 z-50 w-80 h-full bg-gray-900 shadow-2xl overflow-auto"
           ref={menuRef}
         >
           <div className="p-6 pt-8">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mr-4 shadow-lg">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                     <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                     <line x1="12" y1="22.08" x2="12" y2="12"></line>
                   </svg>
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-white">Enterprise</h2>
                   <p className="text-blue-400 text-xs">Управляющая система</p>
                 </div>
               </div>
               <button 
                 onClick={() => {
                   setIsNavOpen(false);
                   if (hapticFeedback) hapticFeedback('impact');
                 }}
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:text-white"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
               </button>
             </div>
             
             <div className="space-y-6">
               <div>
                 <CategoryDivider title="Основное меню" />
                 <nav className="space-y-1">
                   {mainNavItems.map((item, index) => (
                     <NavItem key={item.path} item={item} index={index} isMobile={true} />
                   ))}
                 </nav>
               </div>
               
               <div className="relative h-px w-full my-4">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"></div>
               </div>
               
               <div>
                 <CategoryDivider title="Вспомогательные" />
                 <nav className="space-y-1">
                   {utilityNavItems.map((item, index) => (
                     <NavItem key={item.path} item={item} index={index + mainNavItems.length} isMobile={true} />
                   ))}
                 </nav>
               </div>
             </div>
             
             {/* Переключатель темы */}
             <div className="mt-6">
               <DarkModeToggle />
             </div>
             
             {/* Профиль пользователя */}
             <div className="mt-6">
               <UserProfile />
             </div>
           </div>
           
           {/* Декоративный градиент */}
           <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none"></div>
         </motion.div>
       )}
     </AnimatePresence>
     
     {/* Фон при открытом мобильном меню */}
     <AnimatePresence>
       {isMobile && isNavOpen && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.2 }}
           className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" 
           onClick={() => setIsNavOpen(false)}
         />
       )}
     </AnimatePresence>
           
     {/* Нижняя навигация */}
     <motion.div
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.3, duration: 0.3 }}
       className="fixed bottom-0 left-0 right-0 z-30 pb-safe"
     >
       <nav className="mobile-nav">
         {mainNavItems.slice(0, 5).map((item, index) => (
           <Link 
             key={item.path}
             href={item.path} 
             className={`mobile-tab ${pathname === item.path ? 'active' : ''}`}
             onClick={() => handleNavClick(item.path)}
           >
             <div className="relative">
               {item.icon}
               {item.notification && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                   {item.notification > 9 ? '9+' : item.notification}
                 </span>
               )}
             </div>
             <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
             {pathname === item.path && (
               <motion.span 
                 layoutId="bottomNavIndicator"
                 className="absolute -top-1 h-1 w-5 bg-blue-500 rounded-full" 
               />
             )}
           </Link>
         ))}
       </nav>
     </motion.div>
   </>
 );

 return (
   <>
     {!isMobile && DesktopSidebar}
     {isMobile && MobileNavigation}

     <style jsx global>{`
       /* Основные стили */
       .bg-clip-text {
         -webkit-background-clip: text;
         background-clip: text;
       }
       
       .text-transparent {
         color: transparent;
       }
       
       .pb-safe {
         padding-bottom: env(safe-area-inset-bottom, 0px);
       }
       
       .hide-scrollbar::-webkit-scrollbar {
         display: none;
       }
       
       .hide-scrollbar {
         -ms-overflow-style: none;
         scrollbar-width: none;
       }
       
       /* Стили для боковой навигации */
       .nav-link {
         display: flex;
         align-items: center;
         margin: 4px 0;
         padding: 12px 14px;
         border-radius: 14px;
         color: rgba(203, 213, 225, 0.8);
         font-weight: 500;
         transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
         position: relative;
         overflow: hidden;
       }
       
       .nav-icon-wrapper {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 38px;
         height: 38px;
         margin-right: 12px;
         border-radius: 12px;
         background: rgba(30, 41, 59, 0.5);
         transition: all 0.25s ease;
         position: relative;
       }
       
       .nav-icon {
         width: 20px;
         height: 20px;
         transition: all 0.25s ease;
       }
       
       .notification-badge {
         position: absolute;
         top: -2px;
         right: -2px;
         min-width: 18px;
         height: 18px;
         border-radius: 9px;
         background: #ef4444;
         color: white;
         font-size: 10px;
         font-weight: 600;
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0 4px;
         border: 2px solid rgba(15, 23, 42, 1);
         box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);
       }
       
       .notification-badge-mobile {
         min-width: 20px;
         height: 20px;
         border-radius: 10px;
         background: #ef4444;
         color: white;
         font-size: 11px;
         font-weight: 600;
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0 6px;
         margin-left: auto;
       }
       
       .nav-link:hover {
         color: rgba(255, 255, 255, 0.95);
         background: rgba(51, 65, 85, 0.5);
       }
       
       .nav-link:hover .nav-icon-wrapper {
         background: rgba(59, 130, 246, 0.2);
       }
       
       .nav-link::before {
         content: '';
         position: absolute;
         left: 0;
         top: 0;
         width: 4px;
         height: 100%;
         background: linear-gradient(to bottom, rgb(59, 130, 246), rgb(79, 70, 229));
         transform: translateX(-5px);
         transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         border-radius: 0 4px 4px 0;
         opacity: 0;
       }
       
       .nav-link:hover::before {
         transform: translateX(0);
         opacity: 0.7;
       }
       
       .nav-link.active {
         background: rgba(59, 130, 246, 0.1);
         color: rgba(255, 255, 255, 0.95);
         font-weight: 600;
       }
       
       .nav-link.active::before {
         transform: translateX(0);
         opacity: 1;
       }
       
       .nav-link.active .nav-icon-wrapper {
         background: rgba(59, 130, 246, 0.2);
         box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
       }
       
       /* Мобильная навигация */
       .mobile-nav-link {
         display: flex;
         align-items: center;
         padding: 14px;
         border-radius: 14px;
         color: rgba(203, 213, 225, 0.8);
         font-weight: 500;
         transition: all 0.25s ease;
         position: relative;
       }
       
       .mobile-nav-link.active {
         background: rgba(59, 130, 246, 0.15);
         color: rgba(255, 255, 255, 0.95);
       }
       
       .nav-icon-mobile {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 36px;
         height: 36px;
         margin-right: 12px;
       }
       
       .nav-icon-mobile svg {
         width: 20px;
         height: 20px;
       }
       
       /* Карточка пользователя */
       .user-card {
         display: flex;
         align-items: center;
         padding: 14px;
         border-radius: 16px;
         background: rgba(17, 24, 39, 0.6);
         backdrop-filter: blur(12px);
         border: 1px solid rgba(59, 130, 246, 0.1);
         transition: all 0.25s ease;
       }
       
       .user-card:hover {
         border-color: rgba(59, 130, 246, 0.3);
         box-shadow: 0 0 20px rgba(59, 130, 246, 0.05);
       }
       
       .avatar {
         width: 42px;
         height: 42px;
         border-radius: 12px;
         background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(79, 70, 229, 0.3));
         display: flex;
         align-items: center;
         justify-content: center;
         font-weight: 600;
         color: rgba(219, 234, 254, 0.95);
         margin-right: 12px;
         position: relative;
       }
       
       .status-indicator {
         position: absolute;
         bottom: -2px;
         right: -2px;
         width: 12px;
         height: 12px;
         border-radius: 50%;
         background: #10b981;
         border: 2px solid rgba(15, 23, 42, 1);
         box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
       }
       
       .user-info {
         flex: 1;
         overflow: hidden;
       }
       
       .user-name {
         font-weight: 600;
         color: rgba(255, 255, 255, 0.95);
         font-size: 14px;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
       }
       
       .user-status {
         display: flex;
         align-items: center;
         font-size: 12px;
         color: #10b981;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
       }
       
       .status-dot {
         width: 6px;
         height: 6px;
         border-radius: 50%;
         background-color: #10b981;
         margin-right: 4px;
         animation: pulse 2s infinite;
       }
       
       .user-menu-btn {
         width: 30px;
         height: 30px;
         border-radius: 8px;
         display: flex;
         align-items: center;
         justify-content: center;
         color: rgba(203, 213, 225, 0.6);
         transition: all 0.2s ease;
         background: transparent;
         border: none;
         cursor: pointer;
       }
       
       .user-menu-btn:hover {
         background: rgba(51, 65, 85, 0.5);
         color: rgba(255, 255, 255, 0.9);
       }
       
       /* Кнопка меню */
       .menu-button {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 40px;
         height: 40px;
         border-radius: 12px;
         background: rgba(17, 24, 39, 0.6);
         color: rgba(226, 232, 240, 0.8);
         transition: all 0.2s ease;
         border: 1px solid rgba(59, 130, 246, 0.2);
       }
       
       .menu-button:active {
         transform: scale(0.95);
         background: rgba(59, 130, 246, 0.2);
       }
       
       /* Нижняя навигация */
       .mobile-nav {
         display: flex;
         justify-content: space-around;
         height: 60px;
         background: rgba(17, 24, 39, 0.95);
         backdrop-filter: blur(12px);
         border-top: 1px solid rgba(59, 130, 246, 0.1);
         box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
       }
       
       .mobile-tab {
         flex: 1;
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         color: rgba(148, 163, 184, 0.8);
         font-size: 12px;
         position: relative;
         transition: all 0.25s ease;
       }
       
       .mobile-tab.active {
         color: rgba(59, 130, 246, 0.95);
       }
       
       .mobile-tab svg {
         width: 22px;
         height: 22px;
         transition: all 0.25s ease;
       }
       
       .mobile-tab:active {
         transform: scale(0.95);
       }
       
       /* Анимации */
       @keyframes pulse {
         0% {
           box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
         }
         70% {
           box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
         }
         100% {
           box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
         }
       }
     `}</style>
   </>
 );
}