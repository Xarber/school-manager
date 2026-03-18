import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, LessonData, SubjectData, useAppDataSync, UserData, UserInfo } from '@/data/datamanager';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid,
        populate: ["subjects"]
    });

    let defaultLessonsData = [{subjectid: "", data: [DataManager.lessonData.default]}];
    const lessonData = useAppDataSync(DataManager.lessonData.db, `${DataManager.lessonData.app}:${classid}`, defaultLessonsData, {
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

    const lessons = regroupLessonsByDate(lessonData.data) as any[];

    return (classData.loading && !refreshing) ? ( 
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    ) : (classid == "") ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
            </View>
        ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
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
                                title: classData.data.subjects.find((s: SubjectData) => s._id == e.subjectid)?.name,
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
        </View>
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