import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";

export default function HomeScreen() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>Welcome back, user!</Text>
            </BlurView>
            <View style={HomeScreenStyle.dashboard}>
                <UserGrades items={[
                    { course: "Average", grade: 95 },
                    { course: "Science", grade: 42 },
                    { course: "History", grade: 37 },
                ]} expand={() => {console.log("Grades expanded")}}/>
                <DashboardItem title="Tomorrow" items={[
                    {
                        title: "Storia",
                        description: "Prof. Verdi\nPrima ora",
                    },
                    {
                        title: "Italiano",
                        description: "Prof. Rossi\nSeconda ora",
                        badge: { text: "compito", color: "rgba(255, 0, 0, 0.8)" },
                    },
                    {
                        title: "Storia",
                        description: "Prof. Verdi\nPrima ora",
                    },
                ]}/>
                <DashboardItem title="Upcoming Exams" items={[
                    { title: "Italiano", description: "12 Gennaio\nProf Rossi", badge: { text: "orale", color: "rgba(235, 220, 54, 0.8)" }, icon: require("@/assets/images/icon.png") },
                    { title: "Matematica", description: "5 Dicembre\nProf Bianchi", badge: { text: "scritto", color: "rgba(0, 174, 255, 0.8)" }, icon: require("@/assets/images/icon.png") },
                ]} expand={() => {console.log("Exams expanded")}}/>
            </View>
        </ScrollView>
    );
}