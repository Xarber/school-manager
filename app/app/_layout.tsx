import { AlertProvider } from "@/components/alert/AlertContext";
import { AppLockProvider } from "@/constants/AuthContext";
import { LanguageProvider } from "@/constants/LanguageContext";
import { NetworkProvider } from "@/constants/NetworkContext";
import { ThemeProvider as ContextThemeProvider } from "@/constants/ThemeContext";
import { createNavigationTheme } from "@/constants/colors";
import { useTheme } from "@/constants/useThemes";
import { AccountDataProvider } from "@/data/AccountDataContext";
import { ClassDataProvider } from "@/data/ClassContext";
import { ComunicationDataProvider } from "@/data/ComunicationMapContext";
import { DebugDataProvider } from "@/data/DebugDataContext";
import { HomeworkDataProvider } from "@/data/HomeworkMapContext";
import { LessonDataProvider } from "@/data/LessonMapContext";
import { SubjectDataProvider } from "@/data/SubjectMapContext";
import { UserDataProvider } from "@/data/UserDataContext";
import { ensureBackgroundSyncRegistered, startForegroundSync } from "@/data/sync";
import { ThemeProvider } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

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
    <NetworkProvider>
      <AccountDataProvider>
        <DebugDataProvider>
          <UserDataProvider>
            <ClassDataProvider>
              <SubjectDataProvider>
                <ComunicationDataProvider>
                  <LessonDataProvider>
                    <HomeworkDataProvider>
                      <ContextThemeProvider>
                        <LanguageProvider>
                          <AlertProvider>
                            <AppLayout />
                          </AlertProvider>
                        </LanguageProvider>
                      </ContextThemeProvider>
                    </HomeworkDataProvider>
                  </LessonDataProvider>
                </ComunicationDataProvider>
              </SubjectDataProvider>
            </ClassDataProvider>
          </UserDataProvider>
        </DebugDataProvider>
      </AccountDataProvider>
    </NetworkProvider>
  );
}