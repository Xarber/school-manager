import { NavigationContainer, ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { Button, Text, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { syncNow, ensureBackgroundSyncRegistered, startForegroundSync } from "@/data/sync";
import { useEffect } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { ThemeProvider as ContextThemeProvider, useThemeContext } from "@/constants/ThemeContext";
import { createNavigationTheme, Scheme } from "@/constants/colors";
import { AlertProvider } from "@/components/alert/AlertContext";
import { UserDataProvider } from "@/data/UserDataContext";
import { AccountDataProvider } from "@/data/AccountDataContext";
import { LanguageProvider } from "@/constants/LanguageContext";
import { colors } from "@/constants/colors";
import { useTheme } from "@/constants/useThemes";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AppLockProvider } from "@/constants/AuthContext";

function AppLayout() {
  const theme = useTheme();
  const navTheme = createNavigationTheme(theme);

  return (
    <LinearGradient
      colors={theme.appThemeGradient.colors}
      start={theme.appThemeGradient.start}
      end={theme.appThemeGradient.end}
      style={{ flex: 1, opacity: theme.appThemeGradient.opacity ?? 1 }}
    >
      <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
        <ThemeProvider value={navTheme}>
          <AppLockProvider>
            <StatusBar style={theme.type === "dark" ? "light" : "dark"} />
            <SyncBootstrap />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
          </AppLockProvider>
        </ThemeProvider>
      </BlurView>
    </LinearGradient>
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
    <AccountDataProvider>
      <UserDataProvider>
        <ContextThemeProvider>
          <LanguageProvider>
            <AlertProvider>
              <AppLayout />
            </AlertProvider>
          </LanguageProvider>
        </ContextThemeProvider>
      </UserDataProvider>
    </AccountDataProvider>
  );
}