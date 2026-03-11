import {Stack} from "expo-router";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";

export default function HomeLayout() {
    return (
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
            <Stack.Screen name="index" options={{ title: i18n.t("home.stack.title") }} />
        </Stack>
    );
}