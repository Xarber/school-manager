import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { Stack } from 'expo-router';

import { useAppDataSync, DataManager } from "@/data/datamanager";

export default function CalendarScreen() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // e.g., '2026-02-19'

    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(tomorrowStr);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    const activeClassId = userData.data.settings.activeClassId;
    const classData = useAppDataSync(null, `${DataManager.classData.app}:${activeClassId}`, DataManager.classData.default);
    
    const allClassHomework = [] as any[]; // todo
    const allClassLessons = [] as any[]; // todo
    const exams = [] as any[]; // todo
    
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
                    <DashboardItem title="Homework" items={[]} /> {/* //todo */}
                    <DashboardItem title="Lessons" items={[]} /> {/* //todo */}
                    <DashboardItem title="Exams" items={[]} /> {/* //todo */}
                </View>
            </ScrollView>
        </>
    );
}
