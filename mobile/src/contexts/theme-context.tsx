import React, { createContext, useContext, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

export interface ThemeColors {
    textPrimary:   string;
    textSecondary: string;
    textMuted:     string;
    cardBg:        string;
    cardBorder:    string;
    inputBg:       string;
}

const LIGHT: ThemeColors = {
    textPrimary:   '#0B1D2E',
    textSecondary: 'rgba(11,29,46,0.60)',
    textMuted:     'rgba(11,29,46,0.40)',
    cardBg:        'rgba(255,255,255,0.55)',
    cardBorder:    'rgba(11,29,46,0.18)',
    inputBg:       'rgba(255,255,255,0.50)',
};

const DARK: ThemeColors = {
    textPrimary:   '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textMuted:     'rgba(255,255,255,0.40)',
    cardBg:        'rgba(255,255,255,0.10)',
    cardBorder:    'rgba(255,255,255,0.20)',
    inputBg:       'rgba(255,255,255,0.08)',
};

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    isDark: false,
    colors: LIGHT,
    toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const isDark = theme === 'dark';

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, isDark, colors: isDark ? DARK : LIGHT, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
