/* Check user color scheme */
import { Color } from 'expo-router';
import { Platform } from 'react-native';

export type Scheme = 'light' | 'dark';

export type Theme = {
  type: Scheme;
  background: string;
  text: string;
  card: string;
  opaqueCard: string;
  primary: string;
  secondary: string;
  caution: string;
  action: string;
  disabled: string;
  surface: string;
};

export const colors = {
  light: {
    type: "light",
    background: "#fff",
    text: "#000",
    card: "rgba(0, 0, 0, 0.05)",
    opaqueCard: "rgba(255, 255, 255, 1)",
    primary: "#007AFF",
    secondary: "#5856D6",
    caution: "#FF3B30",
    action: "#c4c4c4",
    disabled: "rgba(0, 0, 0, 0.3)",
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(255, 255, 255, 0.05)",
  } as Theme,
  dark: {
    type: "dark",
    background: "#000",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgba(30, 30, 30, 1)",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(255, 255, 255, 0.05)",
  } as Theme
} satisfies Record<Scheme, Theme>;