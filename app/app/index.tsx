import { Redirect } from "expo-router";
import { View } from "react-native";
import useAsyncData from "@/data/datamanager";
import { KEYS } from "@/data/datamanager";
import { defaultData } from "@/data/datamanager";
import { useEffect } from "react";
import { useGlobalStore } from "@/data/store";

export default function welcomeScreen() {
    let appDebugData = useAsyncData(KEYS.debugData, defaultData.debugData);
    if (appDebugData.loading === false) appDebugData.save({...appDebugData.data, lastLaunchDate: new Date().toString(), launchCount: appDebugData.data.launchCount + 1}).then(() => {
        appDebugData.load();
    });

    const {appData, setAppData} = useGlobalStore();
    if (Object.keys(appData).length === 0) setAppData({
        debugData: appDebugData,
        
    });
    
    // appDebugData.data.firstLaunch = true; // Temporarily hide setup screen

    return (
        <View>
            {
                appDebugData.data.firstLaunch === false &&
                appDebugData.loading === false &&
                <Redirect href="/welcome/start" />
            }
            {
                appDebugData.data.firstLaunch === true &&
                <Redirect href="/welcome/(tabs)" />
            }
        </View>
    );
}