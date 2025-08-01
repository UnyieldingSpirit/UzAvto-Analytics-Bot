// src/shared/components/AuthForm.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/theme';

export default function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login, loading } = useAuth();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Функция для фильтрации только латинских символов, цифр и специальных символов
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    // Разрешаем только латинские буквы, цифры, точку, дефис и подчеркивание
    const filteredValue = value.replace(/[^a-zA-Z0-9._-]/g, '');
    setUsername(filteredValue);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    // Разрешаем латинские буквы, цифры и специальные символы (исключаем кириллицу и другие unicode символы)
    const filteredValue = value.replace(/[^\x00-\x7F]/g, '');
    setPassword(filteredValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }
    
    try {
      const success = await login(username, password);
      
      if (success) {
        router.push('/home');
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      if (err.response && err.response.status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else {
        setError('Произошла ошибка при входе. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen overflow-hidden relative ${isDark ? 'dark' : ''}`}>
      {/* Фон */}
      <div className={`absolute inset-0 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-black' 
          : 'bg-gradient-to-br from-purple-50 via-white to-purple-100'
      } -z-10`}></div>
      
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden -z-5">
        <div className={`absolute top-[10%] right-[20%] w-64 h-64 ${
          isDark ? 'bg-purple-800/20' : 'bg-purple-500/10'
        } rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-[30%] left-[10%] w-72 h-72 ${
          isDark ? 'bg-purple-700/15' : 'bg-purple-400/10'
        } rounded-full blur-3xl`}></div>
        <div className={`absolute top-[40%] left-[25%] w-80 h-80 ${
          isDark ? 'bg-purple-600/10' : 'bg-purple-300/10'
        } rounded-full blur-3xl`}></div>
      </div>
      
      {/* Основной контент */}
      <div className="w-full max-w-md px-4 z-10">
        {/* Карточка авторизации с формой */}
        <motion.div 
          className={`${
            isDark 
              ? 'bg-gray-900/60 border-purple-800/30' 
              : 'bg-white/95 border-purple-200'
          } backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border overflow-hidden relative`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Декоративный элемент */}
          <div className={`absolute -right-20 -top-20 w-40 h-40 ${
            isDark ? 'bg-purple-700/20' : 'bg-purple-400/20'
          } rounded-full blur-2xl`}></div>
          <div className={`absolute -left-20 -bottom-20 w-40 h-40 ${
            isDark ? 'bg-purple-600/20' : 'bg-purple-300/20'
          } rounded-full blur-2xl`}></div>
          
          {/* Логотип */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className={`absolute inset-0 ${
                isDark 
                  ? 'bg-gradient-to-tr from-purple-600 to-purple-800' 
                  : 'bg-gradient-to-tr from-purple-500 to-purple-700'
              } rounded-xl rotate-45`}></div>
              <svg 
                className="relative z-10" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10C7 8.89543 7.89543 8 9 8H15C16.1046 8 17 8.89543 17 10V14C17 15.1046 16.1046 16 15 16H9C7.89543 16 7 15.1046 7 14V10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11.5H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className={`text-2xl font-bold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            } mb-1`}>Вход в CarSale Analytics</h1>
            <p className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            } text-sm`}>Введите данные для доступа к системе</p>
          </div>
          
          {/* Форма авторизации */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                className={`py-3 px-4 ${
                  isDark 
                    ? 'bg-red-900/20 border-red-800/30 text-red-400' 
                    : 'bg-red-50 border-red-200 text-red-700'
                } border rounded-xl text-sm flex items-start`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                      stroke={isDark ? "#a78bfa" : "#8b5cf6"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" 
                      stroke={isDark ? "#a78bfa" : "#8b5cf6"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`block w-full pl-12 pr-4 py-3.5 ${
                    isDark 
                      ? 'bg-gray-800/50 border-purple-700/50 text-gray-100 placeholder-gray-400 focus:ring-purple-600/50 focus:border-purple-600' 
                      : 'bg-white border-purple-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                  } border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                  placeholder="Имя пользователя (латиница)"
                  value={username}
                  onChange={handleUsernameChange}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const filteredText = pastedText.replace(/[^a-zA-Z0-9._-]/g, '');
                    setUsername(filteredText);
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.0198 6.92999L19.0198 6.92999C19.6498 7.55999 20.0098 8.40999 20.0098 9.33999V14.67C20.0098 16.99 17.9998 18.83 15.5198 18.52L15.5198 18.52C14.5398 18.38 13.4598 18.52 12.5398 18.97L12.5398 18.97C12.2098 19.13 11.7898 19.13 11.4598 18.97L11.4598 18.97C10.5398 18.52 9.45976 18.38 8.47976 18.52L8.47976 18.52C6.00976 18.83 3.98975 16.99 3.98975 14.67V9.33999C3.98975 8.40999 4.34976 7.55999 4.97976 6.92999L4.97976 6.92999C6.60976 5.29999 9.38975 5.29999 11.0198 6.92999L11.0198 6.92999C11.5898 7.49999 12.4098 7.49999 12.9798 6.92999L12.9798 6.92999C14.6098 5.29999 17.3898 5.29999 19.0198 6.92999Z" 
                      stroke={isDark ? "#a78bfa" : "#8b5cf6"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path d="M9.05078 11.87V14.75" stroke={isDark ? "#a78bfa" : "#8b5cf6"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 10.5V14.75" stroke={isDark ? "#a78bfa" : "#8b5cf6"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.9492 11.87V14.75" stroke={isDark ? "#a78bfa" : "#8b5cf6"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`block w-full pl-12 pr-12 py-3.5 ${
                    isDark 
                      ? 'bg-gray-800/50 border-purple-700/50 text-gray-100 placeholder-gray-400 focus:ring-purple-600/50 focus:border-purple-600' 
                      : 'bg-white border-purple-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                  } border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                  placeholder="Пароль"
                  value={password}
                  onChange={handlePasswordChange}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const filteredText = pastedText.replace(/[^\x00-\x7F]/g, '');
                    setPassword(filteredText);
                  }}
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  } transition-colors`}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.5299 9.47004L9.47992 14.53C8.82992 13.88 8.41992 12.99 8.41992 12C8.41992 10.02 10.0199 8.42004 11.9999 8.42004C12.9899 8.42004 13.8799 8.83004 14.5299 9.47004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17.8198 5.76998C16.0698 4.44998 14.0698 3.72998 11.9998 3.72998C8.46984 3.72998 5.17984 5.80998 2.88984 9.40998C1.98984 10.82 1.98984 13.19 2.88984 14.6C3.67984 15.84 4.59984 16.91 5.59984 17.77" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.41992 19.5301C9.55992 20.0101 10.7699 20.2701 11.9999 20.2701C15.5299 20.2701 18.8199 18.1901 21.1099 14.5901C22.0099 13.1801 22.0099 10.8101 21.1099 9.40005C20.7799 8.88005 20.4199 8.39005 20.0499 7.93005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.5099 12.7C15.2499 14.11 14.0999 15.26 12.6899 15.52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.47 14.53L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L14.53 9.47" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5799 12C15.5799 13.98 13.9799 15.58 11.9999 15.58C10.0199 15.58 8.41992 13.98 8.41992 12C8.41992 10.02 10.0199 8.42004 11.9999 8.42004C13.9799 8.42004 15.5799 10.02 15.5799 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11.9998 20.27C15.5298 20.27 18.8198 18.19 21.1098 14.59C22.0098 13.18 22.0098 10.81 21.1098 9.39997C18.8198 5.79997 15.5298 3.71997 11.9998 3.71997C8.46984 3.71997 5.17984 5.79997 2.88984 9.39997C1.98984 10.81 1.98984 13.18 2.88984 14.59C5.17984 18.19 8.46984 20.27 11.9998 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Используйте только латинские буквы и цифры
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 rounded ${
                    isDark 
                      ? 'bg-gray-800 border-purple-700 text-purple-600 focus:ring-purple-600/50' 
                      : 'bg-white border-purple-300 text-purple-600 focus:ring-purple-500'
                  }`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Запомнить меня
                </label>
              </div>
            </div>
            
            <motion.button
              type="submit"
              disabled={isLoading || loading}
              className={`relative w-full flex justify-center items-center py-3 px-4 mt-6 rounded-xl text-white ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark ? 'focus:ring-purple-500' : 'focus:ring-purple-500 focus:ring-offset-gray-50'
              } disabled:opacity-70 transition-all duration-200 overflow-hidden group`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Эффект свечения */}
              <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-30 transition-opacity"></span>
              
              {(isLoading || loading) ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span>Войти в систему</span>
                </>
              )}
            </motion.button>
          </form>
          
          
          <p className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
            © 2025 CarSale Analytics • Защищено шифрованием
          </p>
        </motion.div>
      </div>
    </div>
  );
}