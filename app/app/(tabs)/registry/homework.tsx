import { Platform, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAppDataSync, DataManager, HomeworkData, UserData, ClassData, SubjectData, UserInfo, DataLoader } from "@/data/datamanager";
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function regroupHomework(homeworkArray: {subjectid: string, data: HomeworkData[]}[]) {
    let homeworkList = [] as any[];

    for (let i = 0; i < homeworkArray.length; i++) {
        homeworkArray[i].data.forEach((e) => {
            homeworkList.push({...e, subjectid: homeworkArray[i].subjectid});
        })
    }

    return homeworkList;
}

export function stringToColor(str: string) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash >> 0) & 255;
  const g = (hash >> 8) & 255;
  const b = (hash >> 16) & 255;

  return `rgb(${r}, ${g}, ${b})`;
}

function renderHomework(homework: HomeworkData[], classData: ClassData, refreshing: boolean, reload: () => void) {
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const dateIndex: { [date: string]: HomeworkData[] } = {};
    const allDates: {date: string, timestamp: number}[] = [];
    const scrollRef = useRef<ScrollView>(null);
    const sectionRefs = useRef<{ [key: number]: View | null}>({});
    const now = Date.now();
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    let subjectIds = classData.subjects as string[];
    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    for (let i = 0; i < homework.length; i++) {
        const dateObj = new Date(homework[i].dueDate);
        const date = dateObj.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        if (!dateIndex[date]) {
            dateIndex[date] = [];
        }
        dateIndex[date].push(homework[i]);
        if (!allDates.find(e=>e.date === date)) allDates.push({date, timestamp: dateObj.getTime()});
    }
    allDates.sort((a, b) => a.timestamp - b.timestamp);

    const closestDate = allDates.reduce(((prev, curr) => {
        return Math.abs(curr.timestamp - now) < Math.abs(prev.timestamp - now) ? curr : prev;
    }))

    return allDates.length > 0 ? (
        <ScrollView ref={scrollRef} style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: safeAreaInsets.bottom + 70}} refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
        }>
            <View>
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
                {
                    allDates.map((dateObj) => {
                        let date = dateObj.date;
                        return (
                            <View
                                key={date}
                                ref={(el) => {sectionRefs.current[dateObj.timestamp] = el}}
                                onLayout={() => {
                                    if (dateObj.timestamp === closestDate.timestamp && sectionRefs.current[dateObj.timestamp]) {
                                        sectionRefs.current[dateObj.timestamp]?.measureLayout(
                                            scrollRef.current as any,
                                            (x, y) => {
                                                scrollRef.current?.scrollTo({ y, animated: true });
                                            },
                                            () => {}
                                        );
                                    }
                                }}
                            >
                                <DashboardItem
                                    title={date}
                                    items={dateIndex[date].map(e=>{
                                        return {
                                            title: e.title,
                                            description: e.description,
                                            badge: {
                                                text: (subjects.find((s: any) => s._id == (e as any).subjectid) as any)?.name,
                                                color: stringToColor((e as any).subjectid)
                                            },
                                            onPress: () => {}
                                        };
                                    })}
                                />
                            </View>
                        );
                    })
                }
            </View>
        </ScrollView>
    ) : null;
}

function HomeworkComponent({mode, userData, classid, classData, reload, refreshing, homeworkData}: {mode: 'all' | 'completed' | 'missed', classData: ClassData, userData: UserData, classid: string, refreshing: boolean, reload: any, homeworkData: any}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const datePoolLength = 5;
    const datePool = [];
    for (let i = 0; i < datePoolLength; i++) {
        let date = new Date();
        date.setDate(new Date().getDate() + i);
        datePool.push(date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }));
    }

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;
    
    const allClassHomework = regroupHomework(homeworkData || []);
    
    const homeworkPageData = {
        homework: allClassHomework,
        userdata: userData as UserData
    }

    const homework = Object.values(homeworkPageData.homework) as HomeworkData[];
    const filteredItems = homework.filter((item) => {
        if (mode === "all") return true;
        // Filter user's completedhomework {classid, subjectid, homeworkid}, and check if the homework item has those same properties
        if (mode === "completed") {
            const completedhomework = userData.completedhomework.filter((homeworkid: any) => {
                return homeworkid === item._id;
            });
            if (completedhomework.length > 0) return true;
        }
        if (new Date(item.dueDate).getTime() < new Date().getTime()) {
            if (mode === "missed") return true;
        }
        return false;
    })

    return (filteredItems.length == 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
                <Ionicons name="albums-outline" size={40} color={theme.text} />
                <Text style={commonStyle.text}>{i18n.t("registry.homework.warn.nohomework.text")}</Text>
            </View>
        ) : (
            <>
                {renderHomework(filteredItems, classData, refreshing, reload)}
            </>
        )
    );
}

const Tab = createMaterialTopTabNavigator();

function HomeworkTab({userData}: {userData: UserData}) {
    const router = useRouter();
    const theme = useTheme();
    const classid = userData.settings.activeClassId;
    const [refreshing, setRefreshing] = useState(false);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);

    const classData = useAppDataSync(classid != "" ? DataManager.classData.db : null, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid
    });

    let defaultHomeworkData = [{subjectid: "", data: [DataManager.homeworkData.default]}];
    const homeworkData = useAppDataSync(classid != "" ? DataManager.homeworkData.db : null, `${DataManager.homeworkData.app}:${classid}`, defaultHomeworkData, {
        classid: classid
    });

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([classData.load(), homeworkData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            reload();
        }, [])
    )

    function AllHomework() {
        return <HomeworkComponent mode="all" userData={userData} classData={classData.data} refreshing={refreshing} reload={reload} homeworkData={homeworkData.data} classid={classid} />
    }

    function CompletedHomework() {
        return <HomeworkComponent mode="completed" userData={userData} classData={classData.data} refreshing={refreshing} reload={reload} homeworkData={homeworkData.data} classid={classid} />
    }

    function MissedHomework() {
        return <HomeworkComponent mode="missed" userData={userData} classData={classData.data} refreshing={refreshing} reload={reload} homeworkData={homeworkData.data} classid={classid} />
    }

    if (classid == "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.noclass.text")}</Text>
        </View>
    )

    if ((classData.loading || homeworkData.loading) && !refreshing) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    );

    return (
        <>
            <View style={[optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                    <Ionicons name="school" size={40} color={theme.text} />
                    <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                    <Text style={commonStyle.text}>{i18n.t("registry.homework.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <Tab.Navigator screenOptions={()=>({
                        tabBarActiveTintColor: theme.text,
                        tabBarIndicatorStyle: { backgroundColor: theme.primary },
                        // tabBarContentContainerStyle: { backgroundColor: theme.background },
                    })}>
                        <Tab.Screen name={i18n.t("registry.homework.tab.all.title")} component={AllHomework} />
                        <Tab.Screen name={i18n.t("registry.homework.tab.completed.title")} component={CompletedHomework} />
                        <Tab.Screen name={i18n.t("registry.homework.tab.missed.title")} component={MissedHomework} />
                    </Tab.Navigator>
                </View>
            </View>
            <ActionButtons items={[
                {
                    title: i18n.t("registry.homework.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/homework/create` as any, params: {classid: userData.settings.activeClassId}});
                    },
                    display: classData.data.teachers.find((teacher: UserInfo) => teacher._id === (userData as any).userInfo._id) ? true : false
                }
            ]} align="right" itemStyles={{ borderRadius: 360 }} />
        </>

    )
}

export default function HomeworkWrap() {
    const userData = useUserData();
    const theme = useTheme();

    return (userData.loading ? 
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View> : 
        <HomeworkTab userData={userData.data} />
    )
}