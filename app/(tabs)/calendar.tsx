import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars';
import * as CalendarModule from 'expo-calendar';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';

export default function CalendarScreen() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState('');

    const loadMarkedDates = () => {
        // Load your events from storage/API
        setMarkedDates({
            '2026-02-16': { marked: true, dotColor: 'red' },
            '2026-02-20': { marked: true, dotColor: 'blue' },
        });
    };

    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>Calendar</Text>
            </BlurView>
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <Calendar
                    markedDates={markedDates}
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    hideExtraDays={true}
                    theme={{
                        backgroundColor: theme.background,
                        calendarBackground: theme.background,
                        selectedDayTextColor: '#fff',
                        dayTextColor: theme.text,
                        textDisabledColor: '#d9e1e8',
                    }}
                />
            </View>
            <View style={HomeScreenStyle.dashboard}>
                <DashboardItem title="Today" items={[]} />
            </View>
        </ScrollView>
    );
}
