import {Stack} from "expo-router";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";

export default function RegistryLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: i18n.t("registry.stack.title") }} />
            <Stack.Screen name="grades" options={{ headerShown: true, title: i18n.t("registry.grades.stack.title") }} />
            <Stack.Screen name="exams" options={{ headerShown: true, title: i18n.t("registry.exams.stack.title") }} />
            <Stack.Screen name="resources" options={{ headerShown: true, title: i18n.t("registry.resources.stack.title") }} />
            <Stack.Screen name="schedule" options={{ headerShown: true, title: i18n.t("registry.schedule.stack.title") }} />
            <Stack.Screen name="homework" options={{ headerShown: true, title: i18n.t("registry.homework.stack.title") }} />
            <Stack.Screen name="comunications/[id]" options={{ headerShown: true, title: i18n.t("registry.comunications.stack.title") }} />
            <Stack.Screen name="lessons" options={{ headerShown: true, title: i18n.t("registry.lessons.stack.title") }} />
        </Stack>
    );
}