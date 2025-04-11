"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ResponsiveNav() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-950 backdrop-blur-xl 
        border-r border-blue-900/30 
        transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-50
        ${isNavOpen ? 'translate-x-0 shadow-2xl shadow-blue-950/30' : '-translate-x-full'}
        md:translate-x-0
        overflow-hidden
      `}>
        <div className="flex flex-col h-full pt-16 relative">
          {/* Боковой акцент */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-70"></div>
          
          {/* Фоновый градиент */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(15,23,42,0.4)_0%,rgba(15,23,42,0.01)_100%)]"></div>
          
          {/* Logo */}
          <div className="px-5 py-4 mb-2 flex items-center relative z-10 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4
              shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
                Analytics
              </h1>
              <div className="text-xs text-blue-300/80 -mt-1">Управление данными</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/30 to-transparent my-2"></div>

          {/* Navigation Links */}
          <nav className="px-3 flex-1 overflow-y-auto no-scrollbar py-4 relative z-10">
            <div className="pl-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <div className="w-4 h-px bg-gradient-to-r from-blue-500/50 to-transparent mr-2"></div>
              Основное
            </div>
            
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              <div className="nav-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>Пользователи</span>
            </Link>
            
            <Link href="/statistics" className={`nav-link ${pathname === '/statistics' ? 'active' : ''}`}>
              <div className="nav-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Статистика</span>
            </Link>

            <div className="pl-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-6 flex items-center">
              <div className="w-4 h-px bg-gradient-to-r from-purple-500/50 to-transparent mr-2"></div>
              Прочее
            </div>
            
            <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}>
              <div className="nav-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span>Настройки</span>
            </Link>
          </nav>

          {/* User info */}
          <div className="px-4 mb-6 mt-auto relative z-10">
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
              <div className="user-menu-btn">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      {isMobile && (
        <>
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900 to-gray-950 border-b border-gray-800 shadow-xl">
            <div className="px-4 h-16 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsNavOpen(!isNavOpen)} 
                  className="menu-button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent ml-3">
                  {pathname === '/' ? 'Пользователи' : 
                   pathname === '/statistics' ? 'Статистика' : 
                   pathname === '/settings' ? 'Настройки' : 'Analytics'}
                </h1>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center text-blue-400">
                А
              </div>
            </div>
          </header>
          
          {/* Bottom Tabs */}
          <nav className="mobile-nav">
            <Link href="/" className={`mobile-tab ${pathname === '/' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Пользователи</span>
            </Link>
            
            <Link href="/statistics" className={`mobile-tab ${pathname === '/statistics' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Статистика</span>
            </Link>
            
            <Link href="/settings" className={`mobile-tab ${pathname === '/settings' ? 'active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Настройки</span>
            </Link>
          </nav>
          
          {/* Mobile sidebar backdrop */}
          {isNavOpen && (
            <div onClick={() => setIsNavOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" />
          )}
        </>
      )}

      <style jsx>{`
        /* Стили для кнопки меню на мобильных */
        .menu-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(30, 41, 59, 0.5);
          color: rgba(226, 232, 240, 0.8);
          transition: all 0.2s ease;
          border: 1px solid rgba(51, 65, 85, 0.5);
        }
        
        .menu-button:active {
          transform: scale(0.95);
          background: rgba(30, 41, 59, 0.8);
        }
        
        /* Стили для боковой навигации */
        .nav-link {
          display: flex;
          align-items: center;
          margin: 5px 0;
          padding: 10px 12px;
          border-radius: 12px;
          color: rgba(203, 213, 225, 0.8);
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .nav-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin-right: 12px;
          border-radius: 10px;
          background: rgba(30, 41, 59, 0.5);
          transition: all 0.3s ease;
        }
        
        .nav-icon {
          width: 20px;
          height: 20px;
          transition: all 0.3s ease;
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
          width: 3px;
          height: 100%;
          background: linear-gradient(to bottom, rgb(59, 130, 246), rgb(79, 70, 229));
          transform: translateX(-4px);
          transition: transform 0.3s ease;
          border-radius: 0 4px 4px 0;
          opacity: 0;
        }
        
        .nav-link:hover::before {
          transform: translateX(0);
          opacity: 0.7;
        }
        
        .nav-link.active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(79, 70, 229, 0.05));
          color: rgba(255, 255, 255, 0.95);
          font-weight: 600;
        }
        
        .nav-link.active::before {
          transform: translateX(0);
          opacity: 1;
        }
        
        .nav-link.active .nav-icon-wrapper {
          background: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }
        
        /* Карточка пользователя */
        .user-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(to right, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8));
          border: 1px solid rgba(51, 65, 85, 0.5);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .user-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          padding: 1px;
          background: linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(79, 70, 229, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .user-card:hover::before {
          opacity: 1;
        }
        
        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(79, 70, 229, 0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: rgba(219, 234, 254, 0.95);
          margin-right: 12px;
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        
        .status-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129));
          border: 2px solid rgba(15, 23, 42, 0.8);
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
          color: rgba(34, 197, 94, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: rgba(34, 197, 94, 0.9);
          margin-right: 4px;
          animation: pulse 1.5s infinite;
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
          cursor: pointer;
        }
        
        .user-menu-btn:hover {
          background: rgba(51, 65, 85, 0.5);
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Мобильная навигация */
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          height: 65px;
          padding: 0 16px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
          z-index: 30;
          padding-bottom: env(safe-area-inset-bottom, 0px);
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
          padding: 8px 0;
        }
        
        .mobile-tab.active {
          color: rgba(59, 130, 246, 0.95);
        }
        
        .mobile-tab.active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 2px;
          background: rgba(59, 130, 246, 0.95);
        }
        
        .mobile-tab svg {
          margin-bottom: 4px;
          transition: all 0.25s ease;
        }
        
        .mobile-tab:hover svg,
        .mobile-tab.active svg {
          transform: translateY(-2px);
        }
        
        .mobile-tab span {
          transition: all 0.25s ease;
        }
        
        .mobile-tab:hover span,
        .mobile-tab.active span {
          transform: translateY(2px);
        }
        
        /* Анимации */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        
        /* Утилиты */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Для iOS safe area */
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}