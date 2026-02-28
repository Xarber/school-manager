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

interface ActionButtonsProps {
    items: {
        title: string;
        iconName: React.ComponentProps<typeof Ionicons>["name"];
        onPress: () => void;
    }[],
    align?: "left" | "right";
    styles?: any;
}

export default function ActionButtons({ items, align, styles }: ActionButtonsProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    align ??= "right";

    return (
        <View style={[
            {
                position: "absolute",
                bottom: insets.bottom + 20,
                flexDirection: "row",
                justifyContent: "center",
                gap: 10
            }, 
            align === "left" ? { left: 20 } : { right: 20 }
        ]}>
            {items.map((e, i) => {
                return <TouchableOpacity key={i} style={[commonStyle.button, {display: "flex", flexDirection: "row", alignItems: "center", gap: 5}, styles]} onPress={e.onPress}>
                    <Ionicons name={e.iconName} size={30} color={theme.text}></Ionicons>
                    {e.title && <Text style={{ color: theme.text, fontSize: 12 }}>{e.title}</Text>}
                </TouchableOpacity>
            })}
        </View>
    );
}