/**
 * Prescripto Design System — Color Palette
 * Glassmorphism Medical UI Support
 */

export const colors = {
    // Primary (teal/cyan medical accent)
    primary: {
        300: '#3EDBF0', // Cyan target (light)
        400: '#1FA3C6', // Teal
        500: '#1FA3C6',
        600: '#0F5C73', // Deep blue
        700: '#072A33', // Dark navy
    },

    // Secondary (glass accents)
    secondary: {
        400: '#3EDBF0',
        500: '#1FA3C6',
    },

    // Background gradient
    background: {
        top: '#0A3F4D',
        bottom: '#072A33',
    },

    // Glass variables
    glass: {
        background: 'rgba(255, 255, 255, 0.12)',
        backgroundDark: 'rgba(0, 0, 0, 0.25)',
        border: 'rgba(255, 255, 255, 0.15)',
        borderHighlight: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.1)',
        glow: 'rgba(62, 219, 240, 0.4)', // cyan glow for active elements
    },

    // Gradients for CTA
    gradient: {
        primary: ['#1FA3C6', '#3EDBF0'] as const,
    },

    // Neutrals
    dark: {
        bg: '#0A3F4D',
        surface: 'rgba(255, 255, 255, 0.08)',
        surfaceElevated: 'rgba(255, 255, 255, 0.15)',
        border: 'rgba(255, 255, 255, 0.15)',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        textMuted: 'rgba(255, 255, 255, 0.5)',
    },
    light: {
        // Fallback or mapped to dark as we only have dark glass ui
        bg: '#0A3F4D',
        surface: 'rgba(255, 255, 255, 0.08)',
        surfaceElevated: 'rgba(255, 255, 255, 0.15)',
        border: 'rgba(255, 255, 255, 0.15)',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        textMuted: 'rgba(255, 255, 255, 0.5)',
    },

    // Common
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Text overrides for light over dark
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',

    // Success / Error / Warning
    success: '#4CAF50',
    error: '#EF5350',
    warning: '#FF9800',
    info: '#3EDBF0',

    // Confidence levels
    confidence: {
        high: '#4CAF50',    // >= 0.8
        medium: '#FF9800',  // >= 0.5
        low: '#EF5350',     // < 0.5
    },
} as const;

export type ColorTheme = typeof colors;
