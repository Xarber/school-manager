import DashboardItem from '@/components/dashboardItem';
import createStyling from '@/constants/styling';
import { useTheme } from '@/constants/useThemes';
import { BlurView } from 'expo-blur';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import findToday from '@/components/findToday';
import i18n from '@/constants/i18n';
import { useLanguage } from '@/constants/LanguageContext';
import { useClassData } from '@/data/ClassContext';
import { HomeworkData, LessonData, SubjectData, UserData } from "@/data/datamanager";
import { useHomeworkData } from '@/data/HomeworkMapContext';
import { useLessonData } from '@/data/LessonMapContext';
import { useSubjectData } from '@/data/SubjectMapContext';
import { useUserData } from '@/data/UserDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { regroupHomework, stringToColor } from '../registry/homework';
import { regroupLessonsByDate } from '../registry/lessons/[id]';

export function loadHomeworkForDate(date: string, homework: any) {
    const selectedDate = new Date(date).toISOString().split("T")[0];
    const filtered = homework.filter((e: any)=>e.dueDate.split(" ")[0] === selectedDate);
    return filtered;
}

export function loadLessonsForDate(date: string, lessons: any) {
    const selectedDate = new Date(date).toISOString().split("T")[0];
    const filtered = lessons.find((e: any)=>e[0] === selectedDate)?.[1] ?? [];
    const mapped = filtered?.map((e: any)=>{
        return {
            ...e.data,
            subjectid: e.subjectid
        }
    });
    return mapped;
}

export function filterLessonsFromExams(exam: boolean, allClassLessons: any) {
    return (allClassLessons as any[]).map(([date, items]: [string, LessonData[]]) => [
        date,
        items.filter((item: any) => item.data.isExam === exam)
    ]);
}

export function loadExamsForDate(date: string, exams: any) {
    const selectedDate = new Date(date).toISOString().split("T")[0];
    const filtered = exams.find((e: any)=>e[0] === selectedDate)?.[1] ?? [];
    const mapped = filtered?.map((e: any)=>{
        return {
            ...e.data,
            subjectid: e.subjectid
        }
    });
    return mapped;
}

export function filterExamsDate(days: number, exams: any) {
    const now = Date.now();
    const maxDiff = days * 24 * 60 * 60 * 1000;

    const filtered = exams
        .filter((e: any) => {
            if (e[1].length === 0) return false;
            const examTime = new Date(e[0]).getTime();
            const diff = examTime - now;
            return diff >= 0 && diff <= maxDiff;
        })
        .flatMap((e: any) => e[1] ?? []);

    const mapped = filtered.map((e: any) => ({
        ...e.data,
        subjectid: e.subjectid
    }));

    return mapped;
}

function CalendarComponent({userData}: {userData: UserData}) {
    LocaleConfig.locales['lang'] = i18n.t("components.calendar.localeconfig");
    LocaleConfig.defaultLocale = 'lang';
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const [refreshing, setRefreshing] = useState(false);
    const language = useLanguage();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(tomorrowStr);

    const activeClassId = userData.settings.activeClassId;

    const classData = useClassData();
    let subjects = useSubjectData().subjects;
    const lessonsData = useLessonData().lessons;

    const lessonData = [] as {subjectid: string, data: LessonData[]}[];
    lessonsData.forEach((e: LessonData)=>{
        let subject = subjects.find((s: SubjectData)=>(s.lessons as string[]).includes(e._id))?._id;

        if (lessonData.find((lsn: any) => lsn.subjectid === subject)) {
            lessonData.find((lsn: any) => lsn.subjectid === subject)?.data.push(e);
        } else {
            lessonData.push({subjectid: subject, data: [e]});
            return;
        }
    });

    const homeworksData = useHomeworkData().homework;
    const homeworkData = [] as {subjectid: string, data: HomeworkData[]}[];
    homeworksData.forEach((e: HomeworkData)=>{
        let subject = subjects.find((s: SubjectData)=>(s.homework as string[]).includes(e._id))?._id;

        if (homeworkData.find((hmw: any) => hmw.subjectid === subject)) {
            homeworkData.find((hmw: any) => hmw.subjectid === subject)?.data.push(e);
        } else {
            homeworkData.push({subjectid: subject, data: [e]});
            return;
        }
    });

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([]);
        loadMarkedDates(selectedDate);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            //reload();
        }, [])
    )

    const allClassHomework = regroupHomework(homeworkData);
    const allClassLessons = regroupLessonsByDate(lessonData);
    
    const lessons = filterLessonsFromExams(false, allClassLessons);
    const exams = filterLessonsFromExams(true, allClassLessons);
    
    const calendarPageData = {
        homework: allClassHomework,
        lessons: lessons,
        exams: exams,
        userdata: userData
    };

    const loadMarkedDates = (selectedDay?: string) => {
        // theme.disabled = Homework
        // theme.caution = Exams
        // theme.primary = Scheduled
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let markedDates = {} as any;

        exams.forEach(([day, items]: any) => {
            let dayDots = [] as any[];
            let mark = false;
            let dayHasExam = false;
            let dayHasScheduled = false;
            if (items.length > 0) {
                items.forEach((item: any) => {
                    if (item.data.isExam || item.data.scheduled) {mark = true;}
                    if (item.data.scheduled) {
                        if (dayHasScheduled) return;
                        dayHasScheduled = true;
                        dayDots.push({key: `scheduled:${item.data._id}`, color: theme.primary});
                    }
                    else if (item.data.isExam) {
                        if (dayHasExam) return;
                        dayHasExam = true;
                        dayDots.push({key: `exam:${item.data._id}`, color: theme.caution});
                    }
                });
            }

            if (mark) {
                markedDates[day] = {
                    dots: dayDots
                }
            }
        });

        allClassHomework.forEach((item)=>{
            if (item.dueDate) {
                const date = item.dueDate.split(" ")[0];
                if (!markedDates[date]?.hasHomework) markedDates[date] = {
                    ...(markedDates[date] || {}),
                    dots: [...((markedDates[date] || {}).dots || []), {key: `homework:${item._id}`, color: theme.disabled}],
                    hasHomework: true
                }
            }
        });

        // if (selectedDay != today) markedDates[today] = { dots: [...((markedDates[today] || {}).dots || []), {key: "today", color: theme.secondary}]};
        if (selectedDay) markedDates[selectedDay] = { ...(markedDates[selectedDay] || {}), selected: true, selectedColor: (selectedDay === today ? theme.secondary : theme.primary) };

        setMarkedDates(markedDates);
    };

    useEffect(()=>{
        loadMarkedDates(selectedDate);
    }, [selectedDate, (!classData.loading)]);

    let calendarTheme = {
        backgroundColor: "transparent",
        calendarBackground: "transparent",
        selectedDayTextColor: theme.text,
        todayTextColor: theme.secondary,
        dayTextColor: theme.text,
        textDisabledColor: theme.disabled,
        monthTextColor: theme.text,
    };

    if (activeClassId == "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
        </View>
    );;

    return (
        <>
            <Stack.Screen options={{ headerTitle: i18n.t("calendar.stack.title") }} />
            {
                ((classData.loading) && !refreshing) ? (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator size="small" color={theme.text} />
                    </View>
                ) : (
                    <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom}} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                    }>
                        <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                            <Text style={HomeScreenStyle.welcomeText}>{i18n.t("calendar.customheader.title")}</Text>
                        </BlurView>
                        <View style={optimizationStyle.container}>
                            <View style={optimizationStyle.item}>
                                <View style={{ flex: 1, paddingTop: 15 }}>
                                    <Calendar
                                        markingType="multi-dot"
                                        key={`${theme.type}-${language.locale}`}
                                        hideExtraDays={true}
                                        firstDay={1}
                                        
                                        theme={calendarTheme}

                                        onDayPress={(day) => setSelectedDate(day.dateString)}
                                        markedDates={markedDates}
                                    />
                                </View>
                            </View>
                            <View style={optimizationStyle.item}>
                                <View style={[HomeScreenStyle.dashboard, {flex: 1}]}>
                                    <DashboardItem title={findToday(language, selectedDate)} items={[]} collapsed={true} noItemsText='' />
                                    {(
                                        loadHomeworkForDate(selectedDate, calendarPageData.homework).length == 0 &&
                                        loadLessonsForDate(selectedDate, calendarPageData.lessons).length == 0 &&
                                        loadExamsForDate(selectedDate, calendarPageData.exams) == 0
                                    ) && (
                                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
                                            <Ionicons name="albums-outline" size={40} color={theme.text} />
                                            <Text style={commonStyle.text}>{i18n.t("calendar.dayview.free")}</Text>
                                        </View>
                                    )}
                                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.homework.title")} items={loadHomeworkForDate(selectedDate, calendarPageData.homework).map((e: any)=>{
                                        return {
                                            title: e.title,
                                            description: e.description,
                                            badge: {
                                                text: subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                                color: stringToColor(e.subjectid)
                                            },
                                            onPress: () => {}
                                        };
                                    })} />
                                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.lessons.title")} items={loadLessonsForDate(selectedDate, calendarPageData.lessons).map((e: any)=>{
                                        return {
                                            title: e.title,
                                            description: e.description,
                                            badge: {
                                                text: subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                                color: stringToColor(e.subjectid)
                                            },
                                            onPress: () => {}
                                        };
                                    })} />
                                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.exams.title")} items={loadExamsForDate(selectedDate, calendarPageData.exams).map((e: any)=>{
                                        return {
                                            title: e.title,
                                            subtitle: e.scheduled ? i18n.t("calendar.exams.scheduled") : undefined,
                                            description: e.description,
                                            badge: {
                                                text: subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                                color: stringToColor(e.subjectid)
                                            },
                                            onPress: () => {}
                                        };
                                    })} />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )
            }
        </>
    );
}

export default function CalendarScreen() {
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
                    <CalendarComponent userData={userData.data} />
                )
            }
        </>
    )
}