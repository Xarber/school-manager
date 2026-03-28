import { DataLoader, DataManager, UserInfo } from "@/data/datamanager";
import { createContext, useContext, useEffect, useState } from "react";
import { useClassData } from "./ClassContext";
import { useUserData } from "./UserDataContext";

const ClassmateDataContext = createContext<any>(null);

export function ClassmateDataProvider({ children }: { children: React.ReactNode }) {
    const userData = useUserData();
    const classData = useClassData();
    const [classmateMap, setClassmateMap] = useState(({} as {[key: string]: UserInfo}));
    const [classmateIds, setClassmateIds] = useState<string[]>([]);
    const [reloadToken, setReloadToken] = useState(0);

    //! Disabled for now, as it causes too many requests on app load, and the classmates are not critical data.
    //! Will implement a more efficient batching system later.
    // useEffect(()=>{
    //     const classmates = [
    //         ...classData.data.students
    //             .map((student: string | UserInfo) => typeof student === "string" ? student : student._id),
    //         ...classData.data.teachers
    //             .map((teacher: string | UserInfo) => typeof teacher === "string" ? teacher : teacher._id)
    //     ]
    //     .filter((id: string) => id !== userData.data?.userInfo?._id);

    //     setClassmateIds(classmates);
    // }, [classData.data.students, classData.data.teachers]);
    
    let classmates = (Object.values(classmateMap) as UserInfo[])
    .filter((clsm: UserInfo) => typeof clsm === "object" && clsm);

    let unloadedClassmates = (classmateIds as string[])
    .filter((clsm: string) => typeof classmateMap[clsm] === "undefined");

    const reload = () => {
        setClassmateMap({});
        setReloadToken(prev => prev + 1);
    }

    return (
        <ClassmateDataContext.Provider value={{classmates, unloadedClassmates, classmateMap, reload, loading: unloadedClassmates.length > 0}}>
            {classmateIds.map((id: string) => {
                return (
                    <DataLoader
                        key={`${id}-${reloadToken}`}
                        id={id}
                        keys={DataManager.classmateData}
                        body={{ userid: id, classid: classData.data._id }}
                        onLoad={(id, classmatedata) =>
                            setClassmateMap(prev => {
                                if (prev[id]?._id === classmatedata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: classmatedata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </ClassmateDataContext.Provider>
    );
}

export function useClassmateData() {
    const context = useContext(ClassmateDataContext);

    if (!context) {
        throw new Error("useClassmateData must be used inside ClassmateDataProvider");
    }

    return context;
}