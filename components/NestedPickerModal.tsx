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
import {
  ExercisePickerThumbnail,
  PICKER_EXERCISE_THUMB_SIZE,
} from "../components/ExercisePickerThumbnail";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

interface Category {
  name: string;
  items: string[];
}

interface NestedPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string, categoryName?: string) => void;
  categories: Category[];
  title: string;
  categoryTitle?: string;
  itemTitle?: string;
  selectedValue?: string;
  searchable?: boolean;
  /** Shown at the top of the first screen; tap selects immediately (no sub-list). */
  directSelectItems?: string[];
  /** Optional thumbnail URL for leaf items (e.g. exercise illustrations). */
  getItemImageUrl?: (item: string) => string | undefined;
  /** Optional icon URL for category rows (e.g. muscle group diagrams). */
  getCategoryImageUrl?: (categoryName: string) => string | undefined;
  /** Optional custom item handler for the special "Other" option. */
  onAddCustomItem?: (value: string, categoryName?: string) => Promise<boolean> | boolean;
}

export function NestedPickerModal({
  visible,
  onClose,
  onSelect,
  categories,
  title,
  categoryTitle = "Select Category",
  itemTitle = "Select Item",
  selectedValue,
  searchable = false,
  directSelectItems = [],
  getItemImageUrl,
  getCategoryImageUrl,
  onAddCustomItem,
}: NestedPickerModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customPromptCategory, setCustomPromptCategory] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [isSavingCustomItem, setIsSavingCustomItem] = useState(false);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  const handleItemSelect = (item: string, categoryName?: string) => {
    if (item === "Other" && onAddCustomItem) {
      setCustomPromptCategory(categoryName ?? selectedCategory?.name ?? null);
      setCustomInput("");
      return;
    }

    onSelect(item, categoryName ?? selectedCategory?.name);
    setSelectedCategory(null);
    setSearchQuery("");
    setCustomPromptCategory(null);
    setCustomInput("");
    onClose();
  };

  const handleCustomItemSubmit = async () => {
    const trimmedValue = customInput.trim();
    if (!trimmedValue || !onAddCustomItem) return;

    setIsSavingCustomItem(true);
    const added = await onAddCustomItem(trimmedValue, customPromptCategory ?? undefined);
    setIsSavingCustomItem(false);

    onSelect(trimmedValue, customPromptCategory ?? undefined);
    setSelectedCategory(null);
    setSearchQuery("");
    setCustomPromptCategory(null);
    setCustomInput("");
    onClose();
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setCustomPromptCategory(null);
    setCustomInput("");
    onClose();
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const hasSearch = searchable && searchLower.length > 0;

  // When searching from category view: match direct items, category names, and leaf items
  const searchResults: { item: string; categoryName: string }[] = (() => {
    if (!hasSearch || selectedCategory) return [];
    const seen = new Set<string>();
    const results: { item: string; categoryName: string }[] = [];
    const add = (item: string, categoryName: string) => {
      if (seen.has(item)) return;
      seen.add(item);
      results.push({ item, categoryName });
    };
    for (const item of directSelectItems) {
      if (item.toLowerCase().includes(searchLower)) {
        add(item, "");
      }
    }
    for (const cat of categories) {
      for (const item of cat.items) {
        if (
          item.toLowerCase().includes(searchLower) ||
          cat.name.toLowerCase().includes(searchLower)
        ) {
          add(item, cat.name);
        }
      }
    }
    return results;
  })();

  const filteredItems = selectedCategory
    ? searchable
      ? selectedCategory.items.filter((item) =>
          item.toLowerCase().includes(searchLower)
        )
      : selectedCategory.items
    : [];

  const findCategoryForValue = (value: string): string | null => {
    for (const cat of categories) {
      if (cat.items.includes(value)) {
        return cat.name;
      }
    }
    return null;
  };

  const selectedCategoryName =
    selectedValue && !directSelectItems.includes(selectedValue)
      ? findCategoryForValue(selectedValue)
      : null;

  const renderItemLabel = (item: string, subtitle?: string) => (
    <View style={styles.optionContent}>
      {getItemImageUrl ? (
        <ExercisePickerThumbnail
          imageUrl={getItemImageUrl(item)}
          size={PICKER_EXERCISE_THUMB_SIZE}
        />
      ) : null}
      <View style={styles.optionTextWrap}>
        <ThemedText style={styles.optionText} numberOfLines={2}>
          {item}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            type="small"
            style={[styles.categoryCount, { color: theme.textSecondary }]}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );

  const renderDirectSelectItem = (item: string) => (
    <Pressable
      key={item}
      style={({ pressed }) => [
        styles.option,
        getItemImageUrl && styles.optionCompact,
        {
          backgroundColor: pressed ? theme.backgroundSecondary : "transparent",
        },
        selectedValue === item && {
          backgroundColor: theme.backgroundSecondary,
        },
      ]}
      onPress={() => handleItemSelect(item)}
    >
      {renderItemLabel(item)}
      {selectedValue === item ? (
        <Feather name="check" size={20} color={theme.primary} />
      ) : null}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
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
            {selectedCategory ? (
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={16}
              >
                <Feather name="chevron-left" size={24} color={theme.text} />
              </Pressable>
            ) : null}
            <ThemedText type="h4" style={selectedCategory ? styles.titleWithBack : undefined}>
              {selectedCategory ? selectedCategory.name : title}
            </ThemedText>
            <Pressable onPress={handleClose} hitSlop={16}>
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
                placeholder={selectedCategory ? "Search exercises..." : "Search muscle group or exercise..."}
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
          ) : null}

          {customPromptCategory !== null ? (
            <View
              style={[
                styles.customPromptContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <ThemedText style={styles.customPromptTitle}>Add a custom exercise</ThemedText>
              <ThemedText type="small" style={[styles.customPromptText, { color: theme.textSecondary }]}>Type an exercise name that is not in the current list.</ThemedText>
              <TextInput
                style={[styles.customInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}
                placeholder="Exercise name"
                placeholderTextColor={theme.textSecondary}
                value={customInput}
                onChangeText={setCustomInput}
                autoCorrect={false}
                autoFocus
              />
              <View style={styles.customPromptActions}>
                <Pressable
                  style={[styles.customPromptButton, styles.customPromptButtonSecondary]}
                  onPress={() => {
                    setCustomPromptCategory(null);
                    setCustomInput("");
                  }}
                >
                  <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.customPromptButton,
                    styles.customPromptButtonPrimary,
                    (!customInput.trim() || isSavingCustomItem) && styles.customPromptButtonDisabled,
                  ]}
                  onPress={handleCustomItemSubmit}
                  disabled={!customInput.trim() || isSavingCustomItem}
                >
                  <ThemedText style={{ color: "#fff" }}>
                    {isSavingCustomItem ? "Saving..." : "Add to list"}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : hasSearch && !selectedCategory ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item, idx) => `${item.item}-${item.categoryName}-${idx}`}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    getItemImageUrl && styles.optionCompact,
                    {
                      backgroundColor: pressed
                        ? theme.backgroundSecondary
                        : "transparent",
                    },
                    selectedValue === item.item && {
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => handleItemSelect(item.item)}
                >
                  {renderItemLabel(
                    item.item,
                    item.categoryName || undefined
                  )}
                  {selectedValue === item.item ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          ) : selectedCategory ? (
            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => `${item}-${index}`}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    getItemImageUrl && styles.optionCompact,
                    {
                      backgroundColor: pressed
                        ? theme.backgroundSecondary
                        : "transparent",
                    },
                    selectedValue === item && {
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => handleItemSelect(item)}
                >
                  {renderItemLabel(item)}
                  {selectedValue === item ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              ListHeaderComponent={
                directSelectItems.length > 0 ? (
                  <View>{directSelectItems.map(renderDirectSelectItem)}</View>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.categoryOption,
                    {
                      backgroundColor: pressed
                        ? theme.backgroundSecondary
                        : "transparent",
                    },
                    selectedCategoryName === item.name && {
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => handleCategorySelect(item)}
                >
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryTitleRow}>
                      {getCategoryImageUrl ? (
                        <ExercisePickerThumbnail
                          imageUrl={getCategoryImageUrl(item.name)}
                          size={44}
                        />
                      ) : null}
                      <View style={styles.categoryTextWrap}>
                        <ThemedText style={styles.categoryName}>
                          {item.name}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.categoryCount,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {item.items.length}{" "}
                          {item.items.length === 1 ? "item" : "items"}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
            />
          )}
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
  customPromptContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  customPromptTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  customPromptText: {
    marginBottom: Spacing.sm,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customPromptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  customPromptButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  customPromptButtonSecondary: {
    backgroundColor: "transparent",
  },
  customPromptButtonPrimary: {
    backgroundColor: "#ff3b30",
  },
  customPromptButtonDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  titleWithBack: {
    flex: 1,
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
  optionCompact: {
    paddingVertical: Spacing.sm,
    marginBottom: 2,
  },
  optionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.sm,
    gap: Spacing.sm,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryCount: {
    fontSize: 13,
    marginTop: 2,
  },
});
