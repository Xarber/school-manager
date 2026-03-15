import {Stack} from "expo-router";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";

export default function CalendarLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: i18n.t("calendar.stack.title") }} />
            <Stack.Screen name="[day]" options={{ headerShown: false, title: i18n.t("calendar.dayview.stack.title"), presentation: "modal", headerStyle: { backgroundColor: "" } }} />
        </Stack>
    );
}