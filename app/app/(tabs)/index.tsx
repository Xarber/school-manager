import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";
import { useRouter } from "expo-router";

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const today = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>{today}</Text>
            </BlurView>
            <View style={HomeScreenStyle.dashboard}>
                <UserGrades items={[
                    { course: "Average", grade: 95 },
                    { course: "Science", grade: 42 },
                    { course: "History", grade: 37 },
                ]} expand={() => {
                    router.push("/registry/grades");
                }}/>
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
                ]} expand={() => {
                    router.push("/registry/exams");
                }}/>
            </View>
        </ScrollView>
    );
}