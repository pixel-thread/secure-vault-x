import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../../store/auth";

type Props = {
 children: React.ReactNode
}

export default function Redirect({ children }: Props) {
 const segments = useSegments();
 const router = useRouter();
 const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

 useEffect(() => {
  const inAuthGroup = segments[0] === 'auth';

  if (
   // If the user is not authenticated and the initial segment is not the auth group.
   !isAuthenticated &&
   !inAuthGroup
  ) {
   // Redirect to the login page.
   router.replace('/auth');
  } else if (isAuthenticated && inAuthGroup) {
   // Redirect away from the login page to the Vault / root.
   router.replace('/');
  }
 }, [isAuthenticated, segments, router]);

 return <>{children}</>
}