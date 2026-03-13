import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAppDataSync, DataManager, HomeworkData, UserData, ClassData, SubjectData } from "@/data/datamanager";
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';

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

function HomeworkComponent(mode: 'all' | 'completed' | 'missed') {
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

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const classData = useAppDataSync(userData.loading ? null : DataManager.classData.db, `${DataManager.classData.app}:${userData.data.settings.activeClassId}`, DataManager.classData.default, {
        classid: userData.data.settings.activeClassId,
        populate: ["subjects"]
    });

    let defaultHomeworkData = [{subjectid: "", data: [DataManager.homeworkData.default]}];
    const homeworkData = useAppDataSync(userData.loading ? null : DataManager.homeworkData.db, `${DataManager.homeworkData.app}:${userData.data.settings.activeClassId}`, defaultHomeworkData, {
        classid: userData.data.settings.activeClassId
    });
    
    const allClassHomework = regroupHomework(homeworkData.data || []);
    
    const homeworkPageData = {
        homework: allClassHomework,
        userdata: userData.data as UserData
    }
    const homework = Object.values(homeworkPageData.homework) as HomeworkData[];

    console.log(homeworkPageData);
    const filteredItems = homework.filter((item) => {
        if (mode === "all") return true;
        // Filter user's completedhomework {classid, subjectid, homeworkid}, and check if the homework item has those same properties
        if (mode === "completed") {
            const completedhomework = userData.data.completedhomework.filter((homeworkid: String) => {
                return homeworkid === item._id;
            });
            if (completedhomework.length > 0) return true;
        }
        if (new Date(item.dueDate).getTime() < new Date().getTime()) {
            if (mode === "missed") return true;
        }
        return false;
    })

    return userData.loading || classData.loading || homeworkData.loading ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="small" /></View> : (
        <ScrollView style={commonStyle.dashboardSection}>
            {renderHomework(filteredItems, classData.data)}
        </ScrollView>
    );
}

const Tab = createMaterialTopTabNavigator();

export default function HomeworkTab() {
    const router = useRouter();
    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    return (
        <>
            <Tab.Navigator>
            <Tab.Screen name={i18n.t("registry.homework.tab.all.title")} component={()=>HomeworkComponent("all")} />
            <Tab.Screen name={i18n.t("registry.homework.tab.completed.title")} component={()=>HomeworkComponent("completed")} />
            <Tab.Screen name={i18n.t("registry.homework.tab.missed.title")} component={()=>HomeworkComponent("missed")} />
            </Tab.Navigator>
            <ActionButtons items={[
                {
                    title: i18n.t("registry.homework.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/homework/create` as any, params: {classid: userData.data.settings.activeClassId}});
                    },
                    display: userData.data.userInfo.role != "student",
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </>

    )
}