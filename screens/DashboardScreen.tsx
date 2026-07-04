  // DashboardScreen.tsx — 最終版：右上角用戶頭像可點回 ProfileSelection

  import React, { useState, useEffect } from 'react';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Modal,
    Pressable,
  } from 'react-native';
  import { Feather } from '@expo/vector-icons';
  import { useNavigation } from '@react-navigation/native';
  import { NativeStackNavigationProp } from '@react-navigation/native-stack';
  import { RootStackParamList } from '../navigation/RootStackNavigator';
  import { navigateToNewWorkout } from '../navigation/navigationService';
  import { useTheme } from '../hooks/useTheme';
  import { useUser } from '../context/UserContext';
  import { ThemedText } from '../components/ThemedText';
  import { PickerModal } from '../components/PickerModal';
  import { WorkoutTypeBadge } from '../components/WorkoutTypeBadge';
  import { Spacing, BorderRadius } from '../constants/theme';
  import { Workout, getWorkoutsThisWeek, getWorkoutsThisMonth } from '../lib/storage';
  import { formatLocalDateKey, workoutDateToLocalKey } from '../lib/dateUtils';

  // Helper functions (unchanged)
  const groupWorkoutsByDate = (workouts: Workout[]) => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w) => {
      const date = workoutDateToLocalKey(w.date);
      if (!map[date]) map[date] = [];
      map[date].push(w);
    });
    return map;
  };

  const getWorkoutColor = (type: string, theme: any) => {
    switch (type.toLowerCase()) {
      case 'full body':
        return '#9b59b6';
      case 'push day':
        return '#e74c3c';
      case 'pull day':
        return '#3498db';
      case 'leg day':
        return '#2ecc71';
      case 'custom':
        return '#f39c12';
      default:
        return theme.primary || '#ff3b30';
    }
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const CALENDAR_EARLIEST = new Date(2026, 0, 1);

  const formatMonthYearLabel = (date: Date) =>
    `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  const buildMonthYearOptions = () => {
    const options: string[] = [];
    const now = new Date();
    const endYear = Math.max(now.getFullYear() + 1, 2026);
    let year = 2026;
    let month = 0;
    while (year < endYear || (year === endYear && month <= 11)) {
      options.push(`${MONTH_NAMES[month]} ${year}`);
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    return options;
  };

  const parseMonthYearLabel = (label: string): Date | null => {
    const space = label.lastIndexOf(' ');
    if (space <= 0) return null;
    const monthStr = label.slice(0, space);
    const year = parseInt(label.slice(space + 1), 10);
    const monthIndex = MONTH_NAMES.indexOf(monthStr);
    if (monthIndex < 0 || isNaN(year)) return null;
    return new Date(year, monthIndex, 1);
  };

  const clampToCalendarRange = (date: Date) => {
    if (date < CALENDAR_EARLIEST) return new Date(CALENDAR_EARLIEST);
    return date;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    // Monday-first grid (headers: Mon … Sun)
    const jsDay = firstDay.getDay();
    const leadingBlanks = jsDay === 0 ? 6 : jsDay - 1;

    for (let i = 0; i < leadingBlanks; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

  export default function DashboardScreen() {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { currentUser, workouts, refreshWorkouts } = useUser();

    const [currentMonth, setCurrentMonth] = useState(() => {
      const now = new Date();
      return now < CALENDAR_EARLIEST ? new Date(CALENDAR_EARLIEST) : now;
    });
    const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, Workout[]>>({});
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);
    const [workoutDetailModalVisible, setWorkoutDetailModalVisible] = useState(false);
    const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<{ dateStr: string; workouts: Workout[] } | null>(null);

    useEffect(() => {
      refreshWorkouts();
    }, [refreshWorkouts]);

    useEffect(() => {
      if (workouts) {
        setWorkoutsByDate(groupWorkoutsByDate(workouts));
      }
    }, [workouts]);

  // 不覆寫 headerRight，使用 MainTabNavigator 的設定（Pressable 在 iOS 上觸控較可靠）

  const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const today = formatLocalDateKey(new Date());
    const workoutsThisWeek = getWorkoutsThisWeek(workouts);
    const workoutsThisMonth = getWorkoutsThisMonth(workouts);

    const goToPrevMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      if (newDate >= CALENDAR_EARLIEST) {
        setCurrentMonth(newDate);
      }
    };

    const goToNextMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
    };

    const monthYearOptions = buildMonthYearOptions();
    const selectedMonthYear = formatMonthYearLabel(currentMonth);

    const handleMonthYearSelect = (value: string) => {
      const parsed = parseMonthYearLabel(value);
      if (parsed) {
        setCurrentMonth(clampToCalendarRange(parsed));
      }
      setMonthPickerVisible(false);
    };

    const formatWorkoutDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const handleStartWorkout = () => {
      (globalThis as any).__navDebug = { step: 'dashboard-click' };
      navigateToNewWorkout();
    };

    return (
      <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing["3xl"] }}
      >
        {/* Greeting & Stats */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing["5xl"] }]}>
          <ThemedText type="h3" style={{ color: theme.text }}>
            Hi {currentUser?.name || 'User'}!
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Ready to crush your workout?
          </ThemedText>

          <View style={[styles.statsRow, { marginTop: Spacing.xl }]}>
            <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
              <Text style={[
                styles.statNumber,
                { color: theme.primary || '#ff3b30' }
              ]}>
                {workoutsThisWeek}
              </Text>
              <ThemedText style={[styles.statLabel, { color: theme.text }]}>
                This Week
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
              <Text style={[
                styles.statNumber,
                { color: theme.primary || '#ff3b30' }
              ]}>
                {workoutsThisMonth}
              </Text>
              <ThemedText style={[styles.statLabel, { color: theme.text }]}>
                This Month
              </ThemedText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            { marginTop: Spacing.xl, backgroundColor: theme.primary || '#ff3b30' }
          ]}
          onPress={handleStartWorkout}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Start Workout</Text>
        </TouchableOpacity>

        {/* Calendar Section */}
        <View style={[
          styles.calendarCard,
          { marginTop: Spacing.xl, backgroundColor: theme.backgroundDefault },
        ]}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPrevMonth}>
              <Feather name="chevron-left" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            <Pressable
              onPress={() => setMonthPickerVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <ThemedText type="h4" style={{ color: theme.text }}>
                {monthName}
              </ThemedText>
              <Feather name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>

            <TouchableOpacity onPress={goToNextMonth}>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <ThemedText key={day} type="small" style={[styles.weekday, { color: theme.textSecondary }]}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={styles.daysContainer}>
            {days.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.emptyCell} />;

              const dateStr = formatLocalDateKey(day);
              const dayWorkouts = workoutsByDate[dateStr] || [];
              const hasWorkout = dayWorkouts.length > 0;
              const isToday = dateStr === today;

              const workoutType = hasWorkout ? dayWorkouts[0]?.type || 'Custom' : '';
              const color = getWorkoutColor(workoutType, theme);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday && {
                      backgroundColor: theme.primary + "20",
                      borderColor: theme.primary,
                    },
                    hasWorkout && { borderColor: color + '80' },
                  ]}
                  onPress={() => {
                    if (hasWorkout) {
                      setSelectedDateWorkouts({ dateStr, workouts: dayWorkouts });
                      setWorkoutDetailModalVisible(true);
                    }
                  }}
                  disabled={!hasWorkout}
                >
                  <Text style={[
                    styles.dayNumber,
                    { color: theme.text },
                    isToday && { color: theme.primary, fontWeight: '700' },
                    hasWorkout && { color: '#fff', fontWeight: 'bold' },
                  ]}>
                    {day.getDate()}
                  </Text>

                  {hasWorkout && (
                    <View style={[
                      styles.workoutIndicator,
                      { backgroundColor: color }
                    ]}>
                      <Text style={styles.indicatorText}>
                        {workoutType.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: Spacing["2xl"] }} />
      </ScrollView>

      {/* Month/Year Picker Modal */}
      <PickerModal
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={handleMonthYearSelect}
        options={monthYearOptions}
        title="Select Month & Year"
        selectedValue={selectedMonthYear}
      />

      {/* Workout Detail Popup Modal */}
      <Modal
        visible={workoutDetailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWorkoutDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWorkoutDetailModalVisible(false)}
          />
          <View style={[styles.workoutModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.workoutModalHeader}>
              <ThemedText type="h4">
                {selectedDateWorkouts ? formatWorkoutDate(selectedDateWorkouts.dateStr) : ''}
              </ThemedText>
              <Pressable onPress={() => setWorkoutDetailModalVisible(false)} hitSlop={16}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.workoutModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {(selectedDateWorkouts?.workouts ?? []).map((workout) => {
                const date = new Date(workout.date);
                const timeStr = date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <View
                    key={workout.id}
                    style={[
                      styles.workoutModalCard,
                      { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    ]}
                  >
                    <WorkoutTypeBadge type={workout.type} customType={workout.customType} />
                    <ThemedText type="h4" style={{ marginTop: Spacing.sm }}>
                      {workout.gymLocation}
                    </ThemedText>
                    <View style={[styles.workoutMetaRow, { marginTop: Spacing.sm }]}>
                      <View style={styles.workoutMetaItem}>
                        <Feather name="clock" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                          {timeStr}
                          {workout.duration ? ` · ${Math.round(workout.duration / 60)} min` : ''}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                      {workout.exercises.length} exercise(s):{' '}
                      {workout.exercises.map((e) => e.name).join(', ')}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.viewDetailBtn, { backgroundColor: theme.primary || '#ff3b30' }]}
                      onPress={() => {
                        setWorkoutDetailModalVisible(false);
                        navigation.navigate('WorkoutDetail', { workoutId: workout.id });
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>View Details</Text>
                      <Feather name="chevron-right" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </>
    );
}

// ────────────────────────────────────────────────
// Styles — static only
// ────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },

    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: 400,
      gap: Spacing.md,
    },

    statCard: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      minHeight: 76,
    },

    statNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },

    statLabel: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 18,
    },

    calendarCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    monthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    weekdaysRow: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
    },
    daysContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.285714%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 12,
      marginVertical: 2,
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: '500',
    },
    workoutIndicator: {
      position: 'absolute',
      bottom: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    indicatorText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyCell: {
      width: '14.285714%',
      aspectRatio: 1,
    },
    startButton: {
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    workoutModalContent: {
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      maxHeight: '75%',
      paddingTop: Spacing.lg,
      paddingBottom: Spacing["2xl"],
    },
    workoutModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    workoutModalScroll: {
      paddingHorizontal: Spacing.lg,
      maxHeight: 400,
    },
    workoutModalCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
    },
    workoutMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    workoutMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewDetailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.md,
    },
  });