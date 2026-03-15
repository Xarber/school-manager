import { colors, Theme, Scheme } from "./colors";
import { useThemeContext } from "./ThemeContext";

export function useTheme(): Theme {
  let scheme: Scheme = useThemeContext();

  return colors[scheme];
}