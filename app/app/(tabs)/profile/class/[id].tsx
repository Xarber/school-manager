import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { Icon, Stack } from "expo-router";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import { useAppDataSync, DataManager, ClassData } from "@/data/datamanager";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButtons from "@/components/actionButtons";

function AllClassList() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default, {populate: ["classes"]});
    let classes = userData.data.classes.map((cls: ClassData) => ({
        title: cls.name,
        description: cls.notes.slice(0, 2).join("\n"),
        onPress: () => {
            router.push(`/profile/class/${cls._id}`);
        }
    }));

    return userData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection}>
                <DashboardItem title="Your Classes" items={classes} />
            </ScrollView>
                <ActionButtons items={[
                    {
                        title: "Create",
                        iconName: "add",
                        onPress: () => {
                            router.push(`/modal/class/create`);
                        },
                        display: userData.data.userInfo.role != "student",
                    },
                    {
                        title: "Join",
                        iconName: "log-in",
                        onPress: () => {
                            Alert.alert("Join Class", "This feature is not implemented yet.");
                        },
                    }
                ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
    );
}

export default function ClassTab() {
    const params = useLocalSearchParams();
    const classId = params.id as string;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });

    console.log(JSON.stringify(classData.data, null, 4));

    switch (classId) {
        case "all":
            return <AllClassList />;
        default:
            return classData.loading ? 
            (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" />
                </View>
            ) : (
                <View style={commonStyle.dashboardSection}>
                    <Stack.Screen options={{headerTitle: classData.data.name}} />
                    <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                    <Text style={commonStyle.text}>{classData.data.notes.join("\n")}</Text>
                </View>
            );
    }
}