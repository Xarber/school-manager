import {Stack} from "expo-router";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";
import { useTheme } from "@/constants/useThemes";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function CalendarLayout() {
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
                    <Stack.Screen name="index" options={{ title: i18n.t("calendar.stack.title") }} />
                </Stack>
            </BlurView>
        </LinearGradient>
    );
}