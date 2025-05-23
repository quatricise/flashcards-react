import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}>
      {theme === "light" ? "Light" : "Dark"}
    </button>
  );
};
