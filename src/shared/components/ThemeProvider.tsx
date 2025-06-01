'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../../store/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { initializeTheme } = useThemeStore();
    
    useEffect(() => {
        // Инициализируем тему при монтировании компонента
        initializeTheme();
    }, [initializeTheme]);
    
    return <>{children}</>;
}