import { RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { DataLoader, DataManager, LessonData, SubjectData, useAppDataSync, UserData, UserInfo } from '@/data/datamanager';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useClassData } from '@/data/ClassContext';
import { useSubjectData } from '@/data/SubjectMapContext';

export function regroupLessonsByDate(lessonArray: {subjectid: string, data: LessonData[]}[]) {
    let dateIndex = {};

    for (let i = 0; i < lessonArray.length; i++) {
        lessonArray[i].data.forEach((e) => {
            (dateIndex as any)[e.date] ??= [];
            (dateIndex as any)[e.date].push({
                subjectid: lessonArray[i].subjectid,
                data: e
            });
        })
    }

    for (let date in dateIndex) {
        // sort individual dates for time
        (dateIndex as any)[date].sort((a: any, b: any) => new Date(`${a.data.date}T${a.data.time}`).getTime() - new Date(`${b.data.date}T${b.data.time}`).getTime());
    }

    // sort dates
    dateIndex = Object.entries(dateIndex).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    return dateIndex;
}

function LessonsTab({classid, userData}: {classid: string, userData: UserData}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const sectionRefs = useRef<{ [key: number]: View | null}>({});

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const classData = useClassData();

    const subjectIds = classData.data.subjects;

    let subjects = useSubjectData().subjects;

    let defaultLessonsData = [{subjectid: "", data: [DataManager.lessonData.default]}];
    const lessonData = useAppDataSync(classid ? DataManager.lessonData.db : null, `${DataManager.lessonData.app}:${classid}`, defaultLessonsData, {
        classid: classid
    });

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([classData.load(), lessonData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            //reload();
        }, [])
    );

    if (classid === "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
        </View>
    );

    const lessons = regroupLessonsByDate(lessonData.data) as any[];
    const now = Date.now();

    const closestDate = lessons.reduce(((prev, curr) => {
        return Math.abs(new Date(curr[0]).getTime() - now) < Math.abs(new Date(prev[0]).getTime() - now) ? curr : prev;
    }));

    return (
        <>
            {(classData.loading && !refreshing) ? ( 
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" color={theme.text} />
                </View>
            ) : (
                    <>
                        <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                            {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                                <Ionicons name="school" size={40} color={theme.text} />
                                <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                                <Text style={commonStyle.text}>{i18n.t("registry.lessons.header.description")}</Text>
                            </View>}
                            <View style={optimizationStyle.item}>
                                <ScrollView ref={scrollRef} style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={[{paddingBottom: safeAreaInsets.bottom + 70}, (lessons.length === 0 ? { flex: 1} : null)]} refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                                }>
                                    {/* <Text style={commonStyle.headerText}>{i18n.t("registry.lessons.header.text", {class: classData.data.name})}</Text> */}
                                    <View style={(lessons.length === 0 ? { flex: 1} : {})}>
                                        {lessons.length === 0 ? (
                                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
                                                <Ionicons name="albums-outline" size={40} color={theme.text} />
                                                <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.nolessons.text")}</Text>
                                            </View>
                                        ) : null}
                                        {lessons.map((e, i) => (
                                            <View
                                                key={e[0]}
                                                ref={(el) => {sectionRefs.current[new Date(e[0]).getTime()] = el}}
                                                onLayout={() => {
                                                    if (e[0] === closestDate[0] && sectionRefs.current[new Date(e[0]).getTime()]) {
                                                        sectionRefs.current[new Date(e[0]).getTime()]?.measureLayout(
                                                            scrollRef.current as any,
                                                            (x, y) => {
                                                                scrollRef.current?.scrollTo({ y, animated: true });
                                                            },
                                                            () => {}
                                                        );
                                                    }
                                                }}
                                            >
                                                <DashboardItem title={new Date(e[0]).toLocaleDateString("en-GB", {
                                                    weekday: "long",
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })} items={e[1].map((e: any) => {
                                                    let teacher = classData.data.teachers.find((t: UserInfo) => t._id == e.data.teacher) ?? {};
                                                    let data = {
                                                        title: subjects.find((s: SubjectData) => s._id == e.subjectid)?.name,
                                                        subtitle: `${teacher?.surname} ${teacher?.name}`,
                                                        description: `${e.data.description}\n${new Date(`${e.data.date}T${e.data.time}`).toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"})}`,
                                                    } as any;
                                                    if (e.data.isExam == true) data.badge = {
                                                        text: i18n.t("registry.lessons.exam"),
                                                        color: theme.caution
                                                    }
                                                    if (e.data.scheduled == true) data.subtitle = `${i18n.t("calendar.exams.scheduled")}, ${data.subtitle}`;
                                                    return data;
                                                })} />
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    <ActionButtons items={[
                        {
                            title: i18n.t("registry.lessons.create.title"),
                            iconName: "add",
                            onPress: () => {
                                router.push({pathname: `/modal/lesson/create` as any, params: {classid}});
                            },
                            display: classData.data.teachers.find((e: UserInfo) => e._id === (userData as any).userInfo._id) ? true : false
                        }
                    ]} align="right" itemStyles={{ borderRadius: 360 }} />
                </>
            )}
        </>
    );
}

export default function LessonsWrapper() {
    const userData = useUserData();
    const classid = userData.data.settings.activeClassId;
    const theme = useTheme();

    if (userData.loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    );

    return <LessonsTab classid={classid} userData={userData.data} />
}