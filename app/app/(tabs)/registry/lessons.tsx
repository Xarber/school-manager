import { RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { DataLoader, DataManager, LessonData, SubjectData, useAppDataSync, UserData, UserInfo } from '@/data/datamanager';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const classData = useAppDataSync(classid ? DataManager.classData.db : null, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid
    });

    const subjectIds = classData.data.subjects;

    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

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
            reload();
        }, [])
    );

    if (classid === "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
        </View>
    );

    const lessons = regroupLessonsByDate(lessonData.data) as any[];

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
                                <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: safeAreaInsets.bottom + 70}} refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                                }>
                                    <Text style={commonStyle.headerText}>{i18n.t("registry.lessons.header.text", {class: classData.data.name})}</Text>
                                    <View>
                                        {lessons.length === 0 ? (
                                            <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.nolessons.text")}</Text>
                                        ) : null}
                                        {lessons.map((e, i) => (
                                            <DashboardItem key={e[0]} title={e[0]} items={e[1].map((e: any) => {
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