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

    let tomorrow = {};
    if (!classData.loading && classData.data) tomorrow = classData.data.schedule[tomorrowDay];
    
    let homescreenPageData = {
        homework: allClassHomework,
        grades: userData.data.grades ?? [],
        subjects: allClassSubjects,
        tomorrowSchedule: tomorrow,
        tomorrow: [] as any[],
        exams: exams,
        userdata: userData
    };

    /*
    homescreenPageData = {
        homework: [{
            title: "Homework",
            description: "Homework for today",
            items: homescreenPageData.homework
        }, {
            title: "Lessons",
            description: "Lessons for today",
            items: homescreenPageData.tomorrowSchedule
        }, {
            title: "Exams",
            description: "Exams for today",
            items: homescreenPageData.exams
        }],
        grades: [{
            title: "Math",
            grade: "93"
        },{
            title: "Science",
            grade: "85"
        },{
            title: "History",
            grade: "72"
        }],
        subjects: [{
            title: "Subjects",
            description: "Subjects for today",
            items: homescreenPageData.subjects
        }],
        exams: [{
            title: "Grammar",
            description: "First chapter",
            badge: {
                text: "Oral",
                color: "#FF0000"
            }
        }, {
            title: "English",
            description: "Second chapter",
            badge: {
                text: "Written",
                color: "#FF8400"
            }
        }, {
            title: "Math",
            description: "Third chapter",
            badge: {
                text: "Written",
                color: "#ff8400"
            }
        }],
        tomorrowSchedule: {},
        tomorrow: [{
            title: "Math",
            description: "Homework: Page 3, ex. 1-2-3",
        }, {
            title: "Science",
            description: "No homework. Hooray!",
        }, {
            title: "History",
            description: "Lesson about the Romans",
        }],
        userdata: userData
    }
    */
    
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
                    {/* todo - Schedule, Exams, Quick Homework */}
                    <DashboardItem title="Tomorrow" items={homescreenPageData.tomorrow} />
                    <DashboardItem title="Upcoming Exams" items={homescreenPageData.exams} maxItems={2} expand={() => {
                        router.push("/registry");
                        setTimeout(()=>router.push("/registry/exams"), 36);
                    }}/>
                </View>
            </ScrollView>
        </>
    );
}