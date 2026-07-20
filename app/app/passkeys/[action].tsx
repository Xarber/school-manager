import { useEffect, useRef, useState } from 'react';
import { useNetworkContext } from '@/constants/NetworkContext';
import { Platform, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
    startRegistration,
    startAuthentication
} from "@simplewebauthn/browser";
import createStyling from "@/constants/styling";
import { useTheme } from '@/constants/useThemes';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import i18n from '@/constants/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const commonStyle = createStyling.createCommonStyles(theme);
  const welcomeStyles = createStyling.createWelcomescreenStyles(theme);
  const params = useLocalSearchParams();
  const action = params.action as string;
  const [step, setStep] = useState<"start" | "run" | "complete">("start");
  const accountData = useAccountData();
  const router = useRouter();
  const alertRef = useRef<{ show: (props: AlertProps) => void; hide: () => void} | null>(null);
  const show = (props: AlertProps) => alertRef.current?.show(props);
  const hide = () => alertRef.current?.hide();

  async function healthCheck() {
    if (Platform.OS !== 'web') return false; // Isn't running in browser
    if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') return false; // Passkeys unsupported
    if (!network.serverPath) return false; // Server not found

    try {
        const response = await fetch( `${network.serverPath}/api/passkeys/get`, {method: "POST"});
        if (!response.ok) return false; // Request failed

        const data: {
          data?: {
            available?: boolean;
            service?: string;
          }
        } = await response.json();

        if (!data.data?.available) return false; // Unavailable
        return true;
    } catch (error) {
      return false; // Errored (request failed)
    }
  }
  useEffect(() => {
    if (!network.ready || !network.isOnline || !network.serverReachable) {
      setHealthCheck(false);
      return;
    }

    let active = true;

    healthCheck().then(result => {
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

  async function registerPasskey(name: string = "Passkey") {
    if (!network.serverPath) return false; // Server not ready

    const token = accountData.data.token;
    if (!token) return false; // User not authenticated;

    // Get passkey options
    const optionsResponse = await fetch(`${network.serverPath}/api/passkeys/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "options",
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
        Authorization: `Bearer ${token}`,
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

    return verifyJson; // Authenticated
  }

  function runStep() {
    if (action === "add") {
      setLoading(true);

      registerPasskey().then((r)=>{
        setLoading(false);
        if (!r) return;
        setSuccess(true);
        setStep("complete");
      }).catch(e=>{
        setSuccess(false);
        setLoading(false);
      });
    } else if (action === "login") {
      setLoading(true);

      authenticatePasskey().then((r)=>{
        setLoading(false);
        if (!r || !r.success) return;
        console.log(r);
        accountData.save({
          ...accountData.data,
          active: true,
          username: r.email,
          token: r.token
        }).then(() => {
          setSuccess(true);
          setStep("complete");
        });
      }).catch(e=>{
        setSuccess(false);
        setLoading(false);
      })
    }
  }

  if (action != "add" && action != "login") return <InvalidAction/>;

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

            <View style={[commonStyle.dashboardSectionContainer, { backgroundColor: "rgba(255, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255, 0, 0, 1)", borderRadius: 10, flexDirection: "row", alignItems: "center" }, (!accountData.loading && (action === "add" && !accountData.data.active) ? {  } : { display: "none" })]}>
              <Ionicons name="warning-outline" size={30} color="rgba(255, 0, 0, 1)" />
              <Text style={commonStyle.text}>{i18n.t(`passkeys.notloggedin.warning`)}</Text>
            </View>

            <View style={[commonStyle.dashboardSectionContainer, { backgroundColor: "rgba(255, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255, 0, 0, 1)", borderRadius: 10, flexDirection: "row", alignItems: "center" }, (!accountData.loading && (action === "login" && !!accountData.data.active) ? {  } : { display: "none" })]}>
              <Ionicons name="warning-outline" size={30} color="rgba(255, 0, 0, 1)" />
              <Text style={commonStyle.text}>{i18n.t(`passkeys.alreadyloggedin.warning`)}</Text>
            </View>
          </View>

          <View style={welcomeStyles.actions}>
              <TouchableOpacity disabled={!network.ready || !network.isOnline || !network.serverReachable || !healthCheckPassed || (action === "add" && !accountData.data.active) || (action === "login" && !!accountData.data.active)} style={[welcomeStyles.actionsButton, (!network.ready || !network.isOnline || !network.serverReachable || !healthCheckPassed || (action === "add" && !accountData.data.active) || (action === "login" && !!accountData.data.active)) ? { backgroundColor: theme.disabled } : null]} onPress={() => runStep()}>
                  {(network.ready && healthCheckPassed != undefined && !loading) ? 
                      <Text style={welcomeStyles.actionsButtonText}>{healthCheckPassed === true && ((action === "login" && !accountData.data.active) || (action === "add" && !!accountData.data.active)) ? i18n.t(`passkeys.${action}.continue`) : i18n.t(`passkeys.unavailable.button`)}</Text>
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