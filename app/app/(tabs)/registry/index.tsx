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
            <Stack.Screen options={{ headerTitle: "Registry" }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>Registry</Text>
                </BlurView>
                <View style={HomeScreenStyle.dashboard}>
                    <GradeGrid title="Your Grades" maxValue={10.1} items={registryPageData.grades} />
                    <ActionMenu title="Your Class" items={[
                        { title: "Homework", onPress: () => {
                            router.push("/registry/homework");
                        } },
                        { title: "Comunications", onPress: () => {
                            router.push("/registry/comunications");
                        } },
                        { title: "Schedule", onPress: () => {
                            router.push("/registry/schedule");
                        } },
                        { title: "Grades", onPress: () => {
                            router.push("/registry/grades");
                        } },
                        { title: "Resources", onPress: () => {
                            router.push("/registry/resources");
                        } },
                        { title: "Attendance", onPress: () => {
                            router.push("/registry/attendance");
                        } },
                    ]} />
                </View>
            </ScrollView>
        </>
    );
}