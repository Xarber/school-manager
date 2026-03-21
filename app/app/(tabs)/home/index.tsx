import { Text, View, ScrollView, RefreshControl } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import UserGrades from "@/components/gradesComponent";
import ClipboardText from "@/components/clipboardText";

import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useAppDataSync, DataManager, UserData, SubjectData, DataLoader } from "@/data/datamanager";
import i18n from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import findToday from "@/components/findToday";
import { ActivityIndicator } from "react-native";
import { regroupHomework, stringToColor } from "../registry/homework";
import { regroupLessonsByDate } from "../registry/lessons";
import { filterExamsDate, filterLessonsFromExams } from "../calendar";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/constants/LanguageContext";
import { Ionicons } from "@expo/vector-icons";

function HomeScreen({userData}: {userData: UserData}) {
    const theme = useTheme();
    const router = useRouter();
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const [refreshing, setRefreshing] = useState(false);
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;
    
    const activeClassId = userData.settings.activeClassId;

    const classData = useAppDataSync(activeClassId != "" ? DataManager.classData.db : null, `${DataManager.classData.app}:${activeClassId}`, DataManager.classData.default, {
        classid: activeClassId
    });

    let subjectIds = classData.data.subjects;
    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    let defaultLessonsData = [{subjectid: "", data: [DataManager.lessonData.default]}];
    const lessonData = useAppDataSync(activeClassId != "" ? DataManager.lessonData.db : null, `${DataManager.lessonData.app}:${activeClassId}`, defaultLessonsData, {
        classid: activeClassId
    });

    let defaultHomeworkData = [{subjectid: "", data: [DataManager.homeworkData.default]}];
    const homeworkData = useAppDataSync(activeClassId != "" ? DataManager.homeworkData.db : null, `${DataManager.homeworkData.app}:${activeClassId}`, defaultHomeworkData, {
        classid: activeClassId
    });

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([lessonData.load(), homeworkData.load()]);
        setRefreshing(false);
    };
    
    useFocusEffect(
        useCallback(()=>{
            reload();
        }, [])
    )

    if (activeClassId == "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
        </View>
    );
    
    const allClassHomework = regroupHomework(homeworkData.data);
    const allClassLessons = regroupLessonsByDate(lessonData.data);
    const lessons = filterLessonsFromExams(false, allClassLessons);
    const exams = filterLessonsFromExams(true, allClassLessons);

    const upcomingExams = filterExamsDate(3, exams).filter((e: any)=>{
        return (e.date != new Date().toISOString().split("T")[0]) && (e.date != new Date(new Date().getTime() + 86400000).toISOString().split("T")[0])
    });
    const tomorrowExams = filterExamsDate(1, exams).filter((e: any)=>e.date != new Date().toISOString().split("T")[0]);
    const tomorrowLessons = filterExamsDate(1, lessons).filter((e: any)=>e.date != new Date().toISOString().split("T")[0]);
    const tomorrowHomework = allClassHomework.filter((e: any)=>e.dueDate.split(" ")[0] === new Date(new Date().getTime() + 86400000).toISOString().split("T")[0]);;

    const tomorrowDay = new Date(new Date().getTime() + 86400000).toLocaleDateString("en-GB", {
        weekday: "long",
    });

    let tomorrow = {};
    if (!classData.loading && classData.data) tomorrow = classData.data.schedule[tomorrowDay];
    
    let tomorrowSection: any[] = [];
    if (tomorrowExams.length > 0) tomorrowSection = [...tomorrowSection, ...tomorrowExams];
    if (tomorrowLessons.length > 0) tomorrowSection = [...tomorrowSection, ...tomorrowLessons];
    if (tomorrowHomework.length > 0) tomorrowSection = [...tomorrowSection, ...tomorrowHomework];

    let homescreenPageData = {
        homework: allClassHomework,
        grades: userData.grades ?? [],
        subjects: subjects,
        tomorrowSchedule: tomorrow,
        tomorrow: tomorrowSection,
        exams: exams,
        userdata: userData
    };

    const today = findToday(useLanguage());

    return (
        <>
            {subjectIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.subjectData}
                        body={{ subjectid: id }}
                        onLoad={(id, subjectdata) =>
                            setSubjectMap(prev => {
                                if (prev[id]?._id === subjectdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: subjectdata.data
                                };
                            })
                        }
                    />
                )
            })}
            <Stack.Screen options={{ headerTitle: today }} />
            {
                ((classData.loading || lessonData.loading || homeworkData.loading) && !refreshing) ? (
                    <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                        <ActivityIndicator size="small" color={theme.text} />
                    </View>
                ) : (
                    <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={{paddingBottom: safeAreaInsets.bottom}} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                    }>
                        <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                            <Text style={HomeScreenStyle.welcomeText}>{today}</Text>
                        </BlurView>
                        <View style={[HomeScreenStyle.dashboard, optimizationStyle.container]}>
                            {/* todo - Schedule, Exams, Quick Homework */}
                            <View style={optimizationStyle.item}>
                                <DashboardItem title={i18n.t("home.tomorrow.title")} items={homescreenPageData.tomorrow.map((e: any, i: number)=>{
                                    let subject = subjects.find((s: any)=>s._id === e.subjectid)?.name;
                                    let data = {
                                        title: e.title,
                                        description: e.description,
                                        subtitle: 
                                            e.isExam ? i18n.t("home.tomorrow.exam") : 
                                            (!!e.dueDate ? i18n.t("home.tomorrow.homework") : i18n.t("home.tomorrow.lesson")),
                                        onPress: () => {
                                            //router.push(`/calendar/${e.date}`);
                                        }
                                    } as any;
                                    if (subject) data.badge = {
                                        text: subject,
                                        color: stringToColor(e.subjectid)
                                    };
                                    return data;
                                })} />
                            </View>
                            <View style={optimizationStyle.item}>
                                <UserGrades items={[]} maxItems={3} expand={() => {
                                    router.push("/registry");
                                    setTimeout(()=>router.push("/registry/grades"), 36);
                                }}/>
                                <DashboardItem title={i18n.t("home.upcoming.title")} items={upcomingExams.map((e: any, i: number)=>{
                                    let subject = subjects.find((s: any)=>s._id === e.subjectid)?.name;
                                    let data = {
                                        title: e.title,
                                        description: e.description,
                                        subtitle: e.date,
                                        onPress: () => {
                                            //router.push(`/calendar/${e.date}`);
                                        }
                                    } as any;
                                    if (subject) data.badge = {
                                        text: subject,
                                        color: stringToColor(e.subjectid)
                                    }
                                    return data;
                                })} maxItems={3} expand={() => {
                                    router.push("/registry");
                                    setTimeout(()=>router.push("/registry/lessons"), 36);
                                }}/>
                            </View>
                        </View>
                    </ScrollView>
                )
            }
        </>
    );
}

export default function HomeScreenHandler() {
    const userData = useUserData();
    const theme = useTheme();

    return (
        <>
            {
                userData.loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" color={theme.text} />
                    </View>
                ) : (
                    <HomeScreen userData={userData.data} />
                )
            }
        </>
    )
}