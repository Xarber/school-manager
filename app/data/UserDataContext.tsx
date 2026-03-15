import { createContext, useContext } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";

const UserDataContext = createContext<any>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
    const userData = useAppDataSync(
        DataManager.userData.db,
        DataManager.userData.app,
        DataManager.userData.default
    );

    return (
        <UserDataContext.Provider value={userData}>
            {children}
        </UserDataContext.Provider>
    );
}

export function useUserData() {
    const context = useContext(UserDataContext);

    if (!context) {
        throw new Error("useUserData must be used inside UserDataProvider");
    }

    return context;
}