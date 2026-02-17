import { Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";

export default function ClassTab() {
    const params = useLocalSearchParams();
    const classId = params.id as string;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    // Get current class ID from route
    

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={commonStyle.text}>Class Details for {classId}</Text>
        </View>
    );
}