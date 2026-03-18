import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function AiLayout() {
    const theme = useTheme();
    return (
        <LinearGradient
            colors={theme.appThemeGradient.colors}
            start={theme.appThemeGradient.start}
            end={theme.appThemeGradient.end}
            style={{ flex: 1, opacity: theme.appThemeGradient.opacity ?? 1 }}
        >
            <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
                <Stack screenOptions={{ headerStyle: { backgroundColor: theme.surface.toString() }, contentStyle: { backgroundColor: "transparent" } }}>
                    <Stack.Screen name="index" options={{ title: "AI", headerShown: true,headerTransparent: true,headerTitle: "" }} />
                    <Stack.Screen name="chat/[id]" options={{ title: "Chat", headerShown: true,headerTransparent: true,headerTitle: "" }} />
                    <Stack.Screen name="history" options={{ headerShown: true, title: "History" }} />
                    {/* Add more screens here as needed */}
                </Stack>
            </BlurView>
        </LinearGradient>
    );
}