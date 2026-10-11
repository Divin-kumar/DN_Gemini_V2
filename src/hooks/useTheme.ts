import { useEffect, useState } from 'react';
import { getAppSettings, updateAppSettings } from '../db/repository';

export function useTheme() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  useEffect(() => {
    getAppSettings().then(settings => {
      setTheme(settings.theme || 'system');
      applyTheme(settings.theme || 'system');
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyTheme = (t: 'system' | 'light' | 'dark') => {
    const root = document.documentElement;
    const isDark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const changeTheme = async (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    await updateAppSettings({ theme: newTheme });
  };

  return { theme, changeTheme };
}
