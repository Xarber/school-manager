import { Text, View, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";
import ClipboardText from "@/components/clipboardText";

import { Stack, useRouter } from "expo-router";
import { useAppDataSync, DataManager, UserData } from "@/data/datamanager";
import i18n from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import FindToday from "@/components/findToday";
import { ActivityIndicator } from "react-native-paper";
import { regroupHomework } from "../registry/homework";
import { regroupLessonsByDate } from "../registry/lessons";
import { FilterExamsDate, FilterLessonsFromExams } from "../calendar";

function HomeScreen({userData}: {userData: UserData}) {
    const theme = useTheme();
    const router = useRouter();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    
    const activeClassId = userData.settings.activeClassId;
    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${activeClassId}`, DataManager.classData.default, {
        classid: activeClassId,
        populate: ["subjects"]
    });

    let defaultLessonsData = [{subjectid: "", data: [DataManager.lessonData.default]}];
    const lessonData = useAppDataSync(DataManager.lessonData.db, `${DataManager.lessonData.app}:${activeClassId}`, defaultLessonsData, {
        classid: activeClassId
    });

    let defaultHomeworkData = [{subjectid: "", data: [DataManager.homeworkData.default]}];
    const homeworkData = useAppDataSync(DataManager.homeworkData.db, `${DataManager.homeworkData.app}:${activeClassId}`, defaultHomeworkData, {
        classid: activeClassId
    });
    
    const allClassHomework = regroupHomework(homeworkData.data);
    const allClassLessons = regroupLessonsByDate(lessonData.data);
    const lessons = FilterLessonsFromExams(false, allClassLessons);
    const exams = FilterLessonsFromExams(true, allClassLessons);

    const upcomingExams = FilterExamsDate(3, exams);
    //console.warn(upcomingExams);

    const tomorrowDay = new Date(new Date().getTime() + 86400000).toLocaleDateString("en-GB", {
        weekday: "long",
    });

    let tomorrow = {};
    if (!classData.loading && classData.data) tomorrow = classData.data.schedule[tomorrowDay];
    
    let homescreenPageData = {
        homework: allClassHomework,
        grades: userData.grades ?? [],
        subjects: classData.data.subjects,
        tomorrowSchedule: tomorrow,
        tomorrow: [] as any[],
        exams: exams,
        userdata: userData
    };

    const today = FindToday();

    return (
        <>
            <Stack.Screen options={{ headerTitle: today }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>{today}</Text>
                </BlurView>
                <View style={HomeScreenStyle.dashboard}>
                    <UserGrades items={[]} maxItems={3} expand={() => {
                        router.push("/registry");
                        setTimeout(()=>router.push("/registry/grades"), 36);
                    }}/>
                    {/* todo - Schedule, Exams, Quick Homework */}
                    <DashboardItem title={i18n.t("home.tomorrow.title")} items={homescreenPageData.tomorrow} />
                    <DashboardItem title={i18n.t("home.upcoming.title")} items={[]} maxItems={2} expand={() => {
                        router.push("/registry");
                        setTimeout(()=>router.push("/registry/exams"), 36);
                    }}/>
                </View>
            </ScrollView>
        </>
    );
}

export default function HomeScreenHandler() {
    const userData = useUserData();

    return (
        <>
            {
                userData.loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : (
                    <HomeScreen userData={userData.data} />
                )
            }
        </>
    )
}