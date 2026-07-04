import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { SvgUri, SvgXml } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { BorderRadius } from "../constants/theme";
import { isSvgImageUrl } from "../lib/muscleGroupImages";
import { Asset } from "expo-asset";

export const DEFAULT_EXERCISE_THUMB_SIZE = 64;
export const PICKER_EXERCISE_THUMB_SIZE = 84;

interface ExercisePickerThumbnailProps {
  // imageUrl may be a remote URL string or a local module (require(...))
  imageUrl?: string | any;
  size?: number;
}

export function ExercisePickerThumbnail({
  imageUrl,
  size = DEFAULT_EXERCISE_THUMB_SIZE,
}: ExercisePickerThumbnailProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const iconSize = Math.round(size * 0.38);
  const isSvg = imageUrl ? isSvgImageUrl(imageUrl) : false;
  const uri = imageUrl
    ? typeof imageUrl === "string"
      ? imageUrl
      : Asset.fromModule(imageUrl).uri
    : undefined;

  useEffect(() => {
    if (!isSvg) {
      setSvgXml(null);
      return;
    }

    let mounted = true;
    async function fetchAndInline() {
      try {
        if (Platform.OS === "web" && uri) {
          const res = await fetch(uri);
          const text = await res.text();
          const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          if (styleMatch && styleMatch[1]) {
            const rules = styleMatch[1];
            const classMap: Record<string, string> = {};
            const ruleRegex = /\.([^{\s,]+)\s*\{([^}]+)\}/g;
            let m: RegExpExecArray | null;
            while ((m = ruleRegex.exec(rules))) {
              const cls = m[1].trim();
              const body = m[2];
              const attrs: string[] = [];
              const fillMatch = body.match(/fill:\s*([^;]+);?/i);
              if (fillMatch) attrs.push(`fill=\"${fillMatch[1].trim()}\"`);
              const strokeMatch = body.match(/stroke:\s*([^;]+);?/i);
              if (strokeMatch) attrs.push(`stroke=\"${strokeMatch[1].trim()}\"`);
              const strokeWidthMatch = body.match(/stroke-width:\s*([^;]+);?/i);
              if (strokeWidthMatch) attrs.push(`stroke-width=\"${strokeWidthMatch[1].trim()}\"`);
              const lineCapMatch = body.match(/stroke-linecap:\s*([^;]+);?/i);
              if (lineCapMatch) attrs.push(`stroke-linecap=\"${lineCapMatch[1].trim()}\"`);
              const miterMatch = body.match(/stroke-miterlimit:\s*([^;]+);?/i);
              if (miterMatch) attrs.push(`stroke-miterlimit=\"${miterMatch[1].trim()}\"`);
              classMap[cls] = attrs.join(" ");
            }

            let processed = text.replace(/<defs>[\s\S]*?<\/defs>/i, "");
            processed = processed.replace(/class=\"([^\"]+)\"/g, (_match, clsNames) => {
              const parts = clsNames.split(/\s+/);
              const attrs: string[] = [];
              parts.forEach((p: string) => {
                if (classMap[p]) attrs.push(classMap[p]);
              });
              return attrs.join(" ") || "";
            });
            processed = processed.replace(/#0f2752/gi, "#ffffff");
            if (mounted) setSvgXml(processed);
            return;
          }
          if (mounted) setSvgXml(text);
        }
      } catch (e) {
        // ignore and fall back to SvgUri
      }
    }

    fetchAndInline();
    return () => {
      mounted = false;
    };
  }, [isSvg, uri]);

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
        <Feather name="activity" size={iconSize} color={theme.textSecondary} />
      </View>
    );
  }

  if (isSvg && uri) {
    return (
      <View
        style={[
          styles.svgWrap,
          { width: size, height: size, borderRadius: BorderRadius.xs },
        ]}
      >
        {Platform.OS === "web" && svgXml ? (
          <SvgXml xml={svgXml} width={size} height={size} />
        ) : (
          <SvgUri uri={uri} width={size} height={size} onError={() => setFailed(true)} />
        )}
      </View>
    );
  }

  const source = typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl;
  return (
    <Image
      source={source}
      style={{ width: size, height: size, borderRadius: BorderRadius.xs }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  svgWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
