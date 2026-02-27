import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars';
import * as CalendarModule from 'expo-calendar';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { Stack } from 'expo-router';

import useAsyncData, { defaultData, KEYS, useAllAsyncData } from '@/data/datamanager';

export default function CalendarScreen() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // e.g., '2026-02-19'

    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(tomorrowStr);

    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const activeClassId = userData.data.settings.activeClassId;
    const classData = useAsyncData(`${KEYS.classData}:${activeClassId}`, defaultData.classData);
    
    const allClassHomework = useAllAsyncData(
        `${KEYS.homeworkData}:${activeClassId}`, 
        defaultData.homeworkData
    );
    const allClassLessons = useAllAsyncData(
        `${KEYS.lessonData}:${activeClassId}`, 
        defaultData.lessonData
    );
    const exams = Object.values(allClassLessons.data).filter((lesson)=>{
        return (lesson.isExam);
    });
    
    const calendarPageData = {
        homework: allClassHomework,
        lessons: allClassLessons,
        exams: exams,
        userdata: userData
    };

    const loadMarkedDates = () => {
        // Load your events from storage/API
        setMarkedDates({
            '2026-02-16': { marked: true, dotColor: 'red' },
            '2026-02-20': { marked: true, dotColor: 'blue' },
        });
    };

    let calendarTheme = {
        backgroundColor: theme.background,
        calendarBackground: theme.background,
        selectedDayTextColor: theme.primary,
        todayTextColor: theme.text,
        dayTextColor: theme.text,
        textDisabledColor: theme.disabled,
        monthTextColor: theme.text,
    };

    return (
        <>
            <Stack.Screen options={{ headerTitle: "Calendar" }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>Calendar</Text>
                </BlurView>
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <Calendar
                        key={theme.type} // Force re-render on theme change
                        markedDates={markedDates}
                        current={selectedDate}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        hideExtraDays={true}
                        theme={calendarTheme}
                    />
                </View>
                <View style={HomeScreenStyle.dashboard}>
                    <DashboardItem title={new Date(selectedDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })} items={[
                        {
                            title: "Absent",
                            description: "Description 1",
                            onPress: () => {
                                console.log("Event 1 selected");
                            },
                        },
                    ]} />
                    <DashboardItem title="Homework" items={Object.values(calendarPageData.homework.data)}
                    />
                    <DashboardItem title="Lessons" items={Object.values(calendarPageData.lessons.data)}
                    />
                    <DashboardItem title="Exams" items={Object.values(calendarPageData.exams)}
                    />
                </View>
            </ScrollView>
        </>
    );
}
