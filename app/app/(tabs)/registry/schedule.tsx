import { ActivityIndicator, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';
import { ClassData, DataLoader, DataManager, devMode, SubjectData, useAppDataSync } from '@/data/datamanager';
import { useUserData } from '@/data/UserDataContext';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function ScheduleTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const userData = useUserData();
    const activeClassId = userData.data.settings.activeClassId;

    const safeAreaInsets = useSafeAreaInsets();
    safeAreaInsets.bottom = safeAreaInsets.bottom ?? 20;

    const classData = useAppDataSync(activeClassId != "" ? DataManager.classData.db : null, `${DataManager.classData.db}:${activeClassId}`, DataManager.classData.default, {
        classid: activeClassId
    });
    let subjectIds = classData.data.subjects;
    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    const reload = async () => {
        setRefreshing(true);
        // await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            reload();
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
        return <ScheduleDay day={0} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleMonday() {
        return <ScheduleDay day={1} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleTuesday() {
        return <ScheduleDay day={2} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleWednesday() {
        return <ScheduleDay day={3} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleThursday() {
        return <ScheduleDay day={4} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleFriday() {
        return <ScheduleDay day={5} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }
    function ScheduleSaturday() {
        return <ScheduleDay day={6} classData={classData.data} refreshing={refreshing} reload={reload} subjectData={subjectMap} />
    }

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
            <View style={[optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[commonStyle.dashboardSection, optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                    <Ionicons name="school" size={40} color={theme.text} />
                    <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                    <Text style={commonStyle.text}>{i18n.t("registry.schedule.header.description")}</Text>
                </View>}
                <View style={[optimizationStyle.item]}>
                    {/* <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload} />
                    }>
                        <Text style={commonStyle.headerText}>{i18n.t("registry.schedule.title")}</Text>
                    </ScrollView> */}
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

function ScheduleDay({day, classData, refreshing, reload, subjectData}: {day: number, classData: ClassData, refreshing: boolean, reload: Function, subjectData: {[key: string]: SubjectData}}) {
    return <></>;
}