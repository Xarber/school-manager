import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { syncNow, ensureBackgroundSyncRegistered, startForegroundSync } from "@/data/sync";
import { useEffect } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import useThemeContext from "@/constants/ThemeContext";
import { Scheme } from "@/constants/colors";

function SyncBootstrap() {
  useEffect(() => {
    ensureBackgroundSyncRegistered();      // background schedule (OS decides when) [page:3]
    const stop = startForegroundSync();    // app-open triggers/listeners (AppState, etc.) [web:35]
    return () => stop?.();
  }, []);

  return null;
}

export default function RootLayout() {
  let scheme: Scheme = useThemeContext();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <SyncBootstrap />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}