/**
 * Validators — form validation helpers
 */

export const validators = {
    email: (value: string): string | null => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email is required';
        if (!regex.test(value)) return 'Invalid email format';
        return null;
    },

    password: (value: string): string | null => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
    },

    fullName: (value: string): string | null => {
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
    },

    required: (value: string, fieldName = 'This field'): string | null => {
        if (!value || !value.trim()) return `${fieldName} is required`;
        return null;
    },
};
