import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { clearToken, getStoredToken } from '@/api/client';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import DetailScreen from '@/screens/DetailScreen';
import PlayerScreen from '@/screens/PlayerScreen';
import SearchScreen from '@/screens/SearchScreen';

const Stack = createStackNavigator();

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
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#000' } }}>
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
