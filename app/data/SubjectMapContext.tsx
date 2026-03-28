import { DataLoader, DataManager, SubjectData } from "@/data/datamanager";
import { createContext, useContext, useState } from "react";
import { useClassData } from "./ClassContext";

const SubjectDataContext = createContext<any>(null);

export function SubjectDataProvider({ children }: { children: React.ReactNode }) {
    const classData = useClassData();
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const [reloadToken, setReloadToken] = useState(0);
    let subjectIds = classData.data.subjects ?? [];

    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    let unloadedSubjects = (subjectIds as string[])
    .filter((sbj: any) => typeof subjectMap[sbj] === "undefined");

    const reload = () => {
        setSubjectMap({});
        setReloadToken(prev => prev + 1);
    }

    return (
        <SubjectDataContext.Provider value={{subjects, unloadedSubjects, reload, loading: unloadedSubjects.length > 0}}>
            {subjectIds.map((id: string) => {
                return (
                    <DataLoader
                        key={`${id}-${reloadToken}`}
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