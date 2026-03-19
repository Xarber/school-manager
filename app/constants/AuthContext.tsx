import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import AppLockScreen from "@/components/appLockScreen";
import { useUserData } from "@/data/UserDataContext";
import * as LocalAuthentication from 'expo-local-authentication';
import i18n from './i18n';
import { Button, Text, View } from 'react-native';

type AppLockContextType = {
    firstUnlock: boolean;
    setFirstUnlock: React.Dispatch<React.SetStateAction<boolean>>;
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    authenticate: () => Promise<any>;
    lock: () => void;
};

const AppLockContext = createContext<AppLockContextType | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [firstUnlock, setFirstUnlock] = useState(false);
    const userData = useUserData();
    const isAppLockPersistOn = userData.data.settings?.appLockPersist ?? false;

    const authenticate = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true); // fallback
        setFirstUnlock(true);
        return;
        }

        const result = await LocalAuthentication.authenticateAsync({
        promptMessage: i18n.t("components.applock.unlock"),
        fallbackLabel: i18n.t("components.applock.fallback"),
        disableDeviceFallback: false
        });

        if (result.success === true && !firstUnlock) setFirstUnlock(true);
        setIsAuthenticated(result.success);
    };

    const lock = () => {
        setIsAuthenticated(false);
    };

    useEffect(() => {
        // authenticate(); // Auto start authentication process
    }, []);

    // 👉 re-auth quando app torna foreground
    useEffect(() => {
        let sub = null;
        if (userData.data.settings?.appLock) 
        sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                // if (!isAuthenticated) authenticate();
            } else if (state === "background") {
                // opzionale: blocca sempre quando esci
                if (isAppLockPersistOn) lock();
            }
        });

        return sub ? () => sub.remove() : () => {};
    }, [isAuthenticated, isAppLockPersistOn, userData.data.settings?.appLock]);

    return (
        <AppLockContext.Provider value={{ firstUnlock, setFirstUnlock, isAuthenticated, setIsAuthenticated, authenticate, lock }}>
            <View style={{ flex: 1 }}>
                <View
                    style={{ flex: 1, opacity: isAuthenticated ? 1 : 0 }}
                    pointerEvents={isAuthenticated ? "auto" : "none"}
                >
                    {children}
                </View>

                {!isAuthenticated && (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998,
                        }}
                    >
                        <AppLockScreen authenticate={authenticate} isAuthenticated={isAuthenticated} />
                    </View>
                )}
            </View>
        </AppLockContext.Provider>
    );
}

// 👉 hook
export function useAppLockContext() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLockContext must be used inside AppLockProvider");
  return ctx;
}