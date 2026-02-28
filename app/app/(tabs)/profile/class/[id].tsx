import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { Icon, Stack } from "expo-router";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import useAsyncData, { defaultData, KEYS } from "@/data/datamanager";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButtons from "@/components/actionButtons";

function AllClassList() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    
    return userData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection}>
                <DashboardItem title="Your Classes" items={[
                    {
                        title: "Class 1",
                        description: "Description for Class 1",
                        onPress: () => {
                            router.push(`/profile/class/Prova1`);
                         },
                    }
                ]} />
            </ScrollView>
            {userData.data.userInfo.role != "teacher" && (
                <ActionButtons items={[
                    {
                        title: "Create",
                        iconName: "add",
                        onPress: () => {
                            router.push(`/modal/class/create`);
                        },
                    },
                    {
                        title: "Join",
                        iconName: "log-in",
                        onPress: () => {
                            Alert.alert("Join Class", "This feature is not implemented yet.");
                        },
                    }
                ]} align="right" styles={{ borderRadius: 360 }} />
            )}
        </View>
    );
}

export default function ClassTab() {
    const params = useLocalSearchParams();
    const classId = params.id as string;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    switch (classId) {
        case "all":
            return <AllClassList />;
        default:
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Stack.Screen options={{headerTitle: classId}} />
                    <Text style={commonStyle.text}>Class Details for {classId}</Text>
                </View>
            );
    }
}