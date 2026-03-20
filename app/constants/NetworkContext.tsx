import React, { createContext, useContext, useEffect, useState } from "react";
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
    type: NetInfoStateType | null;
    refresh: () => void;
};

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [serverReachable, setIsServerReachable] = useState<boolean | null>(null);
    const [type, setType] = useState<NetInfoStateType | null>(null);

    const refresh = async () => {
        setReady(false);
        
        const state = await NetInfo.fetch();
        let data = {
            ...state,
            isOnline: false // (state.isInternetReachable || state.isConnected)
        };

        const isServerReachable = await fetch(dbpaths.use).then(async r=>(r.ok) ? (await r.json()).success : false).catch(e=>false);

        setIsOnline(data.isOnline);
        setIsServerReachable(isServerReachable);
        setType(data.type);
        setReady(true);
    };

    useEffect(()=>{
        refresh();
    }, []);

    return (
        <NetworkContext.Provider value={{ ready, serverReachable, isOnline, type, refresh }}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetworkContext() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetworkContext must be used inside NetworkProvider");
  return ctx;
}