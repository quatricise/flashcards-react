import { useEffect, useState } from 'react';
import "./ThemeToggle.css"

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const iconLight = <div className="icon light"></div>
  const iconDark = <div className="icon dark"></div>
  return (
    <div className='button--theme-toggle' onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}>
      {theme === "light" ? iconLight : iconDark}
    </div>
  );
};
