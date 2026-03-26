import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import MekSetup from '@src/app/mek';
import { LoadingScreen } from './LoadingScreen';
import { useAutofillStore } from '@src/store/autofill';

type Props = {
  children: React.ReactNode;
};

export default function Redirect({ children }: Props) {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, hasMek } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isAutofilling } = useAutofillStore();

  useEffect(() => {
    // Wait for the auth store to finish loading its initial state
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    // Logic for redirection based on authentication state
    if (!isAuthenticated && !inAuthGroup) {
      // User is not logged in and trying to access app content: redirect to login
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // User is logged in but on an auth page: redirect to home
      router.replace('/');
    }

    // Give the router and segments a moment to stabilize after a potential redirect
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, segments, router]);

  // While we are loading auth state or checking for redirects, show the splash/loading screen
  const showLoading = isLoading || isCheckingAuth;

  if (showLoading && !isAutofilling) {
    return <LoadingScreen message="Verifying session..." />;
  }

  const inAuthGroup = segments[0] === 'auth';

  // If the user is authenticated but hasn't set up or unlocked their MEK (Encryption Key),
  // they must do so before they can view the children (Vault content).
  // We only show this if they aren't on a login/signup screen.
  if (isAuthenticated && !hasMek && !inAuthGroup) {
    return <MekSetup />;
  }

  return <>{children}</>;
}
