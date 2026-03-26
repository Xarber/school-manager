import { colors, Scheme, Theme } from "./colors";
import { useThemeContext } from "./ThemeContext";

export function useTheme(force?: Scheme, simple?: boolean): Theme {
  let scheme: Scheme = force ?? useThemeContext();
  let using = colors[scheme];
  if (simple === true) using = colors[colors[scheme].type];

  return using;
}