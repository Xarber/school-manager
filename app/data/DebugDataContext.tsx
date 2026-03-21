import { createContext, useContext } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";

const DebugDataContext = createContext<any>(null);

export function DebugDataProvider({ children }: { children: React.ReactNode }) {
    const debugData = useAppDataSync(
        DataManager.debugData.db,
        DataManager.debugData.app,
        DataManager.debugData.default
    );

    return (
        <DebugDataContext.Provider value={debugData}>
            {children}
        </DebugDataContext.Provider>
    );
}

export function useDebugData() {
    const context = useContext(DebugDataContext);

    if (!context) {
        throw new Error("useDebugData must be used inside DebugDataProvider");
    }

    return context;
}