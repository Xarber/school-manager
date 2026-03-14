import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import ActionMenu from "@/components/actionMenu";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import GradeGrid from "@/components/gradeGrid";
import { useRouter } from "expo-router";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { Stack } from "expo-router";
import i18n from "@/constants/i18n";

export default function RegistryTab() {
    const theme = useTheme();
    const router = useRouter();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const RegistryStyle = createStyling.createRegistryStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    let registryPageData = {grades: userData.data.grades};
    
    return (
        <>
            <Stack.Screen options={{ headerTitle: i18n.t("registry.stack.title") }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>{i18n.t("registry.customheader.title")}</Text>
                </BlurView>
                <View style={HomeScreenStyle.dashboard}>
                    <GradeGrid title={i18n.t("registry.grades.title")} maxValue={10.1} items={registryPageData.grades} />
                    <ActionMenu title={i18n.t("registry.class.title")} items={[
                        { title: i18n.t("registry.class.homework.title"), onPress: () => {
                            router.push("/registry/homework");
                        } },
                        { title: i18n.t("registry.class.comunications.title"), onPress: () => {
                            router.push("/registry/comunications/all");
                        } },
                        { title: i18n.t("registry.class.schedule.title"), onPress: () => {
                            router.push("/registry/schedule");
                        } },
                        { title: i18n.t("registry.class.grades.title"), onPress: () => {
                            router.push("/registry/grades");
                        } },
                        { title: i18n.t("registry.class.resources.title"), onPress: () => {
                            router.push("/registry/resources");
                        } },
                        { title: i18n.t("registry.class.lessons.title"), onPress: () => {
                            router.push("/registry/lessons");
                        } },
                    ]} />
                </View>
            </ScrollView>
        </>
    );
}