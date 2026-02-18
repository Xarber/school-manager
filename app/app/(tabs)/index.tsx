import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";
import { useHomescreenPageData } from "@/data/dataload";
import { useRouter } from "expo-router";
import { KEYS } from "@/data/datamanager";

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const homescreenPageData = useHomescreenPageData();
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
                <UserGrades items={homescreenPageData.grades} maxItems={3} expand={() => {
                    router.push("/registry");
                    setTimeout(()=>router.push("/registry/grades"), 36);
                }}/>
                <DashboardItem title="Tomorrow" items={
                    (homescreenPageData.tomorrowSchedule ?? []).map((lesson) => {
                        const subjectKey = `${KEYS.subjectData}:${homescreenPageData.userdata.data.settings.activeClassId}:${lesson.subjectid}`;
                        const subject = homescreenPageData.subjects.data[subjectKey];
                        return {
                            title: subject.name,
                            description: `Teacher: ${lesson.teacher}\nTime: ${lesson.duration}`,
                        }
                    })
                }/>
                <DashboardItem title="Upcoming Exams" items={homescreenPageData.exams} maxItems={2} expand={() => {
                    router.push("/registry");
                    setTimeout(()=>router.push("/registry/exams"), 36);
                }}/>
            </View>
        </ScrollView>
    );
}