import { useColorScheme } from "react-native";
import { colors, Theme } from "./colors";

export function useTheme(): Theme {
  let scheme = useColorScheme() ?? "light";
  scheme = "dark"; // Force dark mode for testing
  return colors[scheme];
}