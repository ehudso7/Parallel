import { createContext, useContext, useState, ReactNode } from 'react';

interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceLight: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    textLight: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  gradients: {
    primary: [string, string];
    secondary: [string, string];
    accent: [string, string];
  };
}

const darkTheme: Theme = {
  colors: {
    background: '#0f0a1e',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceLight: 'rgba(255, 255, 255, 0.1)',
    primary: '#8b5cf6',
    secondary: '#d946ef',
    accent: '#06b6d4',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textLight: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  gradients: {
    primary: ['#8b5cf6', '#d946ef'],
    secondary: ['#06b6d4', '#3b82f6'],
    accent: ['#f59e0b', '#ef4444'],
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // For now, only dark theme is supported
  const theme = darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
