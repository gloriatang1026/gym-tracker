import React, { useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { BorderRadius } from "../constants/theme";

interface BrandLogoProps {
  imageUrl?: string;
  size?: number;
}

export function BrandLogo({ imageUrl, size = 28 }: BrandLogoProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.border,
          },
        ]}
      >
        <Feather name="box" size={Math.round(size * 0.45)} color={theme.textSecondary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[styles.image, { width: size, height: size, borderRadius: BorderRadius.xs }]}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
  },
  image: {
    backgroundColor: "transparent",
  },
});
