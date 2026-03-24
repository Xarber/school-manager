import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import i18n from "@/constants/i18n";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function AccountLayout() {
    const theme = useTheme();
    return (
        <LinearGradient
            colors={theme.appThemeGradient.colors}
            start={theme.appThemeGradient.start}
            end={theme.appThemeGradient.end}
            style={{ flex: 1, opacity: theme.appThemeGradient.opacity ?? 1 }}
        >
            <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
                <SafeAreaView
                    style={{ flex: 1, backgroundColor: theme.background }}
                    edges={["top"]}
                >
                    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.surface.toString() }, contentStyle: { backgroundColor: "transparent" } }}>
                        <Stack.Screen name="[page]" options={{ title: i18n.t("welcome.stack.title"), headerBackVisible: false,headerShown: false,headerTransparent: true,headerTitle: "" }} />
                        <Stack.Screen name="account/[action]" options={{ presentation: "modal", headerShown: true, title: i18n.t("welcome.account.stack.title"), headerStyle: { backgroundColor: theme.background }, contentStyle: { backgroundColor: theme.background } }} />
                    </Stack>
                </SafeAreaView>
            </BlurView>
        </LinearGradient>
    );
}