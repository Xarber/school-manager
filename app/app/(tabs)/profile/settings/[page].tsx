import { useAlert } from "@/components/alert/AlertContext";
import DashboardItem from "@/components/dashboardItem";
import { themeList } from "@/constants/colors";
import i18n, { translations } from "@/constants/i18n";
import { useLanguage } from "@/constants/LanguageContext";
import { useNetworkContext } from "@/constants/NetworkContext";
import createStyling, { defaultScreenSizes } from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { useAccountData } from "@/data/AccountDataContext";
import { turnOffNotifications, turnOnNotifications } from "@/data/notifications";
import { useUserData } from "@/data/UserDataContext";
import { addPasskey } from "@/utils/passkeyLogin";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { RadioButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function settingsPage() {
    const params = useLocalSearchParams();
    const action = params.page as string;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    switch (action) {
        case "appearance": 
            return <View style={[commonStyle.dashboardSection, {flex: 1}]}><AppearanceTab /></View>;
        case "language":
            return <View style={[commonStyle.dashboardSection, {flex: 1}]}><LanguageTab /></View>;
        case "security":
            return <View style={[commonStyle.dashboardSection, {flex: 1}]}><SecurityTab /></View>;
        case "notifications":
            return <View style={[commonStyle.dashboardSection, {flex: 1}]}><NotificationsTab /></View>;
        case "applock":
            return <View style={[commonStyle.dashboardSection, {flex: 1}]}><AppLockTab /></View>;
        default: 
            return <AllSettingsTab />
    }
}

function LanguageTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    
    const language = useLanguage();
    const userData = useUserData();

    const languages = Object.keys(translations).map(locale=>({locale, name: i18n.t(`languages.${locale}`)}));

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.language.stack.title")}} />
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="chatbox-outline" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.language.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.language.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
                        <View style={commonStyle.dashboardSection}>
                            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.language.header.text")}</Text>
                            <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, language: v}})}} value={userData.data.settings?.language ?? "system"}>
                                <RadioButton.Item label={i18n.t("profile.settings.language.system.text")} value="system" labelStyle={commonStyle.text} />
                                {languages.map((l, i)=>
                                    <RadioButton.Item key={i} label={l.name} value={l.locale} labelStyle={commonStyle.text} />
                                )}
                            </RadioButton.Group>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </>
    )
}

type PasskeyData = {
    _id: string;
    name: string;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
    createdAt: string;
    lastUsedAt: string | null;
};

function SecurityTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const network = useNetworkContext();
    const accountData = useAccountData();
    const alert = useAlert();
    const [passkeys, setPasskeys] = useState<PasskeyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const safeAreaInsets = useSafeAreaInsets();
    const bottomInset = safeAreaInsets.bottom === 0 ? 20 : safeAreaInsets.bottom;

    async function loadPasskeys() {
        if (!network.serverPath || !accountData.data.token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${network.serverPath}/api/passkeys/get`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accountData.data.token}`,
                },
            });
            const body = await response.json();

            if (!response.ok || !body.success || !Array.isArray(body.data)) {
                throw new Error(body.error ?? "Could not load passkeys");
            }

            setPasskeys(body.data);
        } catch (error) {
            console.error("Could not load passkeys", error);
            alert.show({
                title: i18n.t("profile.settings.security.passkeys.error.title"),
                message: error instanceof Error
                    ? error.message
                    : i18n.t("profile.settings.security.passkeys.error.description"),
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            void loadPasskeys();
        }, 0);

        return () => clearTimeout(timeout);
        // loadPasskeys intentionally reloads only when the active API or account changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [network.serverPath, accountData.data.token]);

    async function handleAddPasskey() {
        if (!network.serverPath || !accountData.data.token || adding) return;

        setAdding(true);
        try {
            const success = await addPasskey(network.serverPath, accountData.data.token);
            if (!success) return;

            await loadPasskeys();
            alert.show({
                title: i18n.t("profile.settings.security.passkeys.add.success.title"),
                message: i18n.t("profile.settings.security.passkeys.add.success.description"),
                actions: [{
                    title: i18n.t("profile.settings.security.passkeys.actions.ok"),
                    onPress: alert.hide,
                }],
            });
        } catch (error) {
            console.error("Could not add passkey", error);
            alert.show({
                title: i18n.t("profile.settings.security.passkeys.error.title"),
                message: error instanceof Error
                    ? error.message
                    : i18n.t("profile.settings.security.passkeys.error.description"),
            });
        } finally {
            setAdding(false);
        }
    }

    async function deletePasskey(passkeyId: string) {
        if (!network.serverPath || !accountData.data.token) return;

        setDeletingId(passkeyId);
        try {
            const response = await fetch(`${network.serverPath}/api/passkeys/delete`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accountData.data.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ passkeyId }),
            });
            const body = await response.json();

            if (!response.ok || !body.success) {
                throw new Error(body.error ?? "Could not remove passkey");
            }

            setPasskeys(current => current.filter(passkey => passkey._id !== passkeyId));
        } catch (error) {
            console.error("Could not remove passkey", error);
            alert.show({
                title: i18n.t("profile.settings.security.passkeys.error.title"),
                message: error instanceof Error
                    ? error.message
                    : i18n.t("profile.settings.security.passkeys.error.description"),
            });
        } finally {
            setDeletingId(null);
        }
    }

    function confirmDelete(passkey: PasskeyData) {
        alert.show({
            title: i18n.t("profile.settings.security.passkeys.delete.title"),
            message: i18n.t("profile.settings.security.passkeys.delete.description", { name: passkey.name }),
            actions: [
                {
                    title: i18n.t("profile.settings.security.passkeys.actions.cancel"),
                    onPress: alert.hide,
                },
                {
                    title: i18n.t("profile.settings.security.passkeys.actions.delete"),
                    onPress: () => {
                        alert.hide();
                        void deletePasskey(passkey._id);
                    },
                },
            ],
        });
    }

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.security.stack.title")}} />
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="shield-checkmark-outline" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.security.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.security.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset }}>
                        <View style={[commonStyle.dashboardSection, { gap: 12 }]}>
                            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.security.passkeys.title")}</Text>
                            <Text style={commonStyle.text}>{i18n.t("profile.settings.security.passkeys.description")}</Text>

                            <TouchableOpacity
                                disabled={adding || !network.serverPath || !accountData.data.token}
                                onPress={handleAddPasskey}
                                style={[modalStyle.cardEditField, {
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    opacity: adding ? 0.6 : 1,
                                }]}
                            >
                                {adding
                                    ? <ActivityIndicator size="small" color={theme.primary} />
                                    : <Ionicons name="add-circle-outline" size={22} color={theme.primary} />}
                                <Text style={[modalStyle.cardEditFieldText, { color: theme.primary }]}>
                                    {i18n.t("profile.settings.security.passkeys.add.button")}
                                </Text>
                            </TouchableOpacity>

                            {loading ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : passkeys.length === 0 ? (
                                <View style={commonStyle.dashboardSectionContainer}>
                                    <Text style={commonStyle.text}>{i18n.t("profile.settings.security.passkeys.empty")}</Text>
                                </View>
                            ) : (
                                <View style={commonStyle.dashboardSectionContainer}>
                                    {passkeys.map(passkey => (
                                        <View key={passkey._id} style={[commonStyle.dashboardSectionItem, { flexDirection: "row", alignItems: "center" }]}>
                                            <Ionicons name="key-outline" size={24} color={theme.primary} />
                                            <View style={{ flex: 1, marginHorizontal: 12, gap: 3 }}>
                                                <Text style={commonStyle.text}>{passkey.name}</Text>
                                                <Text style={[commonStyle.text, { fontSize: 12, opacity: 0.7 }]}>
                                                    {i18n.t("profile.settings.security.passkeys.item.created", {
                                                        date: new Date(passkey.createdAt).toLocaleDateString(),
                                                    })}
                                                </Text>
                                                {passkey.lastUsedAt && (
                                                    <Text style={[commonStyle.text, { fontSize: 12, opacity: 0.7 }]}>
                                                        {i18n.t("profile.settings.security.passkeys.item.lastUsed", {
                                                            date: new Date(passkey.lastUsedAt).toLocaleDateString(),
                                                        })}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                disabled={deletingId === passkey._id}
                                                onPress={() => confirmDelete(passkey)}
                                                accessibilityLabel={i18n.t("profile.settings.security.passkeys.actions.delete")}
                                                style={{ padding: 8 }}
                                            >
                                                {deletingId === passkey._id
                                                    ? <ActivityIndicator size="small" color={theme.caution} />
                                                    : <Ionicons name="trash-outline" size={21} color={theme.caution} />}
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </>
    )
}

function NotificationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const accountData = useAccountData();
    const userData = useUserData();
    const alert = useAlert();
    const [loading, setLoading] = useState(false);

    const notificationsEnabled = (userData.data.pushtokens ?? []).find((token: string) => token === accountData.data.pushToken) !== undefined;

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.notifications.stack.title")}} />
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="chatbox-outline" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.notifications.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.notifications.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
                        <View style={commonStyle.dashboardSection}>
                            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.notifications.header.text")}</Text>
                            <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between"}]}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("profile.settings.notifications.switch")}</Text>
                                    {loading ? <ActivityIndicator size="small" color={theme.text} /> : (
                                        <Switch value={notificationsEnabled} onValueChange={(value)=>{
                                            setLoading(true);
                                            if (value === true) turnOnNotifications({accountData, userData}).finally(()=>setLoading(false)).catch(e=>{
                                                alert.show({
                                                    title: i18n.t("welcome.notifications.error.title"),
                                                    message: i18n.t("welcome.notifications.error.description"),
                                                    actions: [
                                                        {
                                                            title: i18n.t("welcome.notifications.error.ok"),
                                                            onPress: ()=>{
                                                                alert.hide();
                                                            }
                                                        }
                                                    ]
                                                });
                                            });
                                            else turnOffNotifications({accountData, userData}).finally(()=>setLoading(false))
                                        }}/>
                                    )}
                            </View>
                            <Text style={[commonStyle.card, commonStyle.text]}>{i18n.t("profile.settings.notifications.description")}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </>
    )
}

function AppLockTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const accountData = useAccountData();
    const userData = useUserData();
    const alert = useAlert();
    const [loading, setLoading] = useState(false);
    const [persistLoading, setPersistLoading] = useState(false);
    const [restartRequired, setRestartRequired] = useState(false);

    const appLockEnabled = userData.data.settings?.appLock ?? false;
    const appLockPersist = userData.data.settings?.appLockPersist ?? false;

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.applock.stack.title")}} />
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="lock-closed" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.applock.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.applock.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
                        <View style={commonStyle.dashboardSection}>
                            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.applock.header.text")}</Text>
                            <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between"}]}>
                                <Text style={modalStyle.cardEditFieldText}>{i18n.t("profile.settings.applock.switch")}</Text>
                                {loading ? <ActivityIndicator size="small" color={theme.text} /> : (
                                    <Switch value={appLockEnabled} onValueChange={(value)=>{
                                        setLoading(true);
                                        userData.save({...userData.data, settings: {...userData.data.settings, appLock: value}}).finally(()=>{setLoading(false)});
                                    }}/>
                                )}
                            </View>
                            {
                                appLockEnabled && (
                                    <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between"}]}>
                                        <Text style={modalStyle.cardEditFieldText}>{i18n.t("profile.settings.applock.persistswitch")}</Text>
                                        {persistLoading ? <ActivityIndicator size="small" color={theme.text} /> : (
                                            <Switch value={appLockPersist} onValueChange={(value)=>{
                                                setPersistLoading(true);
                                                //setRestartRequired(true);
                                                userData.save({...userData.data, settings: {...userData.data.settings, appLockPersist: value}}).finally(()=>{setPersistLoading(false)});
                                            }}/>
                                        )}
                                    </View>
                                )
                            }
                            <Text style={[commonStyle.card, commonStyle.text]}>{i18n.t("profile.settings.applock.description")}</Text>
                            {restartRequired && (
                                <View style={modalStyle.cardWarn}>
                                    <View style={modalStyle.cardWarnIcon}>
                                        <Ionicons name="warning-outline" size={30} color={theme.text} />
                                    </View>
                                    <Text style={modalStyle.cardWarnText}>{i18n.t("profile.settings.restartrequired")}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </>
    )
}

function AppearanceTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const userData = useUserData();
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    let themes = themeList.all;
    const alert = useAlert();
    const hiddenthemes = themeList.hidden;
    const specialthemes = themeList.special;
    let displayedSpecialThemes = themeList.special.filter(theme => {
        if (userData.data.settings.theme == theme) return true;
        switch (theme) {
            case 'redgradient':
                return userData.data.name == "Angelica Polidoro"
        }
    });

    let contrastPaletteValues = Object.values(theme.contrastPalette);
    let contrastColor = contrastPaletteValues[Math.floor(Math.random() * contrastPaletteValues.length)];

    if (!themes.includes(userData.data.settings.theme) && !hiddenthemes.includes(userData.data.settings.theme) && !specialthemes.includes(userData.data.settings.theme)) userData.save({...userData.data, settings: {...userData.data.settings, theme: "system"}});
    else if (hiddenthemes.includes(userData.data.settings.theme)) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="small" color={contrastColor} />
        </View>
    )

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.appearance.stack.title")}} />
            {(specialthemes.includes("exams") && userData.data.settings.theme != "exams") && <TouchableOpacity style={{ position: "absolute", top: 0, left: 0, width: 30, height: 30, zIndex: 999 }} onPress={()=>{
                userData.save({...userData.data, settings: {...userData.data.settings, theme: "exams"}}).then(()=>{
                    alert.show({
                        title: i18n.t("profile.settings.appearance.exams.title"),
                        message: i18n.t("profile.settings.appearance.exams.message"),
                    });
                })
            }}></TouchableOpacity>}
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="color-palette-outline" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.appearance.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.appearance.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
                        <View style={commonStyle.dashboardSection}>
                            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.appearance.header.text")}</Text>
                            <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, theme: v}})}} value={userData.data.settings.theme}>
                                {themes.map((t, i)=>
                                    <RadioButton.Item key={t} style={{ display: "flex" }} label={i18n.t(`profile.settings.appearance.${t}.text`)} value={t} labelStyle={commonStyle.text} />
                                )}
                                {displayedSpecialThemes.map((t, i)=>
                                    <RadioButton.Item key={t} style={{ display: "flex" }} label={i18n.t(`profile.settings.appearance.${t}.text`)} value={t} labelStyle={commonStyle.text} />
                                )}
                            </RadioButton.Group>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </>
    )
}

function AllSettingsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const alert = useAlert();
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.stack.title")}} />
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, {justifyContent: "center", gap: 5, alignItems: "center", height: "100%"}]}>
                    <Ionicons name="settings-outline" size={50} color={theme.text} />
                    <Text style={commonStyle.headerText}>{i18n.t("profile.settings.general.header.title")}</Text>
                    <Text style={commonStyle.text}>{i18n.t("profile.settings.general.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
                        <DashboardItem title={i18n.t("profile.settings.general.title")} items={[
                            { title: i18n.t("profile.settings.general.profile.title"), description: i18n.t("profile.settings.general.profile.description"), onPress: () => {
                                router.push("/profile/profiledata");
                            } },
                            { title: i18n.t("profile.settings.general.security.title"), description: i18n.t("profile.settings.general.security.description"), onPress: () => {
                                router.push("/profile/settings/security");
                            } },
                            { title: i18n.t("profile.settings.general.applock.title"), description: i18n.t("profile.settings.general.applock.description"), onPress: () => {
                                router.push("/profile/settings/applock");
                            } },
                            { title: i18n.t("profile.settings.general.appearance.title"), description: i18n.t("profile.settings.general.appearance.description"), onPress: () => {
                                router.push("/profile/settings/appearance");
                            } },
                            { title: i18n.t("profile.settings.general.language.title"), description: i18n.t("profile.settings.general.language.description"), onPress: () => {
                                router.push("/profile/settings/language");
                            } },
                            { title: i18n.t("profile.settings.general.notifications.title"), description: i18n.t("profile.settings.general.notifications.description"), onPress: () => {
                                router.push("/profile/settings/notifications");
                            } },
                        ]} noItemsText={i18n.t("profile.settings.general.noitems.text")} />
                        <DashboardItem title={i18n.t("profile.settings.data.title")} items={[
                            { title: i18n.t("profile.settings.data.clear.title"), description: i18n.t("profile.settings.data.clear.description"), onPress: () => {
                                AsyncStorage.clear().then(()=>alert.show({title: i18n.t("profile.settings.data.clear.success.title"), message: i18n.t("profile.settings.data.clear.success.description")}));
                            } },
                        ]} noItemsText={i18n.t("profile.settings.data.noitems.text")} />
                    </ScrollView>
                </View>
            </View>
        </>
    );
}
