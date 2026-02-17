import { Stack } from "expo-router";

export default function AiLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: "AI", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="chat/[id]" options={{ title: "Chat", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="history" options={{ headerShown: true, title: "History" }} />
            {/* Add more screens here as needed */}
        </Stack>
    );
}