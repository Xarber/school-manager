import { ActivityIndicator, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';
import { ClassData, DataLoader, DataManager, SubjectData, useAppDataSync } from '@/data/datamanager';
import { devMode } from '@/data/devMode';
import { useUserData } from '@/data/UserDataContext';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Timeline from '@/components/timeline';
import ActionButtons from '@/components/actionButtons';
import { useClassData } from '@/data/ClassContext';
import { useSubjectData } from '@/data/SubjectMapContext';

const Tab = createMaterialTopTabNavigator();

export default function ScheduleTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const userData = useUserData();
    const activeClassId = userData.data.settings.activeClassId;

    const safeAreaInsets = useSafeAreaInsets();
    safeAreaInsets.bottom = safeAreaInsets.bottom ?? 20;

    const classData = useClassData();
    let subjectIds = classData.data.subjects;
    let subjects = useSubjectData().subjects;

    const reload = async () => {
        setRefreshing(true);
        // await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            //reload();
        }, [])
    )

    if (!devMode) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="flask-sharp" size={40} color={theme.text} />
            <Text style={[commonStyle.headerText, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.title")}</Text>
            <Text style={[commonStyle.text, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.message")}</Text>
        </View>
    );

    if ((classData.loading || userData.loading) && !refreshing) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    )

    function ScheduleSunday() {
        return <ScheduleDay day={0} refreshing={refreshing} reload={reload} />
    }
    function ScheduleMonday() {
        return <ScheduleDay day={1} refreshing={refreshing} reload={reload} />
    }
    function ScheduleTuesday() {
        return <ScheduleDay day={2} refreshing={refreshing} reload={reload} />
    }
    function ScheduleWednesday() {
        return <ScheduleDay day={3} refreshing={refreshing} reload={reload} />
    }
    function ScheduleThursday() {
        return <ScheduleDay day={4} refreshing={refreshing} reload={reload} />
    }
    function ScheduleFriday() {
        return <ScheduleDay day={5} refreshing={refreshing} reload={reload} />
    }
    function ScheduleSaturday() {
        return <ScheduleDay day={6} refreshing={refreshing} reload={reload} />
    }

    return (
        <>
            <View style={[optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[commonStyle.dashboardSection, optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                    <Ionicons name="school" size={40} color={theme.text} />
                    <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                    <Text style={commonStyle.text}>{i18n.t("registry.schedule.header.description")}</Text>
                </View>}
                <View style={[optimizationStyle.item]}>
                    <Tab.Navigator screenOptions={()=>({
                        tabBarActiveTintColor: theme.text,
                        tabBarIndicatorStyle: { backgroundColor: theme.primary },
                        // tabBarContentContainerStyle: { backgroundColor: theme.background },
                    })}>
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[1].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[1]} component={ScheduleMonday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[2].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[2]} component={ScheduleTuesday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[3].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[3]} component={ScheduleWednesday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[4].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[4]} component={ScheduleThursday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[5].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[5]} component={ScheduleFriday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[6].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[6]} component={ScheduleSaturday} />
                        <Tab.Screen options={{ title: i18n.t("components.calendar.localeconfig.dayNamesShort")[0].slice(0, 1)}} name={i18n.t("components.calendar.localeconfig.dayNames")[0]} component={ScheduleSunday} />
                    </Tab.Navigator>
                </View>
            </View>
        </>
    )
}

function ScheduleDay({day, refreshing, reload}: {day: number, refreshing: boolean, reload: ()=>void }) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const [mode, setMode] = useState<"read" | "write">("read");
    const [loading, setLoading] = useState(false);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const addPeriod = () => {

    };

    const addItem = ({startTime, endTime}: {startTime: string, endTime: string}) => {
        
    }

    const periods = day == 0 ? [] : [
        {
            startTime: "9:00",
            endTime: "10:00",
            items: [
                {
                    title: "History"
                }, 
                {
                    title: "Geography"
                }
            ]
        },
        {
            startTime: "11:00",
            endTime: "12:00",
            items: [
                {
                    title: "Science"
                }
            ]
        },
        {
            startTime: "12:00",
            endTime: "13:00",
            items: [
                {
                    title: "Maths"
                }
            ]
        }
    ];

    return (
        <>
            <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: safeAreaInsets.bottom + 70 }, (periods.length == 0 && { flex: 1 })]} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={reload} />
            }>
                <View style={{ padding: 20, paddingBottom: 0 }}>
                    <Text style={commonStyle.headerText}>{i18n.t("components.calendar.localeconfig.dayNames")[day]}</Text>
                </View>
                <Timeline edit={{ editing: mode === "write", addItem, addPeriod }} periods={periods} />
                {periods.length == 0 && (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 10 }}>
                        <Ionicons name="albums-outline" size={40} color={theme.text} />
                        <Text style={commonStyle.text}>{i18n.t("registry.schedule.noperiods")}</Text>
                    </View>
                )}
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("profile.data.actions.edit.title"),
                    iconName: "pencil-sharp",
                    onPress: () => {
                        setMode("write");
                    },
                    display: mode === "read",
                },
                {
                    title: i18n.t("profile.data.actions.save.title"),
                    iconName: "checkmark",
                    buffering: loading,
                    onPress: () => {
                        // ...
                        setMode("read");
                    },
                    display: mode === "write",
                },
            ]} align="right" itemStyles={{ borderRadius: 360 }} />
        </>
    )
}