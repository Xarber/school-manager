import { useColorScheme } from "react-native";
import { colors, Theme, Scheme } from "./colors";
import { useAppDataSync } from "@/data/datamanager";
import { DataManager } from "@/data/datamanager";
import { useState } from "react";
import useThemeContext from "./ThemeContext";

export function useTheme(): Theme {
  let scheme: Scheme = useThemeContext();

  return colors[scheme];
}