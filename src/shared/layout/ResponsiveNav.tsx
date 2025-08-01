"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTelegram } from '../../hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLanguageStore } from '../../store/language';
import { useTranslation } from '../../hooks/useTranslation';
import ThemeToggle from '../components/ThemeToggle';
import * as LucideIcons from 'lucide-react';
import { useThemeStore } from '../../store/theme';

// Переводы для навигации
const navTranslations = {
  'ru': {
    dashboard: 'Аналитические отчеты',
    salesAnalytics: 'Аналитика продаж',
    salesMonitoring: 'Мониторинг отгрузок',
    modelTracking: 'Отслеживание моделей',
    businessAnalytics: 'Бизнес-аналитика',
    production: 'Производство',
    financialAnalytics: 'Финансовая аналитика',
    contracts: 'Контракты',
    installments: 'Рассрочки',
    carWarehouse: 'Автомобильный склад',
    systemSettings: 'Настройки системы',
    warehouseStatistics: 'Производство авто',
    sapClosing: 'SAP закрытие месяца',
    documentation: 'Документация и поддержка',
    selectLanguage: 'Выбрать язык',
    appTitle: 'CarSale Аналитик',
    appSubtitle: 'Управляющая система',
    categories: {
      main: 'Главное',
      analytics: 'Аналитика',
      finance: 'Финансы',
      warehouse: 'Склад',
      utility: 'Настройки'
    },
    profile: {
      admin: 'Администратор',
      activeSession: 'Активный сеанс',
      language: 'Язык системы'
    },
    theme: {
      light: 'Светлая',
      dark: 'Темная',
      system: 'Системная',
      title: 'Тема'
    }
  },
  'uz': {
    dashboard: 'Tahlil paneli',
    salesAnalytics: 'Sotuv tahlili',
    salesMonitoring: 'Sotuv monitoringi',
    modelTracking: 'Model kuzatuvi',
    businessAnalytics: 'Biznes tahlili',
    production: 'Ishlab chiqarish',
    financialAnalytics: 'Moliyaviy tahlil',
    contracts: 'Shartnomalar',
    warehouseStatistics: 'Ishlab chiqarish statistikasi',
    sapClosing: 'SAP oyni yopish',
    installments: 'Bo\'lib to\'lash',
    carWarehouse: 'Avtomobil ombori',
    systemSettings: 'Tizim sozlamalari',
    documentation: 'Hujjatlar va yordam',
    selectLanguage: 'Tilni tanlang',
    appTitle: 'CarSale Аналитик',
    appSubtitle: 'Boshqaruv tizimi',
    categories: {
      main: 'Asosiy',
      analytics: 'Tahlil',
      finance: 'Moliya',
      warehouse: 'Ombor',
      utility: 'Sozlamalar'
    },
    profile: {
      admin: 'Administrator',
      activeSession: 'Faol sessiya',
      language: 'Tizim tili'
    },
    theme: {
      light: 'Yorug\'',
      dark: 'Qorong\'u',
      system: 'Tizim',
      title: 'Mavzu'
    }
  },
  'en': {
    dashboard: 'Analytics Reports',
    salesAnalytics: 'Sales Analytics',
    salesMonitoring: 'Sales Monitoring',
    modelTracking: 'Model Tracking',
    businessAnalytics: 'Business Analytics',
    production: 'Production',
    financialAnalytics: 'Financial Analytics',
    contracts: 'Contracts',
    warehouseStatistics: 'Warehouse Statistics',
    sapClosing: 'SAP Month Closing',
    installments: 'Installments',
    carWarehouse: 'Car Warehouse',
    systemSettings: 'System Settings',
    documentation: 'Documentation & Support',
    selectLanguage: 'Select Language',
    appTitle: 'CarSale Analytics',
    appSubtitle: 'Management System',
    categories: {
      main: 'Main',
      analytics: 'Analytics',
      finance: 'Finance',
      warehouse: 'Warehouse',
      utility: 'Settings'
    },
    profile: {
      admin: 'Administrator',
      activeSession: 'Active Session',
      language: 'System Language'
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      title: 'Theme'
    }
  }
};

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  notification?: number;
  category: string;
  translationKey: string;
}

export default function ResponsiveNav() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { hapticFeedback } = useTelegram();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const { mode, setMode } = useThemeStore();
  const isDark = mode === 'dark';
  const { currentLocale, setLocale } = useLanguageStore();
  const { t } = useTranslation(navTranslations);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    
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
  
  const {
    LayoutDashboard,
    BarChart3,
    LineChart,
    CarFront,
    CreditCard,
    ScrollText,
    DollarSign,
    Receipt,
    PackageSearch,
    BarChart4,
    Package,
    Settings,
    HelpCircle,
    Activity,
    PieChart,
    Warehouse,
    ShoppingCart,
    Gauge,
    ClipboardCheck,
    TrendingUp,
    FileSpreadsheet,
    Building,
    HandCoins,
    AreaChart,
    Car,
    LayoutGrid,
    Menu,
    X,
    LogOut,
    Globe,
    Check,
    Sun,
    Moon,
    Monitor,
    Calendar
  } = LucideIcons;

  // Цвета по категориям с фиолетовой палитрой
const categoryColors = {
  main: "#8b5cf6",      // фиолетовый
  analytics: "#3b82f6", // синий
  finance: "#10b981",   // зеленый
  warehouse: "#f59e0b", // оранжевый
  utility: "#ec4899"    // розовый
};

  const navItems: NavItem[] = [
    {
      path: '/',
      label: t('dashboard'),
      translationKey: 'dashboard',
      category: 'main',
      icon: <LayoutDashboard size={22} strokeWidth={1.5} color={categoryColors.main} />
    },
    {
      path: '/statistics',
      label: t('salesAnalytics'),
      translationKey: 'salesAnalytics',
      category: 'analytics',
      icon: <AreaChart size={22} strokeWidth={1.5} color={categoryColors.analytics} />,
    },
    {
      path: '/sales-dashboard',
      label: t('salesMonitoring'),
      translationKey: 'salesMonitoring',
      category: 'analytics',
      icon: <TrendingUp size={22} strokeWidth={1.5} color={categoryColors.analytics} />,
    },
    {
      path: '/model-tracking',
      label: t('modelTracking'),
      translationKey: 'modelTracking',
      category: 'analytics',
      icon: <Gauge size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/analytics-dashboard',
      label: t('businessAnalytics'),
      translationKey: 'businessAnalytics',
      category: 'analytics',
      icon: <PieChart size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/auto-market',
      label: t('production'),
      translationKey: 'production',
      category: 'analytics',
      icon: <CarFront size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/financial-analytics',
      label: t('financialAnalytics'),
      translationKey: 'financialAnalytics',
      category: 'finance',
      icon: <FileSpreadsheet size={22} strokeWidth={1.5} color={categoryColors.finance} />,
    },
    {
      path: '/car-contracts',
      label: t('contracts'),
      translationKey: 'contracts',
      category: 'finance',
      icon: <ScrollText size={22} strokeWidth={1.5} color={categoryColors.finance} />
    },
    {
      path: '/installment-dashboard',
      label: t('installments'),
      translationKey: 'installments',
      category: 'finance',
      icon: <HandCoins size={22} strokeWidth={1.5} color={categoryColors.finance} />
    },
    {
      path: '/car-warehouse',
      label: t('carWarehouse'),
      translationKey: 'carWarehouse',
      category: 'warehouse',
      icon: <Car size={22} strokeWidth={1.5} color={categoryColors.warehouse} />,
    },
    {
      path: '/warehouse-statistics',
      label: t('warehouseStatistics'),
      translationKey: 'warehouseStatistics',
      category: 'warehouse',
      icon: <BarChart3 size={22} strokeWidth={1.5} color={categoryColors.warehouse} />
    },
    {
      path: '/sap-closing',
      label: t('sapClosing'),
      translationKey: 'sapClosing',
      category: 'finance',
      icon: <Calendar size={22} strokeWidth={1.5} color={categoryColors.finance} />,
    }
  ];

  // Компонент навигационного элемента
const getCategoryColor = (category: string) => {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.main;
};

// 3. Обновите компонент NavItem, чтобы использовать динамические цвета:
const NavItem = ({ item }: { item: NavItem }) => {
  const isActive = pathname === item.path;
  const categoryColor = getCategoryColor(item.category);
  
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className="nav-item-container"
    >
      <Link 
        href={item.path} 
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => handleNavClick(item.path)}
        style={{
          '--category-color': categoryColor
        } as React.CSSProperties}
      >
        <motion.div 
          className="icon-wrapper"
        >
          {item.icon}
          {item.notification && (
            <span className="badge">{item.notification}</span>
          )}
        </motion.div>
        <span className="label">{item.label}</span>
        {isActive && (
          <motion.div 
            layoutId="activeIndicator"
            className="active-indicator"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </Link>
    </motion.div>
  );
};

  // Группировка навигации по категориям
  const groupedNavItems = {
    main: navItems.filter(item => item.category === 'main'),
    analytics: navItems.filter(item => item.category === 'analytics'),
    finance: navItems.filter(item => item.category === 'finance'),
    warehouse: navItems.filter(item => item.category === 'warehouse'),
  };

  // Компонент заголовка категории
  const CategoryTitle = ({ title, category }: { title: string, category: string }) => (
    <div className="category-title">
      <span>{title}</span>
      <div className="title-line"></div>
    </div>
  );

  return (
    <>
      {/* Боковая навигация */}
      <div ref={menuRef} className={`pb-4 sidebar ${isNavOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <motion.div 
              className="logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LayoutGrid size={26} />
            </motion.div>
            <div className="brand">
              <h1>{t('appTitle')}</h1>
              <p>{t('appSubtitle')}</p>
            </div>
          </div>
          
          {/* Кнопка закрытия для мобильных */}
          {isMobile && (
            <motion.button 
              className="close-btn"
              onClick={() => setIsNavOpen(false)}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          )}
        </div>
        
        <div className="nav-content">
          <div className="controls-section">
            <div className="theme-control">
              <div style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: isDark ? '#1f2937' : '#e5e7eb',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background-color 0.3s ease'
              }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {setMode('light'), setTimeout(() => {
                    window.location.reload();
                  }, 100);}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: mode === 'light' 
                      ? (isDark ? '#374151' : '#ffffff')
                      : 'transparent',
                    color: mode === 'light'
                      ? '#8b5cf6'
                      : (isDark ? '#9ca3af' : '#4b5563'),
                    boxShadow: mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (mode !== 'light') {
                      e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== 'light') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Sun size={16} />
                  <span>Light</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMode('dark'),
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: mode === 'dark' 
                      ? (isDark ? '#374151' : '#ffffff')
                      : 'transparent',
                    color: mode === 'dark'
                      ? '#8b5cf6'
                      : (isDark ? '#9ca3af' : '#4b5563'),
                    boxShadow: mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (mode !== 'dark') {
                      e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== 'dark') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Moon size={16} />
                  <span>Dark</span>
                </motion.button>
              </div>
            </div>
            
            <div className="language-control">
              <div style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: isDark ? '#1f2937' : '#e5e7eb',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background-color 0.3s ease'
              }}>
                {[
                  { code: 'ru', flag: '🇷🇺', label: 'РУ' },
                  { code: 'uz', flag: '🇺🇿', label: 'UZ' },
                  { code: 'en', flag: '🇬🇧', label: 'EN' }
                ].map(lang => (
                  <motion.button
                    key={lang.code}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {setLocale(lang.code as 'ru' | 'uz' | 'en'), setTimeout(() => {
                      window.location.reload();
                    }, 100);}}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: currentLocale === lang.code 
                        ? (isDark ? '#374151' : '#ffffff')
                        : 'transparent',
                      color: currentLocale === lang.code
                        ? '#8b5cf6'
                        : (isDark ? '#9ca3af' : '#4b5563'),
                      boxShadow: currentLocale === lang.code ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (currentLocale !== lang.code) {
                        e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentLocale !== lang.code) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Навигационные элементы */}
          {Object.entries(groupedNavItems).map(([category, items]) => (
            <div key={category} className={`nav-group ${category}`}>
              <CategoryTitle 
                title={t(`categories.${category}`)} 
                category={category} 
              />
              <div className="nav-items">
                {items.map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="user-profile">
          <motion.div 
            className="avatar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>А</span>
            <motion.div 
              className="status"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </motion.div>
          <div className="profile-info">
            <h3>{t('profile.admin')}</h3>
            <p>{t('profile.activeSession')}</p>
          </div>
          
          <motion.button
            className="logout-btn"
            onClick={logout}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut size={18} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Мобильная шапка */}
      {isMobile && (
        <header className="mobile-header">
          <motion.button 
            className="menu-btn"
            onClick={() => setIsNavOpen(true)}
            whileTap={{ scale: 0.9 }}
          >
            <Menu size={24} />
          </motion.button>
          
          <h1 className="page-title">
            {navItems.find(item => item.path === pathname)?.label || t('appTitle')}
          </h1>
          
          <ThemeToggle />
        </header>
      )}

      {/* Затемнение фона для мобильных */}
      {isMobile && isNavOpen && (
        <motion.div 
          className="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsNavOpen(false)}
        />
      )}

      <style jsx global>{`
        /* Базовые стили */
        :root {
          --sidebar-width: 280px;
          --header-height: 60px;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 16px;
          --space-xs: 4px;
          --space-sm: 8px;
          --space-md: 16px;
          --space-lg: 24px;
        }

        /* Сайдбар */
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          flex-shrink: 0;
          transition: background-color 0.3s ease;
        }

        .dark .sidebar {
          background: #0f0a19;
          box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1);
        }

        @media (max-width: 1023px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            width: 85%;
            max-width: 320px;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .sidebar.open {
            transform: translateX(0);
          }
          
          main, .main-content, #content-wrapper, [role="main"], .page-content {
            padding-top: var(--header-height);
          }
          
          body > div:not(.sidebar):not(.mobile-header):not(.backdrop) {
            padding-top: var(--header-height);
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          border-bottom: 1px solid #e5e7eb;
          height: 70px;
        }

        .dark .sidebar-header {
          border-bottom-color: #2d1b69;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .logo {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          flex-shrink: 0;
          color: white;
        }

        .brand h1 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .dark .brand h1 {
          color: #f1f5f9;
        }

        .brand p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .dark .brand p {
          color: #94a3b8;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e293b;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dark .close-btn {
          background: #1e1530;
          color: #f1f5f9;
        }

        /* Контент навигации */
        .nav-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 0 var(--space-md) 0;
        }

        /* Секция контролов */
        .controls-section {
          padding: var(--space-md);
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .dark .controls-section {
          border-bottom-color: #2d1b69;
        }

        .theme-control,
        .language-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .control-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        .dark .control-label {
          color: #94a3b8;
        }

        /* Группы навигации */
        .nav-group {
          margin-bottom: var(--space-lg);
          position: relative;
        }

        .nav-group::before {
          content: '';
          position: absolute;
          left: 0;
          top: 30px;
          bottom: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
        }

   .nav-group.main::before { 
  background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
}
.nav-group.analytics::before { 
  background: linear-gradient(135deg, #3b82f6, #2563eb); 
}
.nav-group.finance::before { 
  background: linear-gradient(135deg, #10b981, #059669); 
}
.nav-group.warehouse::before { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
}

        .category-title {
          display: flex;
          align-items: center;
          padding: 0 var(--space-md);
          margin-bottom: var(--space-sm);
        }

        .category-title span {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-right: var(--space-sm);
        }

        .dark .category-title span {
          color: #a78bfa;
        }

        .title-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, #e5e7eb, transparent);
        }

        .dark .title-line {
          background: linear-gradient(to right, #2d1b69, transparent);
        }

        /* Элементы навигации */
        .nav-items {
          padding: 0 var(--space-sm);
        }

        .nav-item-container {
          margin: 3px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .dark .nav-item {
          color: #94a3b8;
        }

     .nav-item:hover {
  color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 5%, transparent);
}

.dark .nav-item:hover {
  color: color-mix(in srgb, var(--category-color) 70%, white);
  background: color-mix(in srgb, var(--category-color) 10%, transparent);
}

    .nav-item.active {
  color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 10%, transparent);
}
.dark .nav-item.active {
  color: color-mix(in srgb, var(--category-color) 80%, white);
  background: color-mix(in srgb, var(--category-color) 20%, transparent);
}

        .icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--space-md);
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .dark .icon-wrapper {
          background: rgba(30, 21, 48, 0.8);
        }

        .nav-item:hover .icon-wrapper {
          background: #ede9fe;
        }

        .dark .nav-item:hover .icon-wrapper {
          background: rgba(139, 92, 246, 0.15);
        }

      .nav-item.active .icon-wrapper {
  background: color-mix(in srgb, var(--category-color) 20%, transparent);
}


     .dark .nav-item.active .icon-wrapper {
  background: color-mix(in srgb, var(--category-color) 30%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--category-color) 30%, transparent);
}

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
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
          border: 2px solid #ffffff;
        }

        .dark .badge {
          border-color: #0f0a19;
        }

        .label {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

    .active-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  background: radial-gradient(
    circle at right center,
    color-mix(in srgb, var(--category-color) 15%, transparent),
    transparent 70%
  );
  z-index: -1;
}

        /* Профиль пользователя */
        .user-profile {
          padding: var(--space-md);
          margin: var(--space-md);
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .dark .user-profile {
          background: linear-gradient(
            to bottom right,
            rgba(139, 92, 246, 0.1),
            rgba(124, 58, 237, 0.05)
          );
          border-color: rgba(139, 92, 246, 0.2);
        }

        .user-profile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            to right,
            transparent,
            #8b5cf6,
            transparent
          );
          opacity: 0.5;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(124, 58, 237, 0.4));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          margin-right: var(--space-md);
          position: relative;
          flex-shrink: 0;
        }

        .status {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #faf5ff;
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.8);
        }

        .dark .status {
          border-color: #0f0a19;
        }

        .profile-info {
          overflow: hidden;
        }

        .profile-info h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .dark .profile-info h3 {
          color: #f1f5f9;
        }

        .profile-info p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .dark .profile-info p {
          color: #94a3b8;
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          border: none;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        /* Мобильная шапка */
        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-height);
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-md);
          z-index: 90;
          transition: all 0.3s ease;
        }

        .dark .mobile-header {
          background: #0f0a19;
          border-bottom-color: #2d1b69;
        }

        .menu-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: #faf5ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dark .menu-btn {
          background: #1e1530;
          color: #a78bfa;
        }

        .page-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .dark .page-title {
          color: #f1f5f9;
        }

        /* Затемнение фона */
        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 95;
        }

        /* Скроллбар */
        .nav-content::-webkit-scrollbar {
          width: 4px;
        }

        .nav-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .nav-content::-webkit-scrollbar-thumb {
          background: #e9d5ff;
          border-radius: 4px;
        }

        .dark .nav-content::-webkit-scrollbar-thumb {
          background: #4c1d95;
        }

        .nav-content::-webkit-scrollbar-thumb:hover {
          background: #c084fc;
        }

        .dark .nav-content::-webkit-scrollbar-thumb:hover {
          background: #6d28d9;
        }

        .language-select:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
      `}</style>
    </>
  );
}