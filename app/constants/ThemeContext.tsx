import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Scheme } from "./colors";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { useUserData } from "@/data/UserDataContext";
import { themeList } from "./colors";
import { setAlternateAppIcon, getAppIconName, resetAppIcon } from "expo-alternate-app-icons";

const ThemeContext = createContext<Scheme>("light");

export function pascalCase(s: string) {
    s = s.replace(/(\w)(\w*)/g,
        function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
    return s.replaceAll("-", "").replaceAll(" ", "");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme() ?? "light";
    const [scheme, setScheme] = useState<Scheme>(systemScheme as Scheme);

    const userData = useUserData();

    useEffect(() => {
        const userTheme = userData.data.settings?.theme;

        if (userTheme === "system") {
            setScheme(systemScheme as Scheme);
        } else if (userTheme) {
            setScheme(userTheme);
        }

        if (themeList.special.includes(userTheme) || themeList.hidden.includes(userTheme)) {
            let specialIconName = pascalCase(`icon-${userTheme}`);
            if (getAppIconName() !== specialIconName) {
                setAlternateAppIcon(specialIconName);
            }
        } else {
            // let defaultIconName = pascalCase(`icon-default`);
            if (getAppIconName() != null) {
                resetAppIcon();
            }
        }
    }, [userData.data.settings?.theme, systemScheme]);

    return (
        <ThemeContext.Provider value={scheme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    return useContext(ThemeContext);
}