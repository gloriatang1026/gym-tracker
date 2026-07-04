import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Linking,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStackNavigator";
import { navigateToNewWorkout } from "../navigation/navigationService";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useThemePreference } from "../context/ThemePreferenceContext";
import { AppThemePreference } from "../constants/theme";
import { useUser } from "../context/UserContext";
import { Spacing, BorderRadius } from "../constants/theme";
import {
  UserProfile,
  ProgramLibrary,
  ProgramLibraryExercise,
  getProgramLibraries,
  saveProgramLibrary,
  deleteProgramLibrary,
  forceSave,
  exportAllData,
  importData,
  WORKOUT_TYPES,
  EQUIPMENT_TYPES,
} from "../lib/storage";
import { MUSCLE_GROUPS } from "../lib/workoutData";
import { showAlert } from "../lib/alert";

const AVATAR_OPTIONS = ["fitness", "weight", "run", "heart", "star", "user"];
const SEX_OPTIONS = ["M", "F"];

const THEME_OPTIONS: {
  id: AppThemePreference;
  label: string;
  description: string;
  swatches: string[];
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Default bright theme",
    swatches: ["#FFFFFF", "#5cc1cb", "#F5F5F5"],
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark backgrounds, easy on eyes",
    swatches: ["#1A1A1A", "#5cc1cb", "#2C2C2C"],
  },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, updateProfile, switchProfile } = useUser();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("fitness");
  const [editSex, setEditSex] = useState<"M" | "F" | undefined>(undefined);
  const [editCustomPhotoUri, setEditCustomPhotoUri] = useState<string | undefined>(undefined);

  const [programLibraries, setProgramLibraries] = useState<ProgramLibrary[]>([]);
  const [libEditorVisible, setLibEditorVisible] = useState(false);
  const [editingLib, setEditingLib] = useState<ProgramLibrary | null>(null);
  const [libName, setLibName] = useState("");
  const [libWorkoutType, setLibWorkoutType] = useState("");
  const [libExercises, setLibExercises] = useState<ProgramLibraryExercise[]>([]);
  const [libEditorView, setLibEditorView] = useState<"main" | "workoutType" | "exercise" | "equipment">("main");
  const [editingExIndex, setEditingExIndex] = useState<number | null>(null);
  const [addExSelectedName, setAddExSelectedName] = useState<string | null>(null);
  const [libExSearch, setLibExSearch] = useState("");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadProgramLibraries();
    }
  }, [currentUser?.id]);

  const loadProgramLibraries = async () => {
    if (!currentUser) return;
    const libs = await getProgramLibraries(currentUser.id);
    setProgramLibraries(libs);
  };

  const handleExportData = async () => {
    if (Platform.OS !== "web") {
      showAlert("Not available", "Backup export/import is available in the web/PWA app.");
      return;
    }

    await forceSave();
    const success = await exportAllData();
    if (success) {
      showAlert("Backup ready", "Your data backup has been downloaded.");
    } else {
      showAlert("Export failed", "Could not create a backup file.");
    }
  };

  const handleImportPress = () => {
    if (Platform.OS !== "web") {
      showAlert("Not available", "Backup export/import is available in the web/PWA app.");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      showAlert("Invalid file", "Please select a valid .json backup file.");
      event.target.value = "";
      return;
    }

    const success = await importData(file);
    if (success) {
      showAlert("Import complete", "Data imported successfully. Reloading app.", [
        {
          text: "OK",
          onPress: () => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          },
        },
      ]);
    } else {
      showAlert("Import failed", "Could not import the backup file.");
    }

    event.target.value = "";
  };

  const handlePresetProgramPress = (lib: ProgramLibrary) => {
    const displayName = lib.name || lib.workoutType;
    if (lib.exercises.length === 0) {
      showAlert(
        "Empty Program",
        `"${displayName}" has no exercises. Add exercises before starting a workout.`
      );
      return;
    }
    showAlert(
      "Start New Workout?",
      `Start a new workout with "${displayName}"?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigateToNewWorkout({ programId: lib.id });
          },
        },
      ]
    );
  };

  const openProfileEdit = () => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditAvatar(currentUser.avatar);
      setEditSex(currentUser.sex);
      setEditCustomPhotoUri(currentUser.customPhotoUri);
      setProfileModalVisible(true);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Required",
          "Permission needed to access your photos.",
          [
            { text: "Cancel", style: "cancel" },
            Platform.OS !== "web"
              ? { text: "Open Settings", onPress: () => Linking.openSettings() }
              : { text: "OK" },
          ].filter(Boolean) as any
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setEditCustomPhotoUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      showAlert("Error", "Failed to select image.");
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !editName.trim()) return;
    await updateProfile({
      ...currentUser,
      name: editName.trim(),
      avatar: editAvatar,
      sex: editSex,
      customPhotoUri: editCustomPhotoUri,
    });
    setProfileModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openLibEditor = (lib: ProgramLibrary | null) => {
    if (lib) {
      setEditingLib(lib);
      setLibName(lib.name ?? "");
      setLibWorkoutType(lib.workoutType);
      setLibExercises([...lib.exercises]);
    } else {
      setEditingLib(null);
      setLibName("");
      setLibWorkoutType("");
      setLibExercises([]);
    }
    setLibEditorView("main");
    setAddExSelectedName(null);
    setLibExSearch("");
    setLibEditorVisible(true);
  };

  const addExerciseToLib = (name: string, equipmentType?: string, machineBrand?: string) => {
    setLibExercises((prev) => [...prev, { name, equipmentType, machineBrand }]);
    setAddExSelectedName(null);
    setLibEditorView("main");
  };

  const updateLibExercise = (index: number, data: Partial<ProgramLibraryExercise>) => {
    setLibExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...data } : e))
    );
  };

  const removeLibExercise = (index: number) => {
    setLibExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLibrary = async () => {
    if (!currentUser || !libWorkoutType.trim()) return;
    const lib: ProgramLibrary = {
      id: editingLib?.id ?? `lib${Date.now()}`,
      userId: currentUser.id,
      name: libName.trim() || undefined,
      workoutType: libWorkoutType.trim(),
      exercises: libExercises,
    };
    await saveProgramLibrary(lib);
    await loadProgramLibraries();
    setLibEditorVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteLibrary = async (lib: ProgramLibrary) => {
    const displayName = lib.name || lib.workoutType;
    showAlert(
      "Delete Program",
      `Delete "${displayName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (currentUser) {
              await deleteProgramLibrary(currentUser.id, lib.id);
              await loadProgramLibraries();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            }
          },
        },
      ]
    );
  };

  const muscleGroupCategories = MUSCLE_GROUPS.map((g) => ({
    name: g.name,
    items: g.exercises,
  }));

  const libExSearchLower = libExSearch.trim().toLowerCase();
  const libExSearchResults = libExSearchLower
    ? muscleGroupCategories.flatMap((cat) =>
        cat.items
          .filter(
            (item) =>
              item.toLowerCase().includes(libExSearchLower) ||
              cat.name.toLowerCase().includes(libExSearchLower)
          )
          .map((item) => ({ item, categoryName: cat.name }))
      )
    : [];

  if (!currentUser) return null;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h3">Profile</ThemedText>
        <Pressable
          onPress={switchProfile}
          style={[styles.switchBtn, { backgroundColor: theme.backgroundSecondary }]}
        >
          <Feather name="users" size={20} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, fontWeight: "600", marginLeft: Spacing.xs }}>
            Switch Profile
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <Card style={styles.section}>
          <View style={styles.userRow}>
            <ProfileAvatar
              avatar={currentUser.avatar}
              customPhotoUri={currentUser.customPhotoUri}
              size={72}
            />
            <View style={styles.userInfo}>
              <ThemedText type="h4">{currentUser.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                {currentUser.sex === "M" ? "Male" : currentUser.sex === "F" ? "Female" : "—"}
              </ThemedText>
              <Pressable
                onPress={openProfileEdit}
                style={[styles.editBtn, { backgroundColor: theme.primary }]}
              >
                <Feather name="edit-2" size={16} color="#FFF" />
                <ThemedText style={{ color: "#FFF", fontSize: 14, marginLeft: 4 }}>Edit</ThemedText>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Appearance */}
        <Card style={styles.collapsibleCard}>
          <Pressable
            onPress={() => setAppearanceOpen((v) => !v)}
            style={[styles.collapsibleHeader, styles.collapsibleHeaderSolo]}
          >
            <ThemedText type="h4">Appearance</ThemedText>
            <Feather
              name={appearanceOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
          {appearanceOpen ? (
            <View style={[styles.collapsibleBody, { borderTopColor: theme.border }]}>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
              >
                Choose the app background and accent colours.
              </ThemedText>
              {THEME_OPTIONS.map((opt) => {
            const selected = preference === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  void setPreference(opt.id);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.themeSwatches}>
                  {opt.swatches.map((color) => (
                    <View
                      key={color}
                      style={[styles.themeSwatch, { backgroundColor: color }]}
                    />
                  ))}
                </View>
                <View style={styles.themeOptionText}>
                  <ThemedText style={{ fontWeight: "600" }}>{opt.label}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    {opt.description}
                  </ThemedText>
                </View>
                {selected ? (
                  <Feather name="check-circle" size={22} color={theme.primary} />
                ) : (
                  <View style={[styles.themeRadioOuter, { borderColor: theme.border }]} />
                )}
              </Pressable>
            );
          })}
            </View>
          ) : null}
        </Card>

        {/* Pre-set Programs */}
        <Card style={styles.collapsibleCard}>
          <View style={styles.collapsibleHeader}>
            <Pressable
              onPress={() => setProgramsOpen((v) => !v)}
              style={styles.collapsibleHeaderMain}
            >
              <ThemedText type="h4">Pre-set Programs</ThemedText>
              <Feather
                name={programsOpen ? "chevron-up" : "chevron-down"}
                size={22}
                color={theme.textSecondary}
              />
            </Pressable>
            {programsOpen ? (
              <Pressable
                onPress={() => openLibEditor(null)}
                style={[styles.addLibBtn, { borderColor: theme.primary }]}
              >
                <Feather name="plus" size={18} color={theme.primary} />
                <ThemedText
                  style={{ color: theme.primary, fontWeight: "600", marginLeft: 4 }}
                >
                  Add
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          {programsOpen ? (
            <View style={[styles.collapsibleBody, { borderTopColor: theme.border }]}>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
              >
                Create exercise day libraries. When starting a workout, you can load a
                pre-set. You can also save from a workout&apos;s detail screen.
              </ThemedText>
              {programLibraries.length === 0 ? (
            <Card style={[styles.emptyLib, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="folder" size={40} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                No programs yet. Tap Add to create one.
              </ThemedText>
            </Card>
          ) : (
            programLibraries.map((lib) => (
              <Card key={lib.id} style={styles.libCard}>
                <View style={styles.libRow}>
                  <Pressable
                    onPress={() => handlePresetProgramPress(lib)}
                    style={({ pressed }) => [
                      styles.libInfo,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <ThemedText style={{ fontWeight: "600" }}>{lib.name || lib.workoutType}</ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, marginTop: 2 }}
                      numberOfLines={3}
                    >
                      {lib.exercises.length > 0
                        ? lib.exercises.map((ex) => ex.name).join(" · ")
                        : "No exercises yet"}
                    </ThemedText>
                  </Pressable>
                  <View style={styles.libActions}>
                    <Pressable onPress={() => openLibEditor(lib)} hitSlop={8}>
                      <Feather name="edit-2" size={20} color={theme.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteLibrary(lib)} hitSlop={8} style={{ marginLeft: Spacing.md }}>
                      <Feather name="trash-2" size={20} color={theme.error} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          )}
            </View>
          ) : null}
        </Card>

        <Card style={styles.collapsibleCard}>
          <Pressable
            onPress={() => setBackupOpen((v) => !v)}
            style={[styles.collapsibleHeader, styles.collapsibleHeaderSolo]}
          >
            <ThemedText type="h4">Data Backup</ThemedText>
            <Feather
              name={backupOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
          {backupOpen ? (
            <View style={[styles.collapsibleBody, { borderTopColor: theme.border }]}> 
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Backup your app data for this device.
              </ThemedText>
              <View style={styles.dataActionsRow}>
                <Pressable
                  onPress={handleExportData}
                  style={[styles.dataActionBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.primary }]}
                >
                  <Feather name="download" size={16} color={theme.primary} />
                  <ThemedText style={{ color: theme.primary, fontWeight: "600", marginLeft: 6 }}>
                    Export
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleImportPress}
                  style={[styles.dataActionBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.primary }]}
                >
                  <Feather name="upload" size={16} color={theme.primary} />
                  <ThemedText style={{ color: theme.primary, fontWeight: "600", marginLeft: 6 }}>
                    Import
                  </ThemedText>
                </Pressable>
              </View>
              <input
                ref={fileInputRef}
                style={styles.hiddenInput}
                type="file"
                accept=".json"
                onChange={handleImportData}
              />
            </View>
          ) : null}
        </Card>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent onRequestClose={() => setProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setProfileModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Edit Profile</ThemedText>
              <Pressable onPress={() => setProfileModalVisible(false)} hitSlop={16}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.avatarPreview}>
              <ProfileAvatar avatar={editAvatar} customPhotoUri={editCustomPhotoUri} size={80} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
              {AVATAR_OPTIONS.map((a) => (
                <Pressable
                  key={a}
                  style={[styles.avatarOpt, !editCustomPhotoUri && editAvatar === a && { borderColor: theme.primary, borderWidth: 2 }]}
                  onPress={() => { setEditAvatar(a); setEditCustomPhotoUri(undefined); }}
                >
                  <ProfileAvatar avatar={a} size={44} />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={[styles.uploadBtn, { backgroundColor: theme.primary }]} onPress={handlePickImage}>
              <Feather name="image" size={18} color="#FFF" />
              <ThemedText style={{ color: "#FFF", marginLeft: 8 }}>Upload Photo</ThemedText>
            </Pressable>
            {editCustomPhotoUri && (
              <Pressable onPress={() => setEditCustomPhotoUri(undefined)}>
                <ThemedText style={{ color: theme.primary, textAlign: "center", marginBottom: Spacing.md }}>Use Icon</ThemedText>
              </Pressable>
            )}
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Name</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor={theme.textSecondary}
            />
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Sex</ThemedText>
            <View style={styles.sexRow}>
              {(["M", "F"] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sexBtn, { backgroundColor: editSex === s ? theme.primary : theme.backgroundSecondary }]}
                  onPress={() => setEditSex(s)}
                >
                  <ThemedText style={{ color: editSex === s ? "#FFF" : theme.text }}>{s === "M" ? "Male" : "Female"}</ThemedText>
                </Pressable>
              ))}
            </View>
            <Button onPress={handleSaveProfile} style={styles.saveBtn}>Save</Button>
          </View>
        </View>
      </Modal>

      {/* Library Editor Modal */}
      <Modal
        visible={libEditorVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (libEditorView !== "main") setLibEditorView("main");
          else setLibEditorVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLibEditorVisible(false)} />
          <View style={[styles.modalContent, styles.libModalContent, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.lg }]}>
            {libEditorView === "main" ? (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="h4">{editingLib ? "Edit Program" : "New Program"}</ThemedText>
                  <Pressable onPress={() => setLibEditorVisible(false)} hitSlop={16}>
                    <Feather name="x" size={24} color={theme.text} />
                  </Pressable>
                </View>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Program Name (optional)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, marginBottom: Spacing.md }]}
                  value={libName}
                  onChangeText={setLibName}
                  placeholder="e.g. My Leg Day"
                  placeholderTextColor={theme.textSecondary}
                />
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Exercise Day *</ThemedText>
                <Pressable
                  style={[styles.picker, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setLibEditorView("workoutType")}
                >
                  <ThemedText style={!libWorkoutType ? { color: theme.textSecondary } : undefined}>
                    {libWorkoutType || "Select workout type"}
                  </ThemedText>
                  <Feather name="chevron-down" size={20} color={theme.textSecondary} />
                </Pressable>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }]}>Exercises</ThemedText>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {libExercises.map((ex, i) => (
                    <View key={i} style={[styles.libExRow, { backgroundColor: theme.backgroundSecondary }]}>
                      <View style={styles.libExInfo}>
                        <ThemedText>{ex.name}</ThemedText>
                        {(ex.equipmentType || ex.machineBrand) ? (
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {[ex.equipmentType, ex.machineBrand].filter(Boolean).join(", ")}
                          </ThemedText>
                        ) : (
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>No equipment</ThemedText>
                        )}
                      </View>
                      <View style={styles.libExActions}>
                        <Pressable onPress={() => { setEditingExIndex(i); setLibEditorView("equipment"); }} hitSlop={8}>
                          <Feather name="settings" size={18} color={theme.textSecondary} />
                        </Pressable>
                        <Pressable onPress={() => removeLibExercise(i)} hitSlop={8} style={{ marginLeft: Spacing.sm }}>
                          <Feather name="x" size={20} color={theme.error} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <Pressable style={[styles.addExBtn, { borderColor: theme.primary }]} onPress={() => { setAddExSelectedName(null); setLibExSearch(""); setLibEditorView("exercise"); }}>
                  <Feather name="plus" size={18} color={theme.primary} />
                  <ThemedText style={{ color: theme.primary, marginLeft: 8 }}>Add Exercise</ThemedText>
                </Pressable>
                <Button onPress={handleSaveLibrary} style={styles.saveBtn} disabled={!libWorkoutType.trim()}>
                  Save Program
                </Button>
              </>
            ) : libEditorView === "workoutType" ? (
              <>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setLibEditorView("main")} hitSlop={16}>
                    <Feather name="chevron-left" size={24} color={theme.text} />
                  </Pressable>
                  <ThemedText type="h4">Exercise Day</ThemedText>
                  <View style={{ width: 24 }} />
                </View>
                <FlatList
                  data={WORKOUT_TYPES}
                  keyExtractor={(item) => item}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.inlineOption, { backgroundColor: libWorkoutType === item ? theme.backgroundSecondary : "transparent" }]}
                      onPress={() => { setLibWorkoutType(item); if (!libName.trim()) setLibName(item); setLibEditorView("main"); }}
                    >
                      <ThemedText>{item}</ThemedText>
                      {libWorkoutType === item ? <Feather name="check" size={20} color={theme.primary} /> : null}
                    </Pressable>
                  )}
                />
              </>
            ) : libEditorView === "exercise" ? (
              <>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => { setLibEditorView("main"); setAddExSelectedName(null); setLibExSearch(""); }} hitSlop={16}>
                    <Feather name="chevron-left" size={24} color={theme.text} />
                  </Pressable>
                  <ThemedText type="h4">Select Exercise</ThemedText>
                  <View style={{ width: 24 }} />
                </View>
                {addExSelectedName ? (
                  <View style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Add "{addExSelectedName}" with equipment (optional):
                      </ThemedText>
                      <Pressable onPress={() => setAddExSelectedName(null)}>
                        <ThemedText type="small" style={{ color: theme.primary }}>← Change</ThemedText>
                      </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
                      <Pressable
                        style={[styles.eqChip, { backgroundColor: theme.primary }]}
                        onPress={() => addExerciseToLib(addExSelectedName)}
                      >
                        <ThemedText type="small" style={{ color: "#FFF" }}>Skip / No equipment</ThemedText>
                      </Pressable>
                      {EQUIPMENT_TYPES.map((eq) => (
                        <Pressable
                          key={eq}
                          style={[styles.eqChip, { backgroundColor: theme.backgroundSecondary, marginLeft: Spacing.xs }]}
                          onPress={() => addExerciseToLib(addExSelectedName, eq)}
                        >
                          <ThemedText type="small">{eq}</ThemedText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={[styles.searchBox, { backgroundColor: theme.backgroundSecondary, marginBottom: Spacing.md }]}>
                      <Feather name="search" size={18} color={theme.textSecondary} />
                      <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search muscle or exercise..."
                        placeholderTextColor={theme.textSecondary}
                        value={libExSearch}
                        onChangeText={setLibExSearch}
                        autoCorrect={false}
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                      {libExSearchLower ? (
                        libExSearchResults.map(({ item: exName, categoryName }, i) => (
                          <Pressable
                            key={`${exName}-${i}`}
                            style={[styles.inlineOption, { backgroundColor: theme.backgroundSecondary, marginBottom: 2 }]}
                            onPress={() => setAddExSelectedName(exName)}
                          >
                            <View>
                              <ThemedText>{exName}</ThemedText>
                              <ThemedText type="small" style={{ color: theme.textSecondary }}>{categoryName}</ThemedText>
                            </View>
                          </Pressable>
                        ))
                      ) : (
                        muscleGroupCategories.map((cat) => (
                          <View key={cat.name} style={{ marginBottom: Spacing.md }}>
                            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>{cat.name}</ThemedText>
                            {cat.items.map((exName) => (
                              <Pressable
                                key={exName}
                                style={[styles.inlineOption, { backgroundColor: theme.backgroundSecondary, marginBottom: 2 }]}
                                onPress={() => setAddExSelectedName(exName)}
                              >
                                <ThemedText>{exName}</ThemedText>
                              </Pressable>
                            ))}
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </>
                )}
              </>
            ) : libEditorView === "equipment" && editingExIndex !== null ? (
              <>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => { setLibEditorView("main"); setEditingExIndex(null); }} hitSlop={16}>
                    <Feather name="chevron-left" size={24} color={theme.text} />
                  </Pressable>
                  <ThemedText type="h4">Equipment</ThemedText>
                  <View style={{ width: 24 }} />
                </View>
                <FlatList
                  data={["__clear__", ...EQUIPMENT_TYPES]}
                  keyExtractor={(item) => item}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.inlineOption, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => {
                        if (item === "__clear__") {
                          updateLibExercise(editingExIndex, { equipmentType: undefined, machineBrand: undefined });
                        } else {
                          const supportsBrand = ["Machine", "Cable", "Free Weight"].includes(item);
                          updateLibExercise(editingExIndex, { equipmentType: item, machineBrand: supportsBrand ? libExercises[editingExIndex]?.machineBrand : undefined });
                        }
                        setLibEditorView("main");
                        setEditingExIndex(null);
                      }}
                    >
                      <ThemedText>{item === "__clear__" ? "Clear equipment" : item}</ThemedText>
                    </Pressable>
                  )}
                />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  scroll: { flex: 1 },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  collapsibleCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  collapsibleHeaderSolo: {
    justifyContent: "space-between",
  },
  collapsibleHeaderMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collapsibleBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  themeSwatches: {
    flexDirection: "row",
    marginRight: Spacing.md,
    gap: 4,
  },
  themeSwatch: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  themeOptionText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  themeRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  addLibBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  backupSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dataActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dataActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  hiddenInput: {
    display: "none",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: { marginLeft: Spacing.lg, flex: 1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  emptyLib: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  libCard: { marginBottom: Spacing.sm },
  libRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  libInfo: { flex: 1 },
  libActions: { flexDirection: "row" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: "85%",
  },
  libModalContent: { maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl },
  avatarPreview: { alignItems: "center", marginBottom: Spacing.lg },
  avatarRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  avatarOpt: { borderRadius: 24, borderWidth: 2, borderColor: "transparent" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.md, marginBottom: Spacing.sm, borderRadius: BorderRadius.sm },
  label: { marginBottom: Spacing.xs },
  input: { height: Spacing.inputHeight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.lg, fontSize: 16, marginBottom: Spacing.lg },
  sexRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  sexBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: "center", borderRadius: BorderRadius.sm },
  saveBtn: { marginTop: Spacing.md },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: Spacing.inputHeight, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  libExRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  libExInfo: { flex: 1 },
  libExActions: { flexDirection: "row", alignItems: "center" },
  addExBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 2, marginTop: Spacing.sm },
  inlineOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  eqChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
