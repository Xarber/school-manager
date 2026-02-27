import {Stack} from "expo-router";

export default function CalendarLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: "Calendar" }} />
            <Stack.Screen name="[day]" options={{ headerShown: false, title: "Day View", presentation: "modal" }} />
        </Stack>
    );
}