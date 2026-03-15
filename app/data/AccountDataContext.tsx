import { createContext, useContext } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";

const AccountDataContext = createContext<any>(null);

export function AccountDataProvider({ children }: { children: React.ReactNode }) {
    const accountData = useAppDataSync(
        DataManager.accountData.db,
        DataManager.accountData.app,
        DataManager.accountData.default
    );

    return (
        <AccountDataContext.Provider value={accountData}>
            {children}
        </AccountDataContext.Provider>
    );
}

export function useAccountData() {
    const context = useContext(AccountDataContext);

    if (!context) {
        throw new Error("useAccountData must be used inside AccountDataProvider");
    }

    return context;
}