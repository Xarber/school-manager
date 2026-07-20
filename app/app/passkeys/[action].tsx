import { useEffect, useRef, useState } from 'react';
import { useNetworkContext } from '@/constants/NetworkContext';
import { Platform, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
    startRegistration,
    startAuthentication
} from "@simplewebauthn/browser";
import createStyling from "@/constants/styling";
import { useTheme } from '@/constants/useThemes';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import i18n from '@/constants/i18n';
import { useAccountData } from '@/data/AccountDataContext';
import { LoggedInPage } from '../welcome/account/[action]';
import { AlertProps } from '@/components/alert/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertElement from '@/components/alert/alertElement';

export default function PasskeysPage() {
  const network = useNetworkContext();
  const theme = useTheme();
  const [healthCheckPassed, setHealthCheck] = useState<undefined | boolean>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const commonStyle = createStyling.createCommonStyles(theme);
  const welcomeStyles = createStyling.createWelcomescreenStyles(theme);
  const params = useLocalSearchParams();
  const action = params.action as string;
  const exchangeCode = typeof params.exchangeCode === "string" ? params.exchangeCode : undefined;
  const [step, setStep] = useState<"start" | "run" | "complete">("start");
  const accountData = useAccountData();
  const canAdd = action !== "add" || accountData.data.active || (Platform.OS === "web" && !!exchangeCode);
  const canLogin = action !== "login" || !accountData.data.active || (Platform.OS === "web" && !!exchangeCode);
  const router = useRouter();
  const alertRef = useRef<{ show: (props: AlertProps) => void; hide: () => void} | null>(null);
  const show = (props: AlertProps) => alertRef.current?.show(props);
  const hide = () => alertRef.current?.hide();

  useEffect(() => {
    let active = true;

    async function checkAvailability() {
      if (!network.ready || !network.isOnline || !network.serverReachable || !network.serverPath) {
        return false;
      }
      if (Platform.OS === "web"
          && (typeof window === "undefined" || typeof window.PublicKeyCredential === "undefined")) {
        return false;
      }

      try {
        const response = await fetch(`${network.serverPath}/api/passkeys/get`, { method: "POST" });
        if (!response.ok) return false;

        const data: { data?: { available?: boolean } } = await response.json();
        return data.data?.available === true;
      } catch {
        return false;
      }
    }

    checkAvailability().then(result => {
      if (active) setHealthCheck(result);
    });

    return () => {
      active = false;
    };
  }, [
    network.ready,
    network.isOnline,
    network.serverReachable,
    network.serverPath,
  ]);

  function redirectToNative(result: { exchangeCode?: string; callbackUrl?: string }) {
    if (!exchangeCode) return false;
    if (!result.exchangeCode || !result.callbackUrl) {
      throw new Error("The server did not return a native exchange result");
    }

    const callback = new URL(result.callbackUrl);
    callback.searchParams.set("exchangeCode", result.exchangeCode);
    window.location.replace(callback.toString());
    return true;
  }

  async function registerPasskey(name: string = "Passkey") {
    if (!network.serverPath) return false; // Server not ready

    const token = accountData.data.token;
    if (!exchangeCode && !token) return false; // User not authenticated

    // Get passkey options
    const optionsResponse = await fetch(`${network.serverPath}/api/passkeys/add`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "options",
        exchangeCode,
      }),
    });
    const optionsJson = await optionsResponse.json();
    if (!optionsResponse.ok || !optionsJson.success) return false; // Request failed
    const { challengeId, data: options } = optionsJson;

    // Create the passkey
    const credential = await startRegistration({ optionsJSON: options });
    const verifyResponse = await fetch(`${network.serverPath}/api/passkeys/add`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "verify",
        challengeId,
        credential,
        name,
      })
    });
    const verifyJson = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyJson.success) return false; // Verification failed

    if (Platform.OS === "web" && redirectToNative(verifyJson)) {
      return true;
    }

    return true; // Passkey registered
  }

  async function authenticatePasskey() {
    if (!network.serverPath) return false; // Server not ready
    
    // Get passkey options
    const optionsResponse = await fetch(`${network.serverPath}/api/passkeys/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "options",
        exchangeCode,
      }),
    });
    const optionsJson = await optionsResponse.json();
    if (!optionsResponse.ok || !optionsJson.success) return false; // Request failed
    const { challengeId, data: options } = optionsJson;

    // Authenticate with the passkey
    const credential = await startAuthentication({ optionsJSON: options });
    const verifyResponse = await fetch(`${network.serverPath}/api/passkeys/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "verify",
        challengeId,
        credential,
      }),
    });
    const verifyJson = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyJson.success) return false; // Verification failed

    if (Platform.OS === "web" && redirectToNative(verifyJson)) {
      return true;
    }

    return verifyJson; // Authenticated
  }

  async function runNativeExchange() {
    if (!network.serverPath || (action !== "add" && action !== "login")) return false;

    const callbackUrl = AuthSession.makeRedirectUri({
      scheme: "schoolmanager",
      path: `passkeys/${action}`,
    });
    const token = accountData.data.token;
    const verifierBytes = await Crypto.getRandomBytesAsync(32);
    const codeVerifier = Array.from(verifierBytes)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
    );

    const startResponse = await fetch(`${network.serverPath}/api/passkeys/exchange/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(action === "add" && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, callbackUrl, codeChallenge }),
    });
    const startJson = await startResponse.json();
    if (!startResponse.ok || !startJson.success || !startJson.browserUrl) {
      throw new Error(startJson.error ?? "Could not start passkey exchange");
    }

    const browserResult = await WebBrowser.openAuthSessionAsync(
      startJson.browserUrl,
      callbackUrl,
    );
    if (browserResult.type !== "success") return false;

    const resultCode = new URL(browserResult.url).searchParams.get("exchangeCode");
    if (!resultCode) throw new Error("Missing passkey result code");

    const completeResponse = await fetch(`${network.serverPath}/api/passkeys/exchange/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(action === "add" && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, exchangeCode: resultCode, codeVerifier }),
    });
    const completeJson = await completeResponse.json();
    if (!completeResponse.ok || !completeJson.success) {
      throw new Error(completeJson.error ?? "Could not complete passkey exchange");
    }

    return completeJson;
  }

  async function runStep() {
    setLoading(true);

    try {
      const result = Platform.OS === "web"
        ? (action === "add" ? await registerPasskey() : await authenticatePasskey())
        : await runNativeExchange();

      if (!result) return;

      if (action === "login" && typeof result !== "boolean") {
        await accountData.save({
          ...accountData.data,
          active: true,
          username: result.email,
          token: result.token,
        });
      }

      setStep("complete");
    } catch (error) {
      console.error("Passkey action failed", error);
    } finally {
      setLoading(false);
    }
  }

  if (action !== "add" && action !== "login") return <InvalidAction/>;

  switch (step) {
    case "start": 
      return (
        <View style={[commonStyle.dashboardSection, {flex: 1}]}>
          <View style={{ alignItems: "center", justifyContent: "center", gap: 30, flex: 1 }}>
            <Octicons name="passkey-fill" size={70} color={theme.primary} />

            <View style={{ gap: 10 }}>
              <Text style={[commonStyle.headerText, {textAlign: "center"}]}>{i18n.t(`passkeys.${action}.title`)}</Text>
              <Text style={[commonStyle.text, {textAlign: "center"}]}>{i18n.t(`passkeys.${action}.description`)}</Text>
            </View>

            <View style={[commonStyle.dashboardSectionContainer, { backgroundColor: "rgba(255, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255, 0, 0, 1)", borderRadius: 10, flexDirection: "row", alignItems: "center" }, (healthCheckPassed === false ? {  } : { display: "none" })]}>
              <Ionicons name="warning-outline" size={30} color="rgba(255, 0, 0, 1)" />
              <Text style={commonStyle.text}>{i18n.t(`passkeys.unavailable.warning`)}</Text>
            </View>

            <View style={[commonStyle.dashboardSectionContainer, { backgroundColor: "rgba(255, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255, 0, 0, 1)", borderRadius: 10, flexDirection: "row", alignItems: "center" }, (!accountData.loading && !canAdd ? {  } : { display: "none" })]}>
              <Ionicons name="warning-outline" size={30} color="rgba(255, 0, 0, 1)" />
              <Text style={commonStyle.text}>{i18n.t(`passkeys.notloggedin.warning`)}</Text>
            </View>

            <View style={[commonStyle.dashboardSectionContainer, { backgroundColor: "rgba(255, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255, 0, 0, 1)", borderRadius: 10, flexDirection: "row", alignItems: "center" }, (!accountData.loading && !canLogin ? {  } : { display: "none" })]}>
              <Ionicons name="warning-outline" size={30} color="rgba(255, 0, 0, 1)" />
              <Text style={commonStyle.text}>{i18n.t(`passkeys.alreadyloggedin.warning`)}</Text>
            </View>
          </View>

          <View style={welcomeStyles.actions}>
              <TouchableOpacity disabled={!network.ready || !network.isOnline || !network.serverReachable || !healthCheckPassed || !canAdd || !canLogin} style={[welcomeStyles.actionsButton, (!network.ready || !network.isOnline || !network.serverReachable || !healthCheckPassed || !canAdd || !canLogin) ? { backgroundColor: theme.disabled } : null]} onPress={() => runStep()}>
                  {(network.ready && healthCheckPassed !== undefined && !loading) ?
                      <Text style={welcomeStyles.actionsButtonText}>{healthCheckPassed === true && canAdd && canLogin ? i18n.t(`passkeys.${action}.continue`) : i18n.t(`passkeys.unavailable.button`)}</Text>
                      : <ActivityIndicator size="small" color={theme.text} />
                  }
              </TouchableOpacity>
          </View>
        </View>
      );
    case "complete":
      if (action === "login") return (
          <SafeAreaView
              style={{flex: 1}}
              edges={["bottom", "left", "right", "top"]}
          >
              <LoggedInPage alert={{show, hide}} />
              <AlertElement ref={alertRef} />
          </SafeAreaView>
      );
      else if (action === "add") return (
        <View style={[commonStyle.dashboardSection, {flex: 1}]}>
          <View style={{ alignItems: "center", justifyContent: "center", gap: 30, flex: 1 }}>
            <Ionicons name="checkmark-outline" size={70} color={theme.primary} />

            <View style={{ gap: 10 }}>
              <Text style={[commonStyle.headerText, {textAlign: "center"}]}>{i18n.t(`passkeys.${action}.success.title`)}</Text>
              <Text style={[commonStyle.text, {textAlign: "center"}]}>{i18n.t(`passkeys.${action}.success.description`)}</Text>
            </View>
          </View>

          <View style={welcomeStyles.actions}>
              <TouchableOpacity style={[welcomeStyles.actionsButton]} onPress={() => router.dismiss()}>
                <Text style={welcomeStyles.actionsButtonText}>{i18n.t(`passkeys.${action}.success.continue`)}</Text>
              </TouchableOpacity>
          </View>
        </View>
      );
      break;
    default:
      return <InvalidAction/>;
  }

}

function InvalidAction() {
  const theme = useTheme();
  const commonStyle = createStyling.createCommonStyles(theme);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Ionicons name="warning-outline" size={50} color={theme.text} />
      <Text style={commonStyle.headerText}>{i18n.t(`passkeys.invalidaction.title`)}</Text>
      <Text style={commonStyle.text}>{i18n.t(`passkeys.invalidaction.description`)}</Text>
    </View>
  )
}
