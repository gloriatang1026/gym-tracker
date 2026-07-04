import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './RootStackNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToNewWorkout(params?: { programId?: string }) {
  let attempts = 0;

  const attempt = () => {
    attempts += 1;

    if (!navigationRef.isReady() || !navigationRef.current) {
      (globalThis as any).__navDebug = { step: 'not-ready', attempts };
      if (attempts < 8) {
        setTimeout(attempt, 120);
      }
      return false;
    }

    try {
      const navigator = navigationRef.current as any;
      (globalThis as any).__navDebug = {
        step: 'attempt',
        attempts,
        ready: navigationRef.isReady(),
        route: navigator.getCurrentRoute?.()?.name,
      };
      if (typeof navigator.dispatch === 'function') {
        navigator.dispatch(CommonActions.navigate({ name: 'NewWorkout', params }));
        (globalThis as any).__navDebug = {
          step: 'dispatched',
          attempts,
          ready: navigationRef.isReady(),
          route: navigator.getCurrentRoute?.()?.name,
        };
        return true;
      }

      if (typeof navigator.navigate === 'function') {
        navigator.navigate('NewWorkout', params);
        (globalThis as any).__navDebug = {
          step: 'navigated',
          attempts,
          ready: navigationRef.isReady(),
          route: navigator.getCurrentRoute?.()?.name,
        };
        return true;
      }

      return false;
    } catch (error) {
      (globalThis as any).__navDebug = { step: 'error', attempts, error: String(error) };
      console.warn('[navigation] failed to open NewWorkout', error);
      return false;
    }
  };

  if (attempt()) return;

  setTimeout(() => {
    attempt();
  }, 150);
}
