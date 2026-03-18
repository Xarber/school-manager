import { colors, Theme, Scheme } from "./colors";
import { useThemeContext } from "./ThemeContext";

export function useTheme(simple: boolean = false): Theme {
  let scheme: Scheme = useThemeContext();
  let using = colors[scheme];
  if (simple === true) using = colors[colors[scheme].type];

  return using;
}