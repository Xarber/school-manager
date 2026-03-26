/* Check user color scheme */
import { DarkTheme, DefaultTheme, Theme as NavTheme } from "@react-navigation/native";
import { Color } from 'expo-router';
import { Platform } from 'react-native';

export type Scheme = 'light' | 'dark' | 'schoolmanager' | 'rainbow' | 'exams' | 'redgradient';

export function createNavigationTheme(theme: Theme): NavTheme {
  const base = theme.type === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.opaqueCard,
      text: theme.text,
      primary: theme.primary,
      border: theme.opaqueCard,
      notification: theme.secondary,
    },
  };
}

export const themeList = {
  all: ["system", "light", "dark", "schoolmanager"] as string[],
  hidden: ["rainbow"] as string[],
  special: ["exams", "redgradient"] as string[]
}

export type Theme = {
  type: 'light' | 'dark';
  background: string;
  overlayBackground: string;
  text: string;
  card: string;
  opaqueCard: string;
  primary: string;
  secondary: string;
  caution: string;
  action: string;
  disabled: string;
  contrastPalette: {
    one: string;
    two: string;
    three: string;
    four: string;
  }
  surface: string;
  appThemeGradient: {
    colors: [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    opacity?: number;
  }
};

export const colors = {
  light: {
    type: "light",
    background: "#fff",
    overlayBackground: "rgba(0, 0, 0, 0.05)",
    text: "#000",
    card: "rgba(0, 0, 0, 0.05)",
    opaqueCard: "rgba(200, 200, 200, 1)",
    primary: "#007AFF",
    secondary: "#5856D6",
    caution: "#FF3B30",
    action: "#c4c4c4",
    disabled: "rgba(0, 0, 0, 0.3)",
    contrastPalette: {
      one: "#007AFF",
      two: "#86e600",
      three: "#bf00ff",
      four: "#ff7b00",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(0, 0, 0, 0.05)",
    appThemeGradient: {
      colors: ["rgb(255, 255, 255)", "rgb(255, 255, 255)"],
    }
  } as Theme,
  dark: {
    type: "dark",
    background: "#000",
    overlayBackground: "rgba(255, 255, 255, 0.05)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgba(30, 30, 30, 1)",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    contrastPalette: {
      one: "#007AFF",
      two: "#86e600",
      three: "#bf00ff",
      four: "#ff7b00",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.05)",
    appThemeGradient: {
      colors: ["rgb(0, 0, 0)", "rgb(0, 0, 0)"],
    }
  } as Theme,
  schoolmanager: {
    type: "dark",
    background: "rgb(0, 0, 0)",
    overlayBackground: "rgba(255, 255, 255, 0.05)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgb(23, 29, 43)",
    primary: "#306eff",
    secondary: "#6027dd",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    contrastPalette: {
      one: "#007AFF",
      two: "#86e600",
      three: "#bf00ff",
      four: "#ff7b00",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(0, 0, 0, 0.3)",
    appThemeGradient: {
      colors: ["rgb(56, 78, 104)", "rgb(32, 5, 75)"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    }
  } as Theme,
  rainbow: {
    type: "light",
    background: "rgb(255, 255, 255)",
    overlayBackground: "rgba(0, 0, 0, 0.05)",
    text: "#000",
    card: "rgba(0, 0, 0, 0.05)",
    opaqueCard: "rgb(224, 224, 224)",
    primary: "#306eff",
    secondary: "#6027dd",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    contrastPalette: {
      one: "#7bacff",
      two: "#cbff81",
      three: "#de7dff",
      four: "#ffbe82",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(0, 0, 0, 0.05)") : "rgba(0, 0, 0, 0.3)",
    appThemeGradient: {
      colors: ["#ff000075", "#ffff0075", "#00ff0075", "#00ffff75", "#0000ff75", "#ff00ff75", "#ff000075"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    }
  } as Theme,
  exams: {
    type: "dark",
    background: "rgb(0, 0, 0)",
    overlayBackground: "rgba(255, 255, 255, 0.05)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgb(46, 46, 46)",
    primary: "#306eff",
    secondary: "#6027dd",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    contrastPalette: {
      one: "#005eff",
      two: "#95ff00",
      three: "#bf00ff",
      four: "#ff7b00",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.3)",
    appThemeGradient: {
      colors: ["rgb(29,29,29)", "rgb(55,39,23)"],
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    }
  } as Theme,
  redgradient: {
    type: "dark",
    background: "rgb(0, 0, 0)",
    overlayBackground: "rgba(255, 255, 255, 0.05)",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    opaqueCard: "rgb(47, 0, 0)",
    primary: "#ec2b00",
    secondary: "#5900ff",
    caution: "#FF0000",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
    contrastPalette: {
      one: "#005eff",
      two: "#95ff00",
      three: "#bf00ff",
      four: "#fff700",
    },
    surface: Platform.OS === "android" ? (Color.android.dynamic.surface ?? "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.3)",
    appThemeGradient: {
      colors: ["#901623", "#5d0000"],
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    }
  } as Theme,
} satisfies Record<Scheme, Theme>;