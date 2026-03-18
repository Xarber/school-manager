import { Redirect, SplashScreen } from "expo-router";
import { Button, Text, View } from "react-native";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { useEffect, useState } from "react";
import { useGlobalStore } from "@/data/store";
import { useUserData } from "@/data/UserDataContext";
import i18n from "@/constants/i18n";
import AppLockScreen from "@/components/appLockScreen";
import { useAppLockContext } from "@/constants/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function welcomeScreen() {
    const [isReady, setIsReady] = useState(false);
    const [debugDataSaved, setDebugDataSaved] = useState(false);
    const { setIsAuthenticated, firstUnlock } = useAppLockContext();
    const userData = useUserData();
    let appDebugData = useAppDataSync(DataManager.debugData.db, DataManager.debugData.app, DataManager.debugData.default);

    useEffect(() => {  
        // Save launch once
        if (!appDebugData.loading) {  
            appDebugData.save({  
                ...appDebugData.data,  
                lastLaunchDate: new Date().toString(),  
                launchCount: (appDebugData.data.launchCount || 0) + 1  
            }).then(() => {
                setDebugDataSaved(true);
            });
        }
    }, [appDebugData.loading]);

    useEffect(() => {  
        if (!appDebugData.loading && !userData.loading && debugDataSaved) {
            setIsReady(true);  
            SplashScreen.hideAsync();  // Hide native splash  
        }
    }, [(!appDebugData.loading && !userData.loading), debugDataSaved]);  
    
    // appDebugData.data.firstLaunch = true; // Temporarily hide setup screen

    useEffect(()=>{
        if (isReady && isAppLockOn && !firstUnlock) setIsAuthenticated(false);
    }, [isReady]);

    if (!isReady) return null;

    const isAppLockOn = userData.data.settings?.appLock ?? false;


    return (
        <View>
            {
                appDebugData.data.firstLaunch === true
                ? <Redirect href="/welcome/(tabs)" />
                : <Redirect href="/welcome/start" />
            }
        </View>
    );
}