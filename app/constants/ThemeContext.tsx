import { useUserData } from "@/data/UserDataContext";
import { getAppIconName, setAlternateAppIcon, supportsAlternateIcons } from "expo-alternate-app-icons";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { colors, Scheme, themeList } from "./colors";

const ThemeContext = createContext<Scheme>("light");

export function pascalCase(s: string) {
    s = s.replace(/(\w)(\w*)/g,
        function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
    return s.replaceAll("-", "").replaceAll(" ", "");
}

export function rgbStringToHex(input: string): string | null {
    if (input.startsWith("#")) return input; // already hex
    const match = input
        .replace(/rgba?\(/, "")
        .replace(")", "")
        .split(/[\s,]+/)
        .filter(Boolean);

    if (match.length < 3) return null;

    const [r, g, b, a] = match.map(Number);

    const clamp = (v: number) =>
        Math.max(0, Math.min(255, Math.round(v)));

    const toHex = (v: number) =>
        clamp(v).toString(16).padStart(2, "0");

    const hex =
        "#" +
        toHex(r) +
        toHex(g) +
        toHex(b) +
        (a !== undefined ? toHex(a * 255) : "");

    return hex;
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
            const existingColor = document.querySelector('meta[name="color-scheme"]');
            if (existingColor) document.head.removeChild(existingColor);
            const existingTheme = document.querySelector('meta[name="theme-color"]');
            if (existingTheme) document.head.removeChild(existingTheme);


            const metaColor = document.createElement("meta");
            metaColor.name = "color-scheme";
            metaColor.content = lightOrDark;
            document.head.appendChild(metaColor);

            const metaTheme = document.createElement("meta");
            metaTheme.name = "theme-color";
            metaTheme.content = rgbStringToHex(colors[(userTheme === "system" ? (systemScheme as Scheme) : (userTheme as Scheme))].background) as string;
            document.head.appendChild(metaTheme);
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