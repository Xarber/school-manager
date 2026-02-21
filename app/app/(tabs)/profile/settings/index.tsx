import { View, Text } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import { useRouter } from "expo-router";

export default function SettingsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    return (
        <View style={commonStyle.dashboardSection}>
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
                    router.push("/profile/settings/cleardata");
                } },
            ]} noItemsText="Data" />
        </View>
    );
}