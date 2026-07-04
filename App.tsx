// App.tsx — full working version

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Comment out to avoid Expo Go linking error
// import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ErrorBoundary } from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';
import { ThemePreferenceProvider } from './context/ThemePreferenceContext';
import { ActiveWorkoutProvider } from './context/ActiveWorkoutContext';
import { ContinueWorkoutFAB } from './components/ContinueWorkoutFAB';
import RootStackNavigator from './navigation/RootStackNavigator';
import { navigationRef } from './navigation/navigationService';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.touchAction = 'manipulation';
      document.documentElement.style.setProperty('-webkit-tap-highlight-color', 'transparent');

      // Fix for web/PWA touch issues
      document.documentElement.style.setProperty('touch-action', 'manipulation');

      // Prevent zoom on double tap
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);

      // Fix touch events on web
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          -webkit-tap-highlight-color: transparent;
        }
        button, [role="button"] {
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <ThemePreferenceProvider>
      <UserProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            {/* <KeyboardProvider> — uncomment only in custom dev client */}
            <ErrorBoundary>
              <NavigationContainer ref={navigationRef}>
                <ActiveWorkoutProvider>
                  <View style={styles.navRoot}>
                    <RootStackNavigator />
                    <ContinueWorkoutFAB />
                  </View>
                </ActiveWorkoutProvider>
              </NavigationContainer>
            </ErrorBoundary>
            {/* </KeyboardProvider> */}
          </GestureHandlerRootView>

          <StatusBar style="auto" />
        </SafeAreaProvider>
      </UserProvider>
    </ThemePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navRoot: {
    flex: 1,
  },
});