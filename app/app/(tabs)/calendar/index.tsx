import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, ExpandableCalendar, LocaleConfig } from 'react-native-calendars';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { Stack, useFocusEffect } from 'expo-router';

import { useAppDataSync, DataManager, LessonData, SubjectData } from "@/data/datamanager";
import i18n from '@/constants/i18n';
import { useUserData } from '@/data/UserDataContext';
import { regroupLessonsByDate } from '../registry/lessons';
import { regroupHomework, stringToColor } from '../registry/homework';
import FindToday from '@/components/findToday';
import { UserData } from '@/data/datamanager';

LocaleConfig.locales['lang'] = i18n.t("components.calendar.localeconfig");
LocaleConfig.defaultLocale = 'lang';

export function LoadHomeworkForDate(date: string, homework: any) {
    const selectedDate = new Date(date).toISOString().split("T")[0];
    const filtered = homework.filter((e: any)=>e.dueDate.split(" ")[0] === selectedDate);
    return filtered;
}

export function LoadLessonsForDate(date: string, lessons: any) {
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

export function FilterLessonsFromExams(exam: boolean, allClassLessons: any) {
    return (allClassLessons as any[]).map(([date, items]: [string, LessonData[]]) => [
        date,
        items.filter((item: any) => item.data.isExam === exam)
    ]);
}

export function LoadExamsForDate(date: string, exams: any) {
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

export function FilterExamsDate(days: number, exams: any) {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + days);

    const filtered = exams
        .filter((e: any) => {
            const date = new Date(e[0]);
            return date >= today && date <= maxDate;
        })
        .flatMap((e: any) => e[1] ?? []);

    const mapped = filtered.map((e: any) => ({
        ...e.data,
        subjectid: e.subjectid
    }));

    return mapped;
}

function CalendarComponent({userData}: {userData: UserData}) {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const [refreshing, setRefreshing] = useState(false);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(tomorrowStr);

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

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([lessonData.load(), homeworkData.load()]);
        loadMarkedDates(selectedDate);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            reload();
        }, [])
    )

    const allClassHomework = regroupHomework(homeworkData.data);
    const allClassLessons = regroupLessonsByDate(lessonData.data);
    
    const lessons = FilterLessonsFromExams(false, allClassLessons);
    const exams = FilterLessonsFromExams(true, allClassLessons);
    
    const calendarPageData = {
        homework: allClassHomework,
        lessons: lessons,
        exams: exams,
        userdata: userData
    };

    const loadMarkedDates = (selectedDay?: string) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let markedDates = {} as any;

        exams.forEach(([day, items]: any) => {
            let dayDots = [] as any[];
            let mark = false;
            if (items.length > 0) {
                items.forEach((item: any) => {
                    console.warn(item);
                    if (item.data.isExam || item.data.scheduled) mark = true;
                    if (item.data.scheduled) dayDots.push({key: `scheduled:${item.data._id}`, color: theme.primary});
                    else if (item.data.isExam) dayDots.push({key: `exam:${item.data._id}`, color: theme.caution});
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
                markedDates[date] = {
                    ...(markedDates[date] || {}),
                    dots: [...((markedDates[date] || {}).dots || []), {key: `homework:${item._id}`, color: theme.disabled}]
                }
            }
        });

        // if (selectedDay != today) markedDates[today] = { dots: [...((markedDates[today] || {}).dots || []), {key: "today", color: theme.secondary}]};
        if (selectedDay) markedDates[selectedDay] = { ...(markedDates[selectedDay] || {}), selected: true, selectedColor: (selectedDay === today ? theme.secondary : theme.primary) };

        setMarkedDates(markedDates);
    };

    useEffect(()=>{
        loadMarkedDates(selectedDate);
    }, [selectedDate, (!classData.loading && !lessonData.loading && !homeworkData.loading)]);

    let calendarTheme = {
        backgroundColor: theme.background,
        calendarBackground: theme.background,
        selectedDayTextColor: theme.text,
        todayTextColor: theme.secondary,
        dayTextColor: theme.text,
        textDisabledColor: theme.disabled,
        monthTextColor: theme.text,
    };

    return (
        <>
            <Stack.Screen options={{ headerTitle: i18n.t("calendar.stack.title") }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={reload} />
            }>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>{i18n.t("calendar.customheader.title")}</Text>
                </BlurView>
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <Calendar
                        markingType="multi-dot"
                        key={theme.type}
                        hideExtraDays={true}
                        firstDay={1}
                        
                        theme={calendarTheme}

                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                    />
                </View>
                <View style={HomeScreenStyle.dashboard}>
                    <DashboardItem title={FindToday(selectedDate)} items={[]} collapsed={true} noItemsText='' />
                    {/* todo */}
                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.homework.title")} items={LoadHomeworkForDate(selectedDate, calendarPageData.homework).map((e: any)=>{
                        return {
                            title: e.title,
                            description: e.description,
                            badge: {
                                text: classData.data.subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                color: stringToColor(e.subjectid)
                            },
                            onPress: () => {}
                        };
                    })} />
                    {/* todo */}
                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.lessons.title")} items={LoadLessonsForDate(selectedDate, calendarPageData.lessons).map((e: any)=>{
                        return {
                            title: e.title,
                            description: e.description,
                            badge: {
                                text: classData.data.subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                color: stringToColor(e.subjectid)
                            },
                            onPress: () => {}
                        };
                    })} />
                    {/* todo */}
                    <DashboardItem hideIfEmpty={true} title={i18n.t("calendar.exams.title")} items={LoadExamsForDate(selectedDate, calendarPageData.exams).map((e: any)=>{
                        return {
                            title: e.title,
                            subtitle: e.scheduled ? i18n.t("calendar.exams.scheduled") : undefined,
                            description: e.description,
                            badge: {
                                text: classData.data.subjects.find((subject: SubjectData) => subject._id === e.subjectid)?.name,
                                color: stringToColor(e.subjectid)
                            },
                            onPress: () => {}
                        };
                    })} />
                </View>
            </ScrollView>
        </>
    );
}

export default function CalendarScreen() {
    const userData = useUserData();

    return (
        <>
            {
                userData.loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : (
                    <CalendarComponent userData={userData.data} />
                )
            }
        </>
    )
}