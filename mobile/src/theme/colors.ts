/**
 * Prescripto Design System — Deep Blue Glassmorphism Palette
 * Dark medical-luxury aesthetic inspired by premium healthcare UI
 */

export const colors = {
    // Primary — deep medical blue accent
    primary: {
        300: '#7BC8FF', // light accent on dark bg
        400: '#4FB3FF', // main accent blue
        500: '#2196F3', // medium blue
        600: '#1565C0', // deep blue
        700: '#0D47A1', // darkest blue
    },

    secondary: {
        400: '#4FB3FF',
        500: '#2196F3',
    },

    background: {
        top:    '#0A3558',
        bottom: '#0F4C81',
    },

    // Glass — dark frosted glass on deep blue
    glass: {
        background:      'rgba(255,255,255,0.10)',
        backgroundDark:  'rgba(255,255,255,0.07)',
        border:          'rgba(255,255,255,0.15)',
        borderHighlight: 'rgba(255,255,255,0.22)',
        inputBg:         'rgba(255,255,255,0.08)',
        glow:            'rgba(79,179,255,0.45)',
    },

    gradient: {
        primary:    ['#1E6FB7', '#4FB3FF'] as const,
        background: ['#081E36', '#0F4C81', '#1565C0'] as const,
        card:       ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] as const,
    },

    // Neutrals — always white text on dark blue bg
    dark: {
        bg:              '#081E36',
        surface:         'rgba(255,255,255,0.10)',
        surfaceElevated: 'rgba(255,255,255,0.15)',
        border:          'rgba(255,255,255,0.15)',
        textPrimary:     '#FFFFFF',
        textSecondary:   'rgba(255,255,255,0.75)',
        textMuted:       'rgba(255,255,255,0.50)',
    },
    light: {
        bg:              '#0F4C81',
        surface:         'rgba(255,255,255,0.10)',
        surfaceElevated: 'rgba(255,255,255,0.15)',
        border:          'rgba(255,255,255,0.15)',
        textPrimary:     '#FFFFFF',
        textSecondary:   'rgba(255,255,255,0.75)',
        textMuted:       'rgba(255,255,255,0.50)',
    },

    // Common
    white:       '#FFFFFF',
    black:       '#000000',
    transparent: 'transparent',

    // Global text tokens — white on dark bg
    textPrimary:   '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.75)',
    textMuted:     'rgba(255,255,255,0.50)',

    // Status
    success: '#76FFB4',
    error:   '#FF6B8A',
    warning: '#FFD96E',
    info:    '#4FB3FF',

    confidence: {
        high:   '#76FFB4',
        medium: '#FFD96E',
        low:    '#FF6B8A',
    },
} as const;

export type ColorTheme = typeof colors;
