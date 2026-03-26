import { DataLoader, DataManager, HomeworkData, SubjectData } from "@/data/datamanager";
import { createContext, useContext, useEffect, useState } from "react";
import { useClassData } from "./ClassContext";
import { useSubjectData } from "./SubjectMapContext";

const HomeworkDataContext = createContext<any>(null);

export function HomeworkDataProvider({ children }: { children: React.ReactNode }) {
    const classData = useClassData();
    const [homeworkMap, setHomeworkMap] = useState(({} as {[key: string]: HomeworkData}));
    const subjects = useSubjectData().subjects;
    const [homeworkIds, setHomeworkIds] = useState<string[]>([]);

    useEffect(()=>{
        const subjectHomework = subjects.map((e: SubjectData)=>e.homework).flat();
        setHomeworkIds([...classData.data.homework, ...subjectHomework]);
    }, [classData.data, subjects]);

    let homework = (Object.values(homeworkMap) as HomeworkData[])
    .filter((lsn: HomeworkData) => typeof lsn === "object" && lsn);

    let unloadedHomework = (homeworkIds as string[])
    .filter((lsn: any) => typeof homeworkMap[lsn] === "undefined");

    return (
        <HomeworkDataContext.Provider value={{homework, unloadedHomework }}>
            {homeworkIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.homeworkData}
                        body={{ homeworkid: id }}
                        onLoad={(id, homeworkdata) =>
                            setHomeworkMap(prev => {
                                if (prev[id]?._id === homeworkdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: homeworkdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </HomeworkDataContext.Provider>
    );
}

export function useHomeworkData() {
    const context = useContext(HomeworkDataContext);

    if (!context) {
        throw new Error("useHomeworkData must be used inside HomeworkDataProvider");
    }

    return context;
}