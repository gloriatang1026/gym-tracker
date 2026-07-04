import { Alert, Platform } from "react-native";

export type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
};

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const resolvedButtons = buttons?.length ? buttons : [{ text: "OK" }];

  if (resolvedButtons.length === 1) {
    const text = message ? `${title}\n\n${message}` : title;
    window.alert(text);
    resolvedButtons[0].onPress?.();
    return;
  }

  const actionButtons = resolvedButtons.filter((button) => button.style !== "cancel");
  const primaryButton =
    actionButtons.find((button) => button.style === "destructive") ??
    actionButtons[actionButtons.length - 1];

  const text = message ? `${title}\n\n${message}` : title;
  if (window.confirm(text)) {
    primaryButton?.onPress?.();
  }
}
