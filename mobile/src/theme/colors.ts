/**
 * Prescripto Design System — Color Palette
 * Light glassmorphism on bright background
 */

export const colors = {
    // Primary (teal/cyan medical accent)
    primary: {
        300: '#1AABCF', // readable teal on light bg
        400: '#1FA3C6',
        500: '#1890B0',
        600: '#0F5C73',
        700: '#072A33',
    },

    secondary: {
        400: '#1AABCF',
        500: '#1FA3C6',
    },

    background: {
        top: '#D6F0F7',
        bottom: '#B8E4F0',
    },

    // Glass variables — tuned for a bright background
    glass: {
        background:     'rgba(255,255,255,0.55)',
        backgroundDark: 'rgba(255,255,255,0.40)',
        border:         'rgba(11,29,46,0.12)',
        borderHighlight:'rgba(11,29,46,0.18)',
        inputBg:        'rgba(255,255,255,0.50)',
        glow:           'rgba(26,171,207,0.35)',
    },

    gradient: {
        primary: ['#1FA3C6', '#3EDBF0'] as const,
    },

    // Neutrals
    dark: {
        bg:              '#0B1D2E',
        surface:         'rgba(255,255,255,0.55)',
        surfaceElevated: 'rgba(255,255,255,0.70)',
        border:          'rgba(11,29,46,0.12)',
        textPrimary:     '#0B1D2E',
        textSecondary:   'rgba(11,29,46,0.60)',
        textMuted:       'rgba(11,29,46,0.40)',
    },
    light: {
        bg:              '#0B1D2E',
        surface:         'rgba(255,255,255,0.55)',
        surfaceElevated: 'rgba(255,255,255,0.70)',
        border:          'rgba(11,29,46,0.12)',
        textPrimary:     '#0B1D2E',
        textSecondary:   'rgba(11,29,46,0.60)',
        textMuted:       'rgba(11,29,46,0.40)',
    },

    // Common
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Global text tokens
    textPrimary:   '#0B1D2E',
    textSecondary: 'rgba(11,29,46,0.60)',
    textMuted:     'rgba(11,29,46,0.40)',

    // Status
    success: '#0E9F6E',
    error:   '#E53E3E',
    warning: '#D97706',
    info:    '#1AABCF',

    confidence: {
        high:   '#0E9F6E',
        medium: '#D97706',
        low:    '#E53E3E',
    },
} as const;

export type ColorTheme = typeof colors;
