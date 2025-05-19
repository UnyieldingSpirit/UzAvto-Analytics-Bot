"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTelegram } from '../../hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
// Импортируем библиотеку иконок Lucide
import * as LucideIcons from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  notification?: number;
  category: string;
}

export default function ResponsiveNav() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { hapticFeedback } = useTelegram();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  
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
    LogOut
  } = LucideIcons;

  // Цвета по категориям
  const categoryColors = {
    main: "#3b82f6", // синий
    analytics: "#6366f1", // индиго
    finance: "#10b981", // зеленый
    warehouse: "#f59e0b", // янтарный
    utility: "#8b5cf6" // фиолетовый
  };

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Обзорная панель',
      category: 'main',
      icon: <LayoutDashboard size={22} strokeWidth={1.5} color={categoryColors.main} />
    },
    {
      path: '/statistics',
      label: 'Аналитика продаж',
      category: 'analytics',
      icon: <AreaChart size={22} strokeWidth={1.5} color={categoryColors.analytics} />,
      notification: 3
    },
    {
      path: '/sales-dashboard',
      label: 'Мониторинг продаж',
      category: 'analytics',
      icon: <TrendingUp size={22} strokeWidth={1.5} color={categoryColors.analytics} />,
      notification: 8
    },
    {
      path: '/model-tracking',
      label: 'Отслеживание моделей',
      category: 'analytics',
      icon: <Gauge size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/analytics-dashboard',
      label: 'Бизнес-аналитика',
      category: 'analytics',
      icon: <PieChart size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/auto-market',
      label: 'Производство',
      category: 'analytics',
      icon: <CarFront size={22} strokeWidth={1.5} color={categoryColors.analytics} />
    },
    {
      path: '/financial-analytics',
      label: 'Финансовая аналитика',
      category: 'finance',
      icon: <FileSpreadsheet size={22} strokeWidth={1.5} color={categoryColors.finance} />,
      notification: 5
    },
    {
      path: '/car-contracts',
      label: 'Контракты',
      category: 'finance',
      icon: <ScrollText size={22} strokeWidth={1.5} color={categoryColors.finance} />
    },
    {
      path: '/installment-dashboard',
      label: 'Рассрочки',
      category: 'finance',
      icon: <HandCoins size={22} strokeWidth={1.5} color={categoryColors.finance} />
    },
    // {
    //   path: '/warehouse-dashboard',
    //   label: 'Управление складом',
    //   category: 'warehouse',
    //   icon: <Building size={22} strokeWidth={1.5} color={categoryColors.warehouse} />
    // },
    // {
    //   path: '/warehouse-analytics',
    //   label: 'Аналитика склада',
    //   category: 'warehouse',
    //   icon: <BarChart4 size={22} strokeWidth={1.5} color={categoryColors.warehouse} />
    // },
    {
      path: '/car-warehouse',
      label: 'Автомобильный склад',
      category: 'warehouse',
      icon: <Car size={22} strokeWidth={1.5} color={categoryColors.warehouse} />,
      notification: 3
    },
    {
      path: '/settings',
      label: 'Настройки системы',
      category: 'utility',
      icon: <Settings size={22} strokeWidth={1.5} color={categoryColors.utility} />
    },
    {
      path: '/help',
      label: 'Документация и поддержка',
      category: 'utility',
      icon: <HelpCircle size={22} strokeWidth={1.5} color={categoryColors.utility} />
    }
  ];

  // Компоненты навигации
  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.path;
    
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="nav-item-container"
      >
        <Link 
          href={item.path} 
          className={`nav-item ${isActive ? 'active' : ''}`}
          onClick={() => handleNavClick(item.path)}
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
    utility: navItems.filter(item => item.category === 'utility')
  };

  const categoryTitles = {
    main: 'Главное',
    analytics: 'Аналитика',
    finance: 'Финансы',
    warehouse: 'Склад',
    utility: 'Настройки'
  };

  // Компонент заголовка категории
  const CategoryTitle = ({ title }: { title: string }) => (
    <div className="category-title">
      <span>{title}</span>
      <div className="title-line"></div>
    </div>
  );

  return (
    <>
      {/* Боковая навигация */}
      <div ref={menuRef} className={`sidebar ${isNavOpen ? 'open' : ''}`}>
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
              <h1>UzAvtoAnalytics</h1>
              <p>Управляющая система</p>
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
          {Object.entries(groupedNavItems).map(([category, items]) => (
            <div key={category} className={`nav-group ${category}`}>
              <CategoryTitle title={categoryTitles[category as keyof typeof categoryTitles]} />
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
            <h3>Администратор</h3>
            <p>Активный сеанс</p>
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
            {navItems.find(item => item.path === pathname)?.label || 'UzAvtoAnalytics'}
          </h1>
          
          <motion.div 
            className="header-avatar"
            whileTap={{ scale: 0.9 }}
          >
            А
          </motion.div>
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
        
        /* Базовые стили */
        :root {
          --sidebar-width: 280px;
          --header-height: 60px;
          --primary: #3b82f6;
          --primary-light: rgba(59, 130, 246, 0.15);
          --primary-dark: #2563eb;
          --bg-dark: #111827;
          --bg-card: #1e293b;
          --text-light: #f1f5f9;
          --text-secondary: #94a3b8;
          --blue-gradient: linear-gradient(135deg, #3b82f6, #2563eb);
          --indigo-gradient: linear-gradient(135deg, #6366f1, #4f46e5);
          --green-gradient: linear-gradient(135deg, #10b981, #059669);
          --amber-gradient: linear-gradient(135deg, #f59e0b, #d97706);
          --purple-gradient: linear-gradient(135deg, #8b5cf6, #7c3aed);
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 16px;
          --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
          --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          --shadow-glow: 0 0 15px rgba(59, 130, 246, 0.5);
          --space-xs: 4px;
          --space-sm: 8px;
          --space-md: 16px;
          --space-lg: 24px;
          --border-color: rgba(59, 130, 246, 0.15);
        }

        /* Сайдбар */
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-dark);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
          box-shadow: var(--shadow-md);
          flex-shrink: 0;
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
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          border-bottom: 1px solid var(--border-color);
          height: 70px;
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
          background: var(--blue-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
          color: white;
        }

        .brand {
          overflow: hidden;
        }

        .brand h1 {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(to right, #fff, #93c5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin: 0;
        }

        .brand p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(30, 41, 59, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          border: none;
          cursor: pointer;
        }

        /* Контент навигации */
        .nav-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-md) 0;
        }

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

        .nav-group.main::before { background: var(--blue-gradient); }
        .nav-group.analytics::before { background: var(--indigo-gradient); }
        .nav-group.finance::before { background: var(--green-gradient); }
        .nav-group.warehouse::before { background: var(--amber-gradient); }
        .nav-group.utility::before { background: var(--purple-gradient); }

        .category-title {
          display: flex;
          align-items: center;
          padding: 0 var(--space-md);
          margin-bottom: var(--space-sm);
        }

        .category-title span {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-right: var(--space-sm);
        }

        .title-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, var(--text-secondary), transparent);
          opacity: 0.2;
        }

        .nav-items {
          padding: 0 var(--space-sm);
        }

        /* Элемент навигации */
        .nav-item-container {
          margin: 3px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-item:hover {
          color: var(--text-light);
          background: rgba(59, 130, 246, 0.08);
        }

        .nav-item.active {
          color: var(--text-light);
          background: var(--primary-light);
        }

        .icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(30, 41, 59, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--space-md);
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .nav-item:hover .icon-wrapper {
          background: rgba(59, 130, 246, 0.15);
        }

        .nav-item.active .icon-wrapper {
          background: rgba(59, 130, 246, 0.25);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);
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
          border: 2px solid var(--bg-dark);
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
            rgba(59, 130, 246, 0.15),
            transparent 70%
          );
          z-index: -1;
        }

        /* Профиль пользователя */
        .user-profile {
          padding: var(--space-md);
          margin: var(--space-md);
          background: linear-gradient(
            to bottom right,
            rgba(59, 130, 246, 0.1),
            rgba(99, 102, 241, 0.05)
          );
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
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
            var(--primary),
            transparent
          );
          opacity: 0.5;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.4));
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
          border: 2px solid var(--bg-dark);
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.8);
        }

        .profile-info {
          overflow: hidden;
        }

        .profile-info h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          color: var(--text-light);
        }

        .profile-info p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Мобильная шапка */
        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-height);
          background: var(--bg-dark);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-md);
          z-index: 90;
        }

        .menu-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(30, 41, 59, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          border: none;
          cursor: pointer;
        }

        .page-title {
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(to right, #fff, #93c5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin: 0;
        }

        .header-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          font-weight: 600;
        }

        /* Затемнение фона */
        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 95;
        }

        /* Стили для скроллбара */
        .nav-content::-webkit-scrollbar {
          width: 4px;
        }

        .nav-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .nav-content::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }

        .nav-content::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}