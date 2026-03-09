import {Stack} from "expo-router";
import { colors } from "@/constants/colors";

export default function HomeLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.dynamic.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: "Home" }} />
        </Stack>
    );
}