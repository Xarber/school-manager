import { Stack } from "expo-router";

export default function AiLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false, title: "AI" }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false, title: "Chat" }} />
            <Stack.Screen name="history" options={{ headerShown: true, title: "History" }} />
            {/* Add more screens here as needed */}
        </Stack>
    );
}