import { createContext, useContext, useEffect, useRef, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('paperpal-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const rafRef = useRef(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('paperpal-theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;

        const updateCursor = (event) => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const x = (event.clientX / window.innerWidth) * 100;
                const y = (event.clientY / window.innerHeight) * 100;
                root.style.setProperty('--cursor-x', `${x}%`);
                root.style.setProperty('--cursor-y', `${y}%`);
            });
        };

        const resetCursor = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            root.style.setProperty('--cursor-x', '50%');
            root.style.setProperty('--cursor-y', '50%');
        };

        window.addEventListener('mousemove', updateCursor);
        window.addEventListener('mouseleave', resetCursor);

        return () => {
            window.removeEventListener('mousemove', updateCursor);
            window.removeEventListener('mouseleave', resetCursor);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
