import { createContext, useContext, useEffect } from "react";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { useUserData } from "./UserDataContext";

const ClassDataContext = createContext<any>(null);

export function ClassDataProvider({ children }: { children: React.ReactNode }) {
    const userData = useUserData();
    const classid = userData.data?.settings?.activeClassId;

    const classData = useAppDataSync(
        classid == "" ? null : DataManager.classData.db,
        `${DataManager.classData.app}:${classid}`,
        DataManager.classData.default,
        { classid }
    );

    useEffect(() => {
        classData.load();
    }, [ classid ]);

    return (
        <ClassDataContext.Provider value={classData}>
            {children}
        </ClassDataContext.Provider>
    );
}

export function useClassData() {
    const context = useContext(ClassDataContext);

    if (!context) {
        throw new Error("useClassData must be used inside ClassDataProvider");
    }

    return context;
}