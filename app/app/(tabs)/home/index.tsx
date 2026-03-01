import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";

import { Stack, useRouter } from "expo-router";
import { useAppDataSync, DataManager } from "@/data/datamanager";

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    
    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    const activeClassId = userData.data.settings.activeClassId;
    const classData = useAppDataSync(null, `${DataManager.classData.app}:${activeClassId}`, DataManager.classData.default);
    
    const allClassHomework = [] as any[]; // todo
    const allClassLessons = [] as any[]; // todo
    const allClassSubjects = [] as any[]; // todo
    const exams = [] as any[]; // todo; remember to check if the exam is passed or not

    const tomorrowDay = new Date(new Date().getTime() + 86400000).toLocaleDateString("en-GB", {
        weekday: "long",
    });

    const tomorrow = classData.data.schedule[tomorrowDay];
    
    const homescreenPageData = {
        homework: allClassHomework,
        grades: userData.data.grades,
        subjects: allClassSubjects,
        tomorrowSchedule: tomorrow,
        exams: exams,
        userdata: userData
    };
    
    const today = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <>
            <Stack.Screen options={{ headerTitle: today }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>{today}</Text>
                </BlurView>
                <View style={HomeScreenStyle.dashboard}>
                    <UserGrades items={homescreenPageData.grades} maxItems={3} expand={() => {
                        router.push("/registry");
                        setTimeout(()=>router.push("/registry/grades"), 36);
                    }}/>
                    <DashboardItem title="Tomorrow" items={[]} /> {/* //todo - Schedule, Exams, Quick Homework */}
                    <DashboardItem title="Upcoming Exams" items={homescreenPageData.exams} maxItems={2} expand={() => {
                        router.push("/registry");
                        setTimeout(()=>router.push("/registry/exams"), 36);
                    }}/>
                </View>
            </ScrollView>
        </>
    );
}