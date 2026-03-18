/* Check user color scheme */
import { Color } from 'expo-router';
import { ColorValue, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, Theme as NavTheme } from "@react-navigation/native";

export type Scheme = 'light' | 'dark' | 'schoolmanager';

export function createNavigationTheme(theme: Theme): NavTheme {
  const base = theme.type === "dark" ? DarkTheme : DefaultTheme;

  console.warn(theme.background);

  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.opaqueCard,
      text: theme.text,
      primary: theme.primary,
      border: theme.card,
      notification: theme.secondary,
    },
  };
}

export type Theme = {
  type: 'light' | 'dark';
  name: string;
  background: string;
  opaqueBackground: string;
  text: string;
  card: string;
  opaqueCard: string;
  primary: string;
  secondary: string;
  caution: string;
  action: string;
  disabled: string;
  surface: string;
  appThemeGradient: {
    colors: [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    opacity: number;
  }
};

export const colors = {
  light: {
    type: "light",
    name: "light",
    background: "#fff",
    opaqueBackground: "rgba(255, 255, 255, 1)",
    text: "#000",
    card: "rgba(0, 0, 0, 0.05)",
    opaqueCard: "rgba(255, 255, 255, 1)",
    primary: "#007AFF",
    secondary: "#5856D6",
    caution: "#FF3B30",
    action: "#c4c4c4",
    disabled: "rgba(0, 0, 0, 0.3)",
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(255, 255, 255, 0.05)",
    appThemeGradient: {
      colors: ["rgb(255, 255, 255)", "rgb(255, 255, 255)"],
      opacity: 1
    }
  } as Theme,
  dark: {
    type: "dark",
    name: "dark",
    background: "#000",
    opaqueBackground: "rgba(0, 0, 0, 1)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgba(30, 30, 30, 1)",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(255, 255, 255, 0.05)",
    appThemeGradient: {
      colors: ["rgb(0, 0, 0)", "rgb(0, 0, 0)"],
      opacity: 1
    }
  } as Theme,
  schoolmanager: {
    type: "light",
    name: "schoolmanager",
    background: "rgba(0, 0, 0, 0.7)",
    opaqueBackground: "rgba(0, 0, 0, 1)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgb(50, 0, 0)",
    primary: "#de8282",
    secondary: "#e36f4f",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(0, 0, 0, 0.3)",
    appThemeGradient: {
      colors: ["rgba(137,188,250, 0.3)", "rgba(101,17,234, 0.3)"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      opacity: 1
    }
  } as Theme
} satisfies Record<Scheme, Theme>;