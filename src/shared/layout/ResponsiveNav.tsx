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
 category: string;
}

export default function ResponsiveNav() {
 const [isNavOpen, setIsNavOpen] = useState(false);
 const [isMobile, setIsMobile] = useState(false);
 const pathname = usePathname();
 const { hapticFeedback } = useTelegram();
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

 const navItems: NavItem[] = [
   {
     path: '/',
     label: 'Обзорная панель',
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
     label: 'Общая аналитика',
     category: 'analytics',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <line x1="18" y1="20" x2="18" y2="10"></line>
         <line x1="12" y1="20" x2="12" y2="4"></line>
         <line x1="6" y1="20" x2="6" y2="14"></line>
       </svg>
     ),
     notification: 3
   },
   {
     path: '/sales-dashboard',
     label: 'Мониторинг продаж',
     category: 'analytics',
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
     notification: 8
   },
   {
     path: '/model-tracking',
     label: 'Отслеживание моделей',
     category: 'analytics',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
         <path d="M18 14h-8"></path>
         <path d="M15 18h-5"></path>
         <path d="M10 6h8v4h-8z"></path>
       </svg>
     )
   },
   {
     path: '/auto-market',
     label: 'Авторынок',
     category: 'analytics',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
         <circle cx="7" cy="17" r="2"></circle>
         <circle cx="17" cy="17" r="2"></circle>
       </svg>
     )
   },
   {
     path: '/financial-analytics',
     label: 'Финансовая аналитика',
     category: 'finance',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
       </svg>
     ),
     notification: 5
   },
   {
     path: '/car-contracts',
     label: 'Контракты',
     category: 'finance',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <rect x="3" y="4" width="18" height="16" rx="2"></rect>
         <path d="M7 8h10"></path>
         <path d="M7 12h10"></path>
         <path d="M7 16h6"></path>
       </svg>
     )
   },
   {
     path: '/installment-dashboard',
     label: 'Рассрочки',
     category: 'finance',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M2 17h2v.5H3v1h1v.5H2"></path>
         <path d="M6 17h1.5v1.5H6"></path>
         <path d="M2 14h1.5v1.5H2"></path>
         <path d="M6 14h2v.5H7v1h1v.5H6"></path>
         <path d="M10 14h2v.5h-1v1h1v.5h-2"></path>
         <path d="M14 14h1.5v1.5H14"></path>
         <path d="M18 14h2v.5h-1v1h1v.5h-2"></path>
         <rect x="2" y="6" width="20" height="3"></rect>
       </svg>
     )
   },
   {
     path: '/warehouse-dashboard',
     label: 'Управление складом',
     category: 'warehouse',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M3 3h18v18H3z"></path>
         <path d="M3 9h18"></path>
         <path d="M9 21V9"></path>
       </svg>
     )
   },
   {
     path: '/warehouse-analytics',
     label: 'Аналитика склада',
     category: 'warehouse',
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M8 18L5 21l-3-3"></path>
         <path d="M2 6h20v16H2z"></path>
         <path d="M6 2v4"></path>
         <path d="M18 2v4"></path>
         <path d="M14 18V9"></path>
         <path d="M8 14v4"></path>
         <path d="M20 14v4"></path>
       </svg>
     )
   },
   {
     path: '/car-warehouse',
     label: 'Автомобильный склад',
     category: 'warehouse',
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
     category: 'utility',
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
     icon: (
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10"></circle>
         <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
         <line x1="12" y1="17" x2="12.01" y2="17"></line>
       </svg>
     )
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
           whileTap={() => ({
             boxShadow: "0 0 0 8px rgba(59, 130, 246, 0.3)",
             transition: { duration: 0.2 }
           })}
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
     {/* Desktop & Mobile Sidebar */}
     <div className={`sidebar ${isNavOpen ? 'open' : ''}`}>
       <div className="sidebar-header">
         <div className="logo-container">
           <motion.div 
             className="logo"
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
               <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
               <line x1="12" y1="22.08" x2="12" y2="12"></line>
             </svg>
           </motion.div>
           <div className="brand">
             <h1>UzAvtoAnalytics</h1>
             <p>Управляющая система</p>
           </div>
         </div>
         
         {/* Mobile only close button */}
         {isMobile && (
           <motion.button 
             className="close-btn"
             onClick={() => setIsNavOpen(false)}
             whileTap={{ scale: 0.9 }}
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
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
       </div>
     </div>

     {/* Mobile Header */}
     {isMobile && (
       <header className="mobile-header">
         <motion.button 
           className="menu-btn"
           onClick={() => setIsNavOpen(true)}
           whileTap={{ scale: 0.9 }}
         >
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="3" y1="12" x2="21" y2="12"></line>
             <line x1="3" y1="6" x2="21" y2="6"></line>
             <line x1="3" y1="18" x2="21" y2="18"></line>
           </svg>
         </motion.button>
         
         <h1 className="page-title">
           {pathname === '/' ? 'Обзорная панель' : 
           pathname === '/statistics' ? 'Общая аналитика' : 
           pathname === '/sales-dashboard' ? 'Мониторинг продаж' :
           pathname === '/model-tracking' ? 'Отслеживание моделей' :
           pathname === '/auto-market' ? 'Авторынок' :
           pathname === '/financial-analytics' ? 'Финансовая аналитика' :
           pathname === '/car-contracts' ? 'Контракты' :
           pathname === '/installment-dashboard' ? 'Рассрочки' :
           pathname === '/warehouse-dashboard' ? 'Управление складом' :
           pathname === '/warehouse-analytics' ? 'Аналитика склада' :
           pathname === '/car-warehouse' ? 'Автомобильный склад' :
           pathname === '/settings' ? 'Настройки' : 
           pathname === '/help' ? 'Поддержка' : 'UzAvtoAnalytics'}
         </h1>
         
         <motion.div 
           className="header-avatar"
           whileTap={{ scale: 0.9 }}
         >
           А
         </motion.div>
       </header>
     )}

     {/* Mobile Backdrop */}
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
       /* Base */
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

       /* Layout */
       body {
         margin: 0;
         padding: 0;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: var(--bg-dark);
         color: var(--text-light);
       }

       @media (min-width: 1024px) {
         body {
           padding-left: var(--sidebar-width);
         }
       }

       @media (max-width: 1023px) {
         body {
           padding-top: var(--header-height);
         }
       }

       /* Sidebar */
       .sidebar {
         position: fixed;
         top: 0;
         left: 0;
         width: var(--sidebar-width);
         height: 100vh;
         background: var(--bg-dark);
         display: flex;
         flex-direction: column;
         z-index: 100;
         overflow-y: auto;
         box-shadow: var(--shadow-md);
         transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
       }

       @media (max-width: 1023px) {
         .sidebar {
           transform: translateX(-100%);
           width: 85%;
           max-width: 320px;
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
       }

       .logo svg {
         width: 26px;
         height: 26px;
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

       .close-btn svg {
         width: 20px;
         height: 20px;
       }

       /* Navigation Content */
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

       /* Navigation Item */
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

       .icon-wrapper svg {
         width: 20px;
         height: 20px;
         transition: transform 0.2s ease;
       }

       .nav-item:hover .icon-wrapper svg {
         transform: scale(1.1);
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

       /* User Profile */
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

       /* Mobile Header */
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

       .menu-btn svg {
         width: 24px;
         height: 24px;
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

       /* Backdrop */
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

       /* Animations and Effects */
       @keyframes ripple {
         0% {
           transform: scale(0);
           opacity: 1;
         }
         100% {
           transform: scale(2.5);
           opacity: 0;
         }
       }

       /* Scrollbar Styling */
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

       /* Responsive */
       @media (max-width: 1023px) {
         .sidebar {
           border-right: none;
         }
       }
     `}</style>
   </>
 );
}