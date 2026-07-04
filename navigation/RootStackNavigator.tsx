import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "../navigation/MainTabNavigator";
import ProfileSelectionScreen from "../screens/ProfileSelectionScreen";
import NewWorkoutScreen from "../screens/NewWorkoutScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import { useScreenOptions } from "../hooks/useScreenOptions";
import { useUser } from "../context/UserContext";
import { useTheme } from "../hooks/useTheme";

export type RootStackParamList = {
  ProfileSelection: undefined;
  Main: undefined;
  NewWorkout: { programId?: string } | undefined;
  WorkoutDetail: { workoutId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { currentUser } = useUser();
  const { theme, isDark } = useTheme();

  const newWorkoutHeaderOptions = {
    ...screenOptions,
    headerTintColor: isDark ? "#000000" : screenOptions.headerTintColor,
    headerTitleStyle: {
      ...(screenOptions.headerTitleStyle as object),
      color: isDark ? "#000000" : screenOptions.headerTintColor,
    },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {currentUser ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewWorkout"
            component={NewWorkoutScreen}
            options={{
              ...newWorkoutHeaderOptions,
              headerTitle: "New Workout",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="WorkoutDetail"
            component={WorkoutDetailScreen}
            options={{
              headerTitle: "Workout Details",
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="ProfileSelection"
          component={ProfileSelectionScreen}
          options={{ headerShown: true }}
        />
      )}
    </Stack.Navigator>
  );
}
