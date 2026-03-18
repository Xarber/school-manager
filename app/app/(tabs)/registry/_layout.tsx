import {Stack} from "expo-router";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function RegistryLayout() {
    const theme = useTheme();
    return (
        <LinearGradient
            colors={theme.appThemeGradient.colors}
            start={theme.appThemeGradient.start}
            end={theme.appThemeGradient.end}
            style={{ flex: 1, opacity: theme.appThemeGradient.opacity }}
        >
            <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
                <Stack screenOptions={{ headerStyle: { backgroundColor: theme.surface.toString() }, contentStyle: { backgroundColor: "transparent" } }}>
                    <Stack.Screen name="index" options={{ title: i18n.t("registry.stack.title") }} />
                    <Stack.Screen name="grades" options={{ headerShown: true, title: i18n.t("registry.grades.stack.title") }} />
                    <Stack.Screen name="exams" options={{ headerShown: true, title: i18n.t("registry.exams.stack.title") }} />
                    <Stack.Screen name="resources" options={{ headerShown: true, title: i18n.t("registry.resources.stack.title") }} />
                    <Stack.Screen name="schedule" options={{ headerShown: true, title: i18n.t("registry.schedule.stack.title") }} />
                    <Stack.Screen name="homework" options={{ headerShown: true, title: i18n.t("registry.homework.stack.title") }} />
                    <Stack.Screen name="comunications/[id]" options={{ headerShown: true, title: i18n.t("registry.comunications.stack.title") }} />
                    <Stack.Screen name="lessons" options={{ headerShown: true, title: i18n.t("registry.lessons.stack.title") }} />
                </Stack>
            </BlurView>
        </LinearGradient>
    );
}