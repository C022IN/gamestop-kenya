import React, { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { clearToken, getStoredToken } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import DetailScreen from '@/screens/DetailScreen';
import PlayerScreen from '@/screens/PlayerScreen';
import SearchScreen from '@/screens/SearchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSplashReady = useCallback((hasToken: boolean) => {
    setLoggedIn(hasToken);
    setReady(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await clearToken();
    setLoggedIn(false);
  }, []);

  if (!ready) return <SplashScreen onReady={handleSplashReady} />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          // Crossfade is more appropriate than horizontal slide on TV where
          // navigation is D-pad driven rather than gesture driven.
          animation: 'fade',
          animationDuration: 220,
        }}
      >
        {loggedIn ? (
          <>
            <Stack.Screen name="Home">
              {props => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
          </>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onSuccess={() => setLoggedIn(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
