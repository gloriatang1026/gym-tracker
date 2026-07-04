import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Pressable, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DashboardScreen from "../screens/DashboardScreen";
import WorkoutHistoryScreen from "../screens/WorkoutHistoryScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { useScreenOptions, getHeaderForegroundColor } from "../hooks/useScreenOptions";
import { Spacing } from "../constants/theme";

export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_CONTENT_HEIGHT = 52;

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { currentUser } = useUser();
  const screenOptions = useScreenOptions();
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = insets.bottom + Spacing.md;
  const headerTitleColor = isDark ? "#000000" : getHeaderForegroundColor(theme, isDark);

  if (!currentUser) return null;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding + Spacing.xs,
          paddingTop: Spacing.xs,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={WorkoutHistoryScreen}
        options={{
          title: "History",
          headerTitle: () => (
            <View pointerEvents="none" style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: headerTitleColor, fontSize: 17, fontWeight: "600" }}>
                Workout History
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: "Progress",
          headerTitle: () => (
            <View pointerEvents="none" style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: headerTitleColor, fontSize: 17, fontWeight: "600" }}>
                Your Progress
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: () => (
            <ProfileAvatar avatar={currentUser.avatar} customPhotoUri={currentUser.customPhotoUri} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
