import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { user, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User is not signed in and trying to access a secure screen
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // User is signed in and trying to access auth screen
      // Redirect based on role
      if (role === 'CLIENT') {
        router.replace('/client/home');
      } else if (role === 'DRIVER') {
        router.replace('/driver/home');
      } else if (role === 'MECHANIC') {
        router.replace('/mechanic/home');
      } else {
        // No role assigned yet, maybe keep them in a loading or setup screen
        // For now fallback to client
        router.replace('/client/home');
      }
    } else if (user && !inAuthGroup && segments.length === 0) {
      // At root level with user authenticated, redirect appropriately
      if (role === 'CLIENT') router.replace('/client/home');
      else if (role === 'DRIVER') router.replace('/driver/home');
      else if (role === 'MECHANIC') router.replace('/mechanic/home');
      else router.replace('/client/home');
    }
  }, [user, role, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
