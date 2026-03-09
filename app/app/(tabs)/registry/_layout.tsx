import {Stack} from "expo-router";
import { colors } from "@/constants/colors";

export default function RegistryLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.dynamic.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: "Registry" }} />
            <Stack.Screen name="grades" options={{ headerShown: true, title: "Grades" }} />
            <Stack.Screen name="exams" options={{ headerShown: true, title: "Exams" }} />
            <Stack.Screen name="resources" options={{ headerShown: true, title: "Resources" }} />
            <Stack.Screen name="schedule" options={{ headerShown: true, title: "Schedule" }} />
            <Stack.Screen name="homework" options={{ headerShown: true, title: "Homework" }} />
            <Stack.Screen name="comunications/index" options={{ headerShown: true, title: "Comunications" }} />
            <Stack.Screen name="comunications/[id]" options={{ presentation: "modal", headerShown: true, title: "Comunications" }} />
            <Stack.Screen name="attendance" options={{ headerShown: true, title: "Attendance" }} />
        </Stack>
    );
}