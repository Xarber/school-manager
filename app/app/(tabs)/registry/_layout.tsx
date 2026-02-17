import {Stack} from "expo-router";

export default function RegistryLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: "Registry", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="grades" options={{ headerShown: true, title: "Grades" }} />
            <Stack.Screen name="exams" options={{ headerShown: true, title: "Exams" }} />
            <Stack.Screen name="resources" options={{ headerShown: true, title: "Resources" }} />
            <Stack.Screen name="schedule" options={{ headerShown: true, title: "Schedule" }} />
            <Stack.Screen name="homework" options={{ headerShown: true, title: "Homework" }} />
            <Stack.Screen name="comunications" options={{ headerShown: true, title: "Comunications" }} />
            <Stack.Screen name="attendance" options={{ headerShown: true, title: "Attendance" }} />
        </Stack>
    );
}