import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Scheme, Theme } from "./colors";
import { useAppDataSync, DataManager } from "@/data/datamanager";

export default function useThemeContext() {
    // Todo: Live reload for theme switch in settings
    let [scheme, setScheme] = useState((useColorScheme() ?? 'light') as Scheme);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    if (userData.loading === false && (["light", "dark"].includes(userData.data.settings.theme)) && scheme != userData.data.settings.theme)
        setScheme(userData.data.settings.theme as Scheme);

    useEffect(()=>{
        setScheme(scheme);
    }, [(userData.data.settings ?? {}).theme]);

    return scheme;
}