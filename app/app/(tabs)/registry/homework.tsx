import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import DashboardItem from '@/components/dashboardItem';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAppDataSync, DataManager, HomeworkData, UserData } from "@/data/datamanager";
import i18n from '@/constants/i18n';

function renderHomework(homework: HomeworkData[]) {
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
                            items={dateIndex[date]}
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
    const activeClassId = userData.data.settings.activeClassId;
    
    const allClassHomework = [] as any[]; // todo
    
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

    return (
        <ScrollView style={commonStyle.dashboardSection}>
            {renderHomework(filteredItems)}
        </ScrollView>
    );
}

const Tab = createMaterialTopTabNavigator();

export default function HomeworkTab() {
    return (
        <Tab.Navigator>
            <Tab.Screen name={i18n.t("registry.homework.tab.all.title")} component={()=>HomeworkComponent("all")} />
            <Tab.Screen name={i18n.t("registry.homework.tab.completed.title")} component={()=>HomeworkComponent("completed")} />
            <Tab.Screen name={i18n.t("registry.homework.tab.missed.title")} component={()=>HomeworkComponent("missed")} />
        </Tab.Navigator>
    )
}