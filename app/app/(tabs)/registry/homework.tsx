import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAppDataSync, DataManager, HomeworkData, UserData, ClassData, SubjectData } from "@/data/datamanager";
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import { useUserData } from '@/data/UserDataContext';

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

function renderHomework(homework: HomeworkData[], classData: ClassData) {
    const dateIndex: { [date: string]: HomeworkData[] } = {};
    const allDates: string[] = [];

    for (let i = 0; i < homework.length; i++) {
        const date = new Date(homework[i].dueDate).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        if (!dateIndex[date]) {
            dateIndex[date] = [];
        }
        dateIndex[date].push(homework[i]);
        if (!allDates.includes(date)) allDates.push(date);
    }
    allDates.sort();

    return allDates.length > 0 ? (
        <View>
            {
                allDates.map((date) => {
                    return (
                        <DashboardItem
                            key={date}
                            title={date}
                            items={dateIndex[date].map(e=>{
                                return {
                                    title: e.title,
                                    description: e.description,
                                    badge: {
                                        text: (classData.subjects.find((s: any) => s._id == (e as any).subjectid) as any)?.name,
                                        color: stringToColor((e as any).subjectid)
                                    },
                                    onPress: () => {}
                                };
                            })}
                        />
                    );
                })
            }
        </View>
    ) : null;
}

function HomeworkComponent({mode, userData, classid}: {mode: 'all' | 'completed' | 'missed', userData: UserData, classid: string}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const [refreshing, setRefreshing] = useState(false);
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

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid,
        populate: ["subjects"]
    });

    let defaultHomeworkData = [{subjectid: "", data: [DataManager.homeworkData.default]}];
    const homeworkData = useAppDataSync(DataManager.homeworkData.db, `${DataManager.homeworkData.app}:${classid}`, defaultHomeworkData, {
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
    
    const allClassHomework = regroupHomework(homeworkData.data || []);
    
    const homeworkPageData = {
        homework: allClassHomework,
        userdata: userData as UserData
    }

    const homework = Object.values(homeworkPageData.homework) as HomeworkData[];
    const filteredItems = homework.filter((item) => {
        if (mode === "all") return true;
        // Filter user's completedhomework {classid, subjectid, homeworkid}, and check if the homework item has those same properties
        if (mode === "completed") {
            const completedhomework = userData.completedhomework.filter((homeworkid: String) => {
                return homeworkid === item._id;
            });
            if (completedhomework.length > 0) return true;
        }
        if (new Date(item.dueDate).getTime() < new Date().getTime()) {
            if (mode === "missed") return true;
        }
        return false;
    })

    return classData.loading || homeworkData.loading ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="small" /></View> : (
        (classid == "") ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.noclass.text")}</Text>
            </View>
        ) : (filteredItems.length == 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={commonStyle.text}>{i18n.t("registry.homework.warn.nohomework.text")}</Text>
            </View>
        ) : (
            <ScrollView style={commonStyle.dashboardSection} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={reload} />
            }>
                {renderHomework(filteredItems, classData.data)}
            </ScrollView>
        ))
    );
}

const Tab = createMaterialTopTabNavigator();

export default function HomeworkTab() {
    const router = useRouter();
    const userData = useUserData();
    const classid = userData.data.settings.activeClassId;

    if (userData.loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    );

    function AllHomework() {
        return <HomeworkComponent mode="all" userData={userData.data} classid={classid} />
    }

    function CompletedHomework() {
        return <HomeworkComponent mode="completed" userData={userData.data} classid={classid} />
    }

    function MissedHomework() {
        return <HomeworkComponent mode="missed" userData={userData.data} classid={classid} />
    }

    return (
        <>
            <Tab.Navigator>
                <Tab.Screen name={i18n.t("registry.homework.tab.all.title")} component={AllHomework} />
                <Tab.Screen name={i18n.t("registry.homework.tab.completed.title")} component={CompletedHomework} />
                <Tab.Screen name={i18n.t("registry.homework.tab.missed.title")} component={MissedHomework} />
            </Tab.Navigator>
            <ActionButtons items={[
                {
                    title: i18n.t("registry.homework.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/homework/create` as any, params: {classid: userData.data.settings.activeClassId}});
                    },
                    display: userData.data.settings.activeClassId != "" && userData.data.userInfo.role != "student",
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </>

    )
}