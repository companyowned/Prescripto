/**
 * Index route — intentionally empty.
 * AuthGate in _layout.tsx reads the stored token and redirects to the correct
 * screen (onboarding, login, or home) once the async auth check completes.
 */

export default function Index() {
    return null;
}
