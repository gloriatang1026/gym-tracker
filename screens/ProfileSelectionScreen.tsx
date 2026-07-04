import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { Spacing, BorderRadius } from "../constants/theme";
import { UserProfile } from "../lib/storage";

const AVATAR_OPTIONS = ["fitness", "weight", "run", "heart", "star", "user"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ProfileCard({
  profile,
  onPress,
  onLongPress,
  delay,
}: {
  profile: UserProfile;
  onPress: () => void;
  onLongPress: () => void;
  delay: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable
        style={[
          styles.profileCard,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onLongPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
      >
        <ProfileAvatar 
          avatar={profile.avatar} 
          customPhotoUri={profile.customPhotoUri}
          size={80} 
        />
        <ThemedText style={styles.profileName}>{profile.name}</ThemedText>
      </AnimatedPressable>
    </Animated.View>
  );
}

function AddProfileCard({ onPress, delay }: { onPress: () => void; delay: number }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable
        style={[
          styles.profileCard,
          styles.addCard,
          { borderColor: theme.border },
          animatedStyle,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.addIconContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="plus" size={32} color={theme.textSecondary} />
        </View>
        <ThemedText style={[styles.profileName, { color: theme.textSecondary }]}>
          Add Profile
        </ThemedText>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function ProfileSelectionScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profiles, isLoading, selectUser, addProfile, updateProfile, deleteProfile } =
    useUser();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("fitness");
  const [editSex, setEditSex] = useState<"M" | "F" | undefined>(undefined);
  const [editCustomPhotoUri, setEditCustomPhotoUri] = useState<string | undefined>(undefined);
  const [isNewProfile, setIsNewProfile] = useState(false);

  const openEditModal = (profile: UserProfile | null) => {
    if (profile) {
      setEditingProfile(profile);
      setEditName(profile.name);
      setEditAvatar(profile.avatar);
      setEditSex(profile.sex);
      setEditCustomPhotoUri(profile.customPhotoUri);
      setIsNewProfile(false);
    } else {
      setEditingProfile(null);
      setEditName(`User ${profiles.length + 1}`);
      setEditAvatar("user");
      setEditSex(undefined);
      setEditCustomPhotoUri(undefined);
      setIsNewProfile(true);
    }
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission needed to access your photos for custom avatar. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            Platform.OS !== "web" ? {
              text: "Open Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  // openSettings not supported
                }
              },
            } : { text: "OK" },
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

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setEditCustomPhotoUri(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleUseIconInstead = () => {
    setEditCustomPhotoUri(undefined);
    Haptics.selectionAsync();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;

    if (isNewProfile) {
      const newProfile: UserProfile = {
        id: `user${Date.now()}`,
        name: editName.trim(),
        avatar: editAvatar,
        sex: editSex,
        customPhotoUri: editCustomPhotoUri,
      };
      await addProfile(newProfile);
    } else if (editingProfile) {
      await updateProfile({
        ...editingProfile,
        name: editName.trim(),
        avatar: editAvatar,
        sex: editSex,
        customPhotoUri: editCustomPhotoUri,
      });
    }
    setEditModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteProfile = async () => {
    if (editingProfile && profiles.length > 1) {
      await deleteProfile(editingProfile.id);
      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleSelectAvatar = (avatar: string) => {
    setEditAvatar(avatar);
    setEditCustomPhotoUri(undefined);
    Haptics.selectionAsync();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.delay(100)}>
          <ThemedText type="h1" style={styles.title}>
            Who's Training Today?
          </ThemedText>
        </Animated.View>

        <View style={styles.profileGrid}>
          {profiles.map((profile, index) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onPress={() => selectUser(profile.id)}
              onLongPress={() => openEditModal(profile)}
              delay={200 + index * 100}
            />
          ))}
          {profiles.length < 4 ? (
            <AddProfileCard
              onPress={() => openEditModal(null)}
              delay={200 + profiles.length * 100}
            />
          ) : null}
        </View>

        <Animated.View
          entering={FadeIn.delay(600)}
          style={styles.hintContainer}
        >
          <ThemedText
            type="small"
            style={[styles.hint, { color: theme.textSecondary }]}
          >
            Long press on a profile to edit
          </ThemedText>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setEditModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.backgroundDefault,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">
                {isNewProfile ? "Add Profile" : "Edit Profile"}
              </ThemedText>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                hitSlop={16}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.avatarPreview}>
              <ProfileAvatar 
                avatar={editAvatar} 
                customPhotoUri={editCustomPhotoUri}
                size={100} 
              />
            </View>

            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              Choose Avatar
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.avatarRow}
              contentContainerStyle={styles.avatarRowContent}
            >
              {AVATAR_OPTIONS.map((avatar) => (
                <Pressable
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    !editCustomPhotoUri && editAvatar === avatar && {
                      borderColor: theme.primary,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <ProfileAvatar avatar={avatar} size={50} />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                { 
                  backgroundColor: pressed ? theme.primary + "DD" : theme.primary,
                },
              ]}
              onPress={handlePickImage}
            >
              <Feather name="image" size={20} color="#FFFFFF" />
              <ThemedText style={styles.uploadButtonText} darkColor="#FFFFFF" lightColor="#FFFFFF">
                Upload from Photos
              </ThemedText>
            </Pressable>

            {editCustomPhotoUri ? (
              <Pressable
                style={styles.useIconButton}
                onPress={handleUseIconInstead}
              >
                <ThemedText style={{ color: theme.primary }}>
                  Use Icon Instead
                </ThemedText>
              </Pressable>
            ) : null}

            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }]}
            >
              Sex
            </ThemedText>
            <View style={styles.sexRow}>
              {(["M", "F"] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.sexOption,
                    { backgroundColor: editSex === s ? theme.primary : theme.backgroundSecondary },
                  ]}
                  onPress={() => setEditSex(s)}
                >
                  <ThemedText style={{ color: editSex === s ? "#FFF" : theme.text }}>
                    {s === "M" ? "Male" : "Female"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              Name
            </ThemedText>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter name"
              placeholderTextColor={theme.textSecondary}
              maxLength={20}
            />

            <Button onPress={handleSaveProfile} style={styles.saveButton}>
              {isNewProfile ? "Add Profile" : "Save Changes"}
            </Button>

            {!isNewProfile && profiles.length > 1 ? (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDeleteProfile}
              >
                <ThemedText style={{ color: theme.error }}>
                  Delete Profile
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing["4xl"],
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  profileCard: {
    width: 150,
    aspectRatio: 0.85,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  addCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  addIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  hintContainer: {
    marginTop: Spacing["4xl"],
    alignItems: "center",
  },
  hint: {
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarPreview: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  label: {
    marginBottom: Spacing.sm,
  },
  avatarRow: {
    marginBottom: Spacing.lg,
  },
  avatarRowContent: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatarOption: {
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  useIconButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sexRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sexOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  nameInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  saveButton: {
    marginBottom: Spacing.lg,
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
});
