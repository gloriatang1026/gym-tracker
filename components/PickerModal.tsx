import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { BrandLogo } from "../components/BrandLogo";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  title: string;
  searchable?: boolean;
  selectedValue?: string;
  getOptionImageUrl?: (option: string) => string | undefined;
}

export function PickerModal({
  visible,
  onClose,
  onSelect,
  options,
  title,
  searchable = false,
  selectedValue,
  getOptionImageUrl,
}: PickerModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="h4">{title}</ThemedText>
            <Pressable onPress={onClose} hitSlop={16}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {searchable ? (
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
          ) : null}

          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => `${item}-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed
                      ? theme.backgroundSecondary
                      : "transparent",
                  },
                  selectedValue === item && {
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.optionLeft}>
                  {getOptionImageUrl ? (
                    <BrandLogo
                      imageUrl={getOptionImageUrl(item)}
                      size={32}
                    />
                  ) : null}
                  <ThemedText style={styles.optionText}>{item}</ThemedText>
                </View>
                {selectedValue === item ? (
                  <Feather name="check" size={20} color={theme.primary} />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "70%",
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  optionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});
