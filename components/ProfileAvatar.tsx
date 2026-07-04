import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

interface ProfileAvatarProps {
  avatar: string;
  customPhotoUri?: string;
  size?: number;
  backgroundColor?: string;
}

const avatarIconMap: Record<string, keyof typeof Feather.glyphMap> = {
  fitness: "activity",
  weight: "target",
  run: "zap",
  heart: "heart",
  star: "star",
  user: "user",
};

export function ProfileAvatar({
  avatar,
  customPhotoUri,
  size = 80,
  backgroundColor,
}: ProfileAvatarProps) {
  const { theme } = useTheme();
  const iconName = avatarIconMap[avatar] || "user";

  if (customPhotoUri) {
    return (
      <Image
        source={{ uri: customPhotoUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: backgroundColor || theme.primary,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || theme.primary,
        },
      ]}
    >
      <Feather name={iconName} size={size * 0.45} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    borderWidth: 3,
  },
});
