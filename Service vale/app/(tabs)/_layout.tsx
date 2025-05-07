import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    </Tabs>
  );
}
