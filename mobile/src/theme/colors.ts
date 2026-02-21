/**
 * Prescripto Design System — Color Palette
 * Modern medical app with dark/light support
 */

export const colors = {
    // Primary (teal/cyan medical accent)
    primary: {
        50: '#E0F7FA',
        100: '#B2EBF2',
        200: '#80DEEA',
        300: '#4DD0E1',
        400: '#26C6DA',
        500: '#00ACC1',
        600: '#0097A7',
        700: '#00838F',
        800: '#006064',
        900: '#004D40',
    },

    // Secondary (indigo)
    secondary: {
        50: '#E8EAF6',
        100: '#C5CAE9',
        200: '#9FA8DA',
        300: '#7986CB',
        400: '#5C6BC0',
        500: '#3F51B5',
        600: '#3949AB',
        700: '#303F9F',
        800: '#283593',
        900: '#1A237E',
    },

    // Accent (amber/gold for highlights)
    accent: {
        400: '#FFCA28',
        500: '#FFC107',
        600: '#FFB300',
    },

    // Success / Error / Warning
    success: '#4CAF50',
    error: '#EF5350',
    warning: '#FF9800',
    info: '#29B6F6',

    // Neutrals (dark theme base)
    dark: {
        bg: '#0F172A',
        surface: '#1E293B',
        surfaceElevated: '#273548',
        border: '#334155',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
    },

    // Neutrals (light theme base)
    light: {
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceElevated: '#F1F5F9',
        border: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
    },

    // Common
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Confidence levels
    confidence: {
        high: '#4CAF50',    // >= 0.8
        medium: '#FF9800',  // >= 0.5
        low: '#EF5350',     // < 0.5
    },
} as const;

export type ColorTheme = typeof colors;
