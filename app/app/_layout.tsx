import HtmlHead from "@/components/HtmlHead";
import PWAInstallPrompt from "@/components/PwaInstallPrompt";
import { AlertProvider, useAlert } from "@/components/alert/AlertContext";
import { AppLockProvider } from "@/constants/AuthContext";
import { LanguageProvider } from "@/constants/LanguageContext";
import { NetworkProvider, useNetworkContext } from "@/constants/NetworkContext";
import { ThemeProvider as ContextThemeProvider } from "@/constants/ThemeContext";
import { createNavigationTheme } from "@/constants/colors";
import i18n from "@/constants/i18n";
import { useTheme } from "@/constants/useThemes";
import { AccountDataProvider, useAccountData } from "@/data/AccountDataContext";
import { ClassDataProvider } from "@/data/ClassContext";
import { ClassmateDataProvider } from "@/data/ClassmateDataContext";
import { ComunicationDataProvider } from "@/data/ComunicationMapContext";
import { DebugDataProvider } from "@/data/DebugDataContext";
import { HomeworkDataProvider } from "@/data/HomeworkMapContext";
import { LessonDataProvider } from "@/data/LessonMapContext";
import { LessonScheduleDataProvider } from "@/data/LessonScheduleContext";
import { SubjectDataProvider } from "@/data/SubjectMapContext";
import { UserDataProvider } from "@/data/UserDataContext";
import { DataManager } from "@/data/datamanager";
import { ensureBackgroundSyncRegistered, startForegroundSync } from "@/data/sync";
import { getSessionMetadataHeaders } from "@/utils/deviceInfo";
import { ThemeProvider } from "expo-router/react-navigation";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

function InvalidTokenHandler() {
  const accountData = useAccountData();
  const alert = useAlert();
  const router = useRouter();
  const accountRef = useRef(accountData.data);
  const signingOutRef = useRef(false);

  useEffect(() => {
    accountRef.current = accountData.data;
  }, [accountData.data]);

  useEffect(() => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status !== 401 || signingOutRef.current || !accountRef.current.active) {
        return response;
      }

      const body = await response.clone().json().catch(() => null);
      const error = typeof body?.error === "string" ? body.error.trim().toLowerCase() : "";
      if (error !== "invalid token" && error !== "token non valido") {
        return response;
      }

      signingOutRef.current = true;
      const signedOutAccount = { ...accountRef.current, active: false, token: "" };
      accountRef.current = signedOutAccount;
      try {
        // Clear storage first so the account state cannot retry the invalid token.
        await AsyncStorage.setItem(DataManager.accountData.app, JSON.stringify(signedOutAccount));
        await accountData.load();
        alert.show({
          title: i18n.t("components.session.invalidToken.title"),
          message: i18n.t("components.session.invalidToken.description"),
          actions: [
            {
              title: i18n.t("components.session.invalidToken.login"),
              onPress: () => {
                alert.hide();
                router.push("/welcome/account/login");
              },
            },
            {
              title: i18n.t("components.session.invalidToken.dismiss"),
              onPress: alert.hide,
            },
          ],
        });
      } finally {
        signingOutRef.current = false;
      }

      return response;
    };

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [accountData, alert, router]);

  return null;
}

const SESSION_RENEWAL_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SESSION_RENEWAL_COOLDOWN_MS = 60 * 1000;

function SessionRenewal() {
  const accountData = useAccountData();
  const network = useNetworkContext();
  const accountRef = useRef(accountData.data);
  const inFlightRef = useRef(false);
  const lastRenewalRef = useRef(0);

  useEffect(() => {
    accountRef.current = accountData.data;
  }, [accountData.data]);

  useEffect(() => {
    const renewSession = async () => {
      const account = accountRef.current;
      if (!account.active || !account.token || !network.serverPath || network.serverReachable !== true) return;
      if (inFlightRef.current || Date.now() - lastRenewalRef.current < SESSION_RENEWAL_COOLDOWN_MS) return;

      inFlightRef.current = true;
      try {
        const response = await fetch(`${network.serverPath}/api/account/sessions/current/renew`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.token}`,
            ...getSessionMetadataHeaders(),
          },
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success || typeof result.token !== "string") return;

        const renewedAccount = { ...accountRef.current, token: result.token };
        accountRef.current = renewedAccount;
        await AsyncStorage.setItem(DataManager.accountData.app, JSON.stringify(renewedAccount));
        await accountData.load();
        lastRenewalRef.current = Date.now();
      } catch {
        // Offline starts are retried after the network or app state changes.
      } finally {
        inFlightRef.current = false;
      }
    };

    void renewSession();
    const interval = setInterval(() => void renewSession(), SESSION_RENEWAL_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener("change", state => {
      if (state === "active") void renewSession();
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [accountData, network.serverPath, network.serverReachable]);

  return null;
}

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
            <HtmlHead
              manifest={i18n.t("components.rootlayout.manifest")}
              title={i18n.t("components.rootlayout.title")}
              description={i18n.t("components.rootlayout.description")}
              site_name={i18n.t("components.rootlayout.sitename")}
              icon={i18n.t("components.rootlayout.icon")}
              image={i18n.t("components.rootlayout.banner")}
            />
            <StatusBar style={theme.type === "dark" ? "light" : "dark"} />
            <SyncBootstrap />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
            <PWAInstallPrompt />
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
              <ClassmateDataProvider>
                <SubjectDataProvider>
                  <ComunicationDataProvider>
                    <LessonDataProvider>
                      <LessonScheduleDataProvider>
                        <HomeworkDataProvider>
                          <ContextThemeProvider>
                            <LanguageProvider>
                              <AlertProvider>
                                <InvalidTokenHandler />
                                <SessionRenewal />
                                <AppLayout />
                              </AlertProvider>
                            </LanguageProvider>
                          </ContextThemeProvider>
                        </HomeworkDataProvider>
                      </LessonScheduleDataProvider>
                    </LessonDataProvider>
                  </ComunicationDataProvider>
                </SubjectDataProvider>
              </ClassmateDataProvider>
            </ClassDataProvider>
          </UserDataProvider>
        </DebugDataProvider>
      </AccountDataProvider>
    </NetworkProvider>
  );
}
