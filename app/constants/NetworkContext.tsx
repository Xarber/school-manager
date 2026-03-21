import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AppLockScreen from "@/components/appLockScreen";
import { useUserData } from "@/data/UserDataContext";
import * as LocalAuthentication from 'expo-local-authentication';
import i18n from './i18n';
import { Button, Text, View } from 'react-native';
import { NetInfoStateType } from "@react-native-community/netinfo";
import * as NetInfo from "@react-native-community/netinfo"
import { dbpaths } from "@/data/db";

type NetworkContextType = {
    ready: boolean;
    isOnline: boolean | null;
    serverReachable: boolean | null;
    serverPath: string | null;
    type: NetInfoStateType | null;
    refresh: () => void;
};

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [serverReachable, setIsServerReachable] = useState<boolean | null>(null);
    const [serverPath, setServerPath] = useState<string | null>(null);
    const [type, setType] = useState<NetInfoStateType | null>(null);
    const refreshingRef = useRef(false);

    const findWorkingServer = async () => {
        const allServerPaths = dbpaths.useArray;

        const checks = allServerPaths.map(path =>
            fetch(path)
                .then(async r => ((r.ok && (await r.json()).success) ? path : null))
                .catch(() => null)
        );

        const first = await Promise.race(checks);

        if (first) {
            // console.warn("[Network] Server reachable:", first);
            setServerPath(first);
            setIsServerReachable(true);
            return first;
        }

        // console.warn("[Network] No servers are reachable.");
        setServerPath(null);
        setIsServerReachable(false);
        return null;
    }

    const refresh = async () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;

        try {
            const state = await NetInfo.fetch();
            let data = {
                ...state,
                isOnline: (state.isInternetReachable || state.isConnected)
            };

            await findWorkingServer();
            setIsOnline(data.isOnline);
            setType(data.type);
            if (ready != true) setReady(true);
        } finally {
            refreshingRef.current = false;
        }
    };

    useEffect(()=>{
        const int = setInterval(refresh, 7000);

        return () => clearInterval(int);
    }, []);

    useEffect(()=>{
        refresh();
    }, []);

    return (
        <NetworkContext.Provider value={{ ready, serverReachable, isOnline, type, serverPath, refresh }}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetworkContext() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetworkContext must be used inside NetworkProvider");
  return ctx;
}