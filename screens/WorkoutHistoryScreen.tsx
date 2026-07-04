import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { Card } from "../components/Card";
import { WorkoutTypeBadge } from "../components/WorkoutTypeBadge";
import { EmptyState } from "../components/EmptyState";
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { Spacing, BorderRadius } from "../constants/theme";
import { Workout } from "../lib/storage";
import { RootStackParamList } from "../navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function WorkoutListItem({
  workout,
  onPress,
  index,
}: {
  workout: Workout;
  onPress: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const date = new Date(workout.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Card style={styles.workoutCard} onPress={onPress}>
        <View style={styles.workoutHeader}>
          <WorkoutTypeBadge type={workout.type} customType={workout.customType} />
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
        <ThemedText style={styles.gymLocation} numberOfLines={1}>
          {workout.gymLocation}
        </ThemedText>
        <View style={styles.workoutMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.metaText, { color: theme.textSecondary }]}
            >
              {formattedDate}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.metaText, { color: theme.textSecondary }]}
            >
              {formattedTime}
            </ThemedText>
          </View>
        </View>
        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <ThemedText type="h4">{workout.exercises.length}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Exercises
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h4">
              {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Sets
            </ThemedText>
          </View>
          {workout.duration ? (
            <>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <ThemedText type="h4">
                  {Math.round(workout.duration / 60)}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  Minutes
                </ThemedText>
              </View>
            </>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

export default function WorkoutHistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { workouts, refreshWorkouts } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWorkouts();
    setRefreshing(false);
  }, [refreshWorkouts]);

  const filteredWorkouts = searchQuery
    ? workouts.filter(
        (w) =>
          w.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.gymLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.exercises.some((e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : workouts;

  const handleViewWorkout = (workout: Workout) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WorkoutDetail", { workoutId: workout.id });
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          filteredWorkouts.length === 0 && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search workouts..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery ? (
              <Feather
                name="x"
                size={20}
                color={theme.textSecondary}
                onPress={() => setSearchQuery("")}
              />
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <WorkoutListItem
            workout={item}
            onPress={() => handleViewWorkout(item)}
            index={index}
          />
        )}
        ListEmptyComponent={
  <EmptyState
  
    title="No Workout History"
    message={
      searchQuery
        ? "No workouts match your search"
        : "Your completed workouts will appear here"
    }
  />
}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontSize: 16,
  },
  workoutCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  gymLocation: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  workoutMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 13,
  },
  workoutStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
  },
});