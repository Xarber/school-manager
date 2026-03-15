import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Scheme } from "./colors";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { useUserData } from "@/data/UserDataContext";

const ThemeContext = createContext<Scheme>("light");

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