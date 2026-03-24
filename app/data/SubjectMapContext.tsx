import { createContext, useContext, useEffect, useState } from "react";
import { useAppDataSync, DataManager, SubjectData, DataLoader } from "@/data/datamanager";
import { useUserData } from "./UserDataContext";
import { useClassData } from "./ClassContext";

const SubjectDataContext = createContext<any>(null);

export function SubjectDataProvider({ children }: { children: React.ReactNode }) {
    const classData = useClassData();
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    let subjectIds = classData.data.subjects ?? [];

    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    let unloadedSubjects = (subjectIds as string[])
    .filter((sbj: any) => typeof subjectMap[sbj] === "undefined");

    return (
        <SubjectDataContext.Provider value={{subjects, unloadedSubjects }}>
            {subjectIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.subjectData}
                        body={{ subjectid: id }}
                        onLoad={(id, subjectdata) =>
                            setSubjectMap(prev => {
                                if (prev[id]?._id === subjectdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: subjectdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </SubjectDataContext.Provider>
    );
}

export function useSubjectData() {
    const context = useContext(SubjectDataContext);

    if (!context) {
        throw new Error("useSubjectData must be used inside SubjectDataProvider");
    }

    return context;
}