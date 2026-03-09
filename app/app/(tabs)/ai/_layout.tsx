import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

export default function AiLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.dynamic.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: "AI", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="chat/[id]" options={{ title: "Chat", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="history" options={{ headerShown: true, title: "History" }} />
            {/* Add more screens here as needed */}
        </Stack>
    );
}