import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { syncNow, ensureBackgroundSyncRegistered, startForegroundSync } from "@/data/sync";
import { useEffect } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { ThemeProvider as ContextThemeProvider, useThemeContext } from "@/constants/ThemeContext";
import { Scheme } from "@/constants/colors";
import { AlertProvider } from "@/components/alert/AlertContext";
import { UserDataProvider } from "@/data/UserDataContext";

function AppLayout() {
  const scheme: Scheme = useThemeContext();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <AlertProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <SyncBootstrap />
        <Stack screenOptions={{ headerShown: false }} />
      </AlertProvider>
    </ThemeProvider>
  );
}

function SyncBootstrap() {
  useEffect(() => {
    ensureBackgroundSyncRegistered();      // background schedule (OS decides when) [page:3]
    const stop = startForegroundSync();    // app-open triggers/listeners (AppState, etc.) [web:35]
    return () => stop?.();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <UserDataProvider>
      <ContextThemeProvider>
        <AppLayout />
      </ContextThemeProvider>
    </UserDataProvider>
  );
}