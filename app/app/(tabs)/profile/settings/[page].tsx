import { View, Text, TouchableOpacity, Switch, ActivityIndicator, ScrollView } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { RadioButton } from "react-native-paper";
import { useAlert } from "@/components/alert/AlertContext";
import i18n, { setLocale, translations } from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import { useLanguage } from "@/constants/LanguageContext";
import { useAccountData } from "@/data/AccountDataContext";
import { turnOffNotifications, turnOnNotifications } from "@/data/notifications";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { themeList } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

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
    
    const language = useLanguage();
    const userData = useUserData();

    const languages = Object.keys(translations).map(locale=>({locale, name: i18n.t(`languages.${locale}`)}));

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <View style={commonStyle.dashboardSection}>
                <Stack.Screen options={{headerTitle: i18n.t("profile.settings.language.stack.title")}} />
                <Text style={commonStyle.headerText}>{i18n.t("profile.settings.language.header.text")}</Text>
                <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, language: v}})}} value={userData.data.settings?.language ?? "system"}>
                    <RadioButton.Item label={i18n.t("profile.settings.language.system.text")} value="system" labelStyle={commonStyle.text} />
                    {languages.map((l, i)=>
                        <RadioButton.Item key={i} label={l.name} value={l.locale} labelStyle={commonStyle.text} />
                    )}
                </RadioButton.Group>
            </View>
        </ScrollView>
    )
}

function NotificationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);

    const accountData = useAccountData();
    const userData = useUserData();
    const alert = useAlert();
    const [loading, setLoading] = useState(false);

    const notificationsEnabled = (userData.data.pushtokens ?? []).find((token: string) => token === accountData.data.pushToken) !== undefined;

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <View style={commonStyle.dashboardSection}>
                <Stack.Screen options={{headerTitle: i18n.t("profile.settings.notifications.stack.title")}} />
                <Text style={commonStyle.headerText}>Notifications</Text>
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
    )
}

function AppLockTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);

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
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <View style={commonStyle.dashboardSection}>
                <Stack.Screen options={{headerTitle: i18n.t("profile.settings.applock.stack.title")}} />
                <Text style={commonStyle.headerText}>App Lock</Text>
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
                                    setRestartRequired(true);
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
    )
}

function AppearanceTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const userData = useUserData();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    let themes = themeList.all;
    const hiddenthemes = themeList.hidden;
    const specialthemes = themeList.special;

    let contrastPaletteValues = Object.values(theme.contrastPalette);
    let contrastColor = contrastPaletteValues[Math.floor(Math.random() * contrastPaletteValues.length)];

    if (!themes.includes(userData.data.settings.theme) && !hiddenthemes.includes(userData.data.settings.theme) && !specialthemes.includes(userData.data.settings.theme)) userData.save({...userData.data, settings: {...userData.data.settings, theme: "system"}});
    else if (hiddenthemes.includes(userData.data.settings.theme)) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="small" color={contrastColor} />
        </View>
    )

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <View style={commonStyle.dashboardSection}>
                <Stack.Screen options={{headerTitle: i18n.t("profile.settings.appearance.stack.title")}} />
                <Text style={commonStyle.headerText}>{i18n.t("profile.settings.appearance.header.text")}</Text>
                <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, theme: v}})}} value={userData.data.settings.theme}>
                    {themes.map((t, i)=>
                        <RadioButton.Item key={t} style={{ display: "flex" }} label={i18n.t(`profile.settings.appearance.${t}.text`)} value={t} labelStyle={commonStyle.text} />
                    )}
                    {specialthemes.map((t, i)=>t === userData.data.settings.theme &&
                        <RadioButton.Item key={t} style={{ display: "flex" }} label={i18n.t(`profile.settings.appearance.${t}.text`)} value={t} labelStyle={commonStyle.text} />
                    )}
                </RadioButton.Group>
            </View>
        </ScrollView>
    )
}

function AllSettingsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const alert = useAlert();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <View style={commonStyle.dashboardSection}>
                <Stack.Screen options={{headerTitle: i18n.t("profile.settings.stack.title")}} />
                <DashboardItem title={i18n.t("profile.settings.general.title")} items={[
                    { title: i18n.t("profile.settings.general.profile.title"), description: i18n.t("profile.settings.general.profile.description"), onPress: () => {
                        router.push("/profile/profiledata");
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
            </View>
        </ScrollView>
    );
}