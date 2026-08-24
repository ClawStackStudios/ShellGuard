import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';

export function useViewTransitionTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('css-theme') || localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const applyThemeClasses = useCallback((newTheme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('css-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    } catch {
      // ignore storage access errors if any
    }
  }, []);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'light' | 'dark' }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
        applyThemeClasses(customEvent.detail.theme);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'css-theme' || e.key === 'theme') {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue);
          applyThemeClasses(e.newValue);
        }
      }
    };

    window.addEventListener('shellguard-theme-changed', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    // Initial sync on mount
    const saved = localStorage.getItem('css-theme') || localStorage.getItem('theme');
    const currentTheme: 'light' | 'dark' = (saved === 'light' || saved === 'dark')
      ? saved
      : (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    setTheme(currentTheme);
    applyThemeClasses(currentTheme);

    return () => {
      window.removeEventListener('shellguard-theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [applyThemeClasses]);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyThemeClasses(newTheme);

    // Broadcast change to keep all instances of ThemeToggle in sync
    window.dispatchEvent(new CustomEvent('shellguard-theme-changed', { 
      detail: { theme: newTheme } 
    }));
  };

  const toggleTheme = async (x = 0, y = 0) => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';

    // @ts-ignore
    if (typeof document === 'undefined' || !document.startViewTransition) {
      updateTheme(nextTheme);
      return;
    }

    try {
      // @ts-ignore
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          updateTheme(nextTheme);
        });
      });

      await transition.ready;

      const right = window.innerWidth - x;
      const bottom = window.innerHeight - y;
      const maxRadius = Math.hypot(
        Math.max(x, right),
        Math.max(y, bottom)
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 950, // Balanced, smooth liquid roll (smooth and fluid)
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch {
      updateTheme(nextTheme);
    }
  };

  return { theme, toggleTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useViewTransitionTheme();

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    toggleTheme(x, y);
  };

  return (
    <button 
      onClick={handleClick}
      type="button"
      className={`w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-[#e4048a] hover:text-[#e4048a] dark:hover:text-[#e4048a] transition-all flex-shrink-0 cursor-pointer ${className || ''}`}
      aria-label="Toggle light/dark mode"
      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-300 dark:text-claw-cyan transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-amber-500 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}

