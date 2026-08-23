import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Named import for LoginScreen
import { LoginScreen } from '../screens/LoginScreen';

// Tab navigator for authenticated users (contains Dashboard, CheckIn, History, Profile)
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#006B3F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && token ? (
          <Stack.Screen name="MainApp" component={AppTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}