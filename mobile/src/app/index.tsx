/**
 * Index route — redirects to home or login
 */

import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/(auth)/login" />;
}
