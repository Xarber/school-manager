import { createContext, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { colors, Scheme } from "./colors";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { useUserData } from "@/data/UserDataContext";
import { themeList } from "./colors";
import { setAlternateAppIcon, getAppIconName, resetAppIcon, supportsAlternateIcons } from "expo-alternate-app-icons";

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
        const lightOrDark = colors[(userTheme === "system" ? (systemScheme as Scheme) : (userTheme as Scheme))].type;

        if (userTheme === "system") {
            setScheme(systemScheme as Scheme);
        } else if (userTheme) {
            setScheme(userTheme);
        }

        if (Platform.OS === "web") {
            // rimuovi vecchio meta se esiste
            const existing = document.querySelector('meta[name="color-scheme"]');
            if (existing) document.head.removeChild(existing);

            const meta = document.createElement("meta");
            meta.name = "color-scheme";
            meta.content = lightOrDark;
            document.head.appendChild(meta);
        }
    }, [userData.data.settings?.theme, systemScheme]);

    if (supportsAlternateIcons == true) {
        useEffect(() => {
            const userTheme = userData.data.settings?.theme;
            if (!userTheme || userData.loading === true) return;

            const updateIcon = async () => {
                const currentAppIcon = getAppIconName();
                await new Promise(r => setTimeout(r, 500));
                try {
                    if (themeList.special.includes(userTheme) || themeList.hidden.includes(userTheme)) {
                        let specialIconName = pascalCase(`icon-${userTheme}`);
                        if (currentAppIcon != specialIconName) {
                            console.warn(`[THEMES] ${currentAppIcon ?? "Default"} -> ${specialIconName}`);
                            await setAlternateAppIcon(specialIconName);
                        }
                    } else {
                        if (currentAppIcon != null) {
                            console.warn(`[THEMES] ${currentAppIcon} -> Default`);
                            await setAlternateAppIcon(null);
                        }
                    }
                } catch (e) {
                    console.warn("[THEMES]", e);
                }
            };

            updateIcon();
        }, [userData.data.settings?.theme, userData.loading]);
    }

    return (
        <ThemeContext.Provider value={scheme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    return useContext(ThemeContext);
}