import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import ActionMenu from "@/components/actionMenu";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import GradeGrid from "@/components/gradeGrid";

export default function RegistryTab() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const RegistryStyle = createStyling.createRegistryStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    
    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>Registry</Text>
            </BlurView>
            <View style={HomeScreenStyle.dashboard}>
                <GradeGrid title="Your Grades" maxValue={10.1} items={[
                    { title: "Mathematics", grade: 5 },
                    { title: "Science", grade: 10 },
                    { title: "History", grade: 7 },
                ]} />
                <ActionMenu title="Your Class" items={[
                    { title: "Homework", onPress: () => console.log("Homework pressed") },
                    { title: "Comunications", onPress: () => console.log("Comunications pressed") },
                    { title: "Schedule", onPress: () => console.log("Schedule pressed") },
                    { title: "Grades", onPress: () => console.log("Grades pressed") },
                    { title: "Resources", onPress: () => console.log("Resources pressed") },
                    { title: "Attendance", onPress: () => console.log("Attendance pressed") },
                ]} />
            </View>
        </ScrollView>
    );
}