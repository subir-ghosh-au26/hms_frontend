import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context with a default value
const ThemeContext = createContext(null);

// Create the provider component
export const ThemeProvider = ({ children }) => {
    // State to hold the current theme. It reads from localStorage to persist the choice.
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Effect to apply the theme to the body element whenever the theme state changes
    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); // Save the choice to localStorage
    }, [theme]);

    // Function to toggle the theme
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // The value that will be available to all consuming components
    const value = { theme, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook for easy access to the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === null) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};