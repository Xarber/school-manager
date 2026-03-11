import { View, Text, TouchableOpacity } from "react-native";
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
import i18n from "@/constants/i18n";

export default function settingsPage() {
    const params = useLocalSearchParams();
    const action = params.page as string;

    switch (action) {
        case "appearance": 
            return <AppearanceTab />;
        case "language":
            return <LanguageTab />;
        case "notifications":
            return <NotificationsTab />;
        default: 
            return <AllSettingsTab />
    }
}

function LanguageTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.language.stack.title")}} />
            <Text style={commonStyle.text}>Language</Text>
        </View>
    )
}

function NotificationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.notifications.stack.title")}} />
            <Text style={commonStyle.text}>Notifications</Text>
        </View>
    )
}

function AppearanceTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    return (
        <View style={commonStyle.dashboardSection}>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.appearance.stack.title")}} />
            <Text style={commonStyle.headerText}>{i18n.t("profile.settings.appearance.header.text")}</Text>
            <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, theme: v}})}} value={userData.data.settings.theme}>
                <RadioButton.Item label={i18n.t("profile.settings.appearance.system.text")} value="system" labelStyle={commonStyle.text} />
                <RadioButton.Item label={i18n.t("profile.settings.appearance.light.text")} value="light" labelStyle={commonStyle.text} />
                <RadioButton.Item label={i18n.t("profile.settings.appearance.dark.text")} value="dark" labelStyle={commonStyle.text} />
            </RadioButton.Group>
        </View>
    )
}

function AllSettingsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const alert = useAlert();

    return (
        <View style={commonStyle.dashboardSection}>
            <Stack.Screen options={{headerTitle: i18n.t("profile.settings.stack.title")}} />
            <DashboardItem title={i18n.t("profile.settings.general.title")} items={[
                { title: i18n.t("profile.settings.general.profile.title"), onPress: () => {
                    router.push("/profile/profiledata");
                } },
                { title: i18n.t("profile.settings.general.appearance.title"), onPress: () => {
                    router.push("/profile/settings/appearance");
                } },
                // { title: {i18n.t("profile.settings.general.language.title")}, onPress: () => {
                //     router.push("/profile/settings/language");
                // } },
                { title: i18n.t("profile.settings.general.notifications.title"), onPress: () => {
                    router.push("/profile/settings/notifications");
                } },
            ]} noItemsText={i18n.t("profile.settings.general.noitems.text")} />
            <DashboardItem title={i18n.t("profile.settings.data.title")} items={[
                { title: i18n.t("profile.settings.data.clear.title"), onPress: () => {
                    AsyncStorage.clear().then(()=>alert.show({title: i18n.t("profile.settings.data.clear.success.title"), message: i18n.t("profile.settings.data.clear.success.description")}));
                } },
            ]} noItemsText={i18n.t("profile.settings.data.noitems.text")} />
        </View>
    );
}