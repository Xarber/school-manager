import { Redirect } from "expo-router";
import useAsyncData from "@/data/datamanager";
import { KEYS } from "@/data/datamanager";
import { defaultData } from "@/data/datamanager";

export default function welcomeScreen() {
    let appDebugData = useAsyncData(KEYS.debugData, defaultData.debugData);
    appDebugData.data.firstLaunch = true; // Temporarily hide setup screen
    if (appDebugData.data.firstLaunch === true) return <Redirect href="/(tabs)" />;

    return (
        <Redirect href="/welcome/start" />
    );
}