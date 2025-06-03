"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Проверяем авторизацию пользователя
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Если пользователь не авторизован и не находится на странице авторизации,
    // перенаправляем на страницу авторизации
    if (!isAuthenticated && pathname !== '/auth') {
      router.push('/auth');
    }
  }, [router, pathname]);

  return <>{children}</>;
}