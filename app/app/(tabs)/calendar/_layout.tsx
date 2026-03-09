import {Stack} from "expo-router";
import { colors } from "@/constants/colors";

export default function CalendarLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.dynamic.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: "Calendar" }} />
            <Stack.Screen name="[day]" options={{ headerShown: false, title: "Day View", presentation: "modal" }} />
        </Stack>
    );
}