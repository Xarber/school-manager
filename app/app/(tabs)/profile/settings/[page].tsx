import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { RadioButton } from "react-native-paper";

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
            <Stack.Screen options={{headerTitle: "Language"}} />
            <Text style={commonStyle.text}>Language</Text>
        </View>
    )
}

function NotificationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View>
            <Stack.Screen options={{headerTitle: "Notifications"}} />
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
            <Stack.Screen options={{headerTitle: "Appearance"}} />
            <Text style={commonStyle.headerText}>App Theme</Text>
            <RadioButton.Group onValueChange={(v)=>{userData.save({...userData.data, settings: {...userData.data.settings, theme: v}})}} value={userData.data.settings.theme}>
                <RadioButton.Item label="System" value="system" labelStyle={commonStyle.text} />
                <RadioButton.Item label="Light" value="light" labelStyle={commonStyle.text} />
                <RadioButton.Item label="Dark" value="dark" labelStyle={commonStyle.text} />
            </RadioButton.Group>
        </View>
    )
}

function AllSettingsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    return (
        <View style={commonStyle.dashboardSection}>
            <Stack.Screen options={{headerTitle: "Settings"}} />
            <DashboardItem title="General" items={[
                { title: "Your Profile", onPress: () => {
                    router.push("/profile/profiledata");
                } },
                { title: "Appearance", onPress: () => {
                    router.push("/profile/settings/appearance");
                } },
                // { title: "Language", onPress: () => {
                //     router.push("/profile/settings/language");
                // } },
                { title: "Notifications", onPress: () => {
                    router.push("/profile/settings/notifications");
                } },
            ]} noItemsText="Settings" />
            <DashboardItem title="Data" items={[
                { title: "Clear Data", onPress: () => {
                    AsyncStorage.clear().then(()=>Alert.alert("Cleared"));
                } },
            ]} noItemsText="Data" />
        </View>
    );
}