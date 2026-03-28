import { DataLoader, DataManager, LessonData, SubjectData } from "@/data/datamanager";
import { createContext, useContext, useEffect, useState } from "react";
import { useClassData } from "./ClassContext";
import { useSubjectData } from "./SubjectMapContext";

const LessonDataContext = createContext<any>(null);

export function LessonDataProvider({ children }: { children: React.ReactNode }) {
    const classData = useClassData();
    const [lessonMap, setLessonMap] = useState(({} as {[key: string]: LessonData}));
    const subjects = useSubjectData().subjects;
    const [lessonIds, setLessonIds] = useState<string[]>([]);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(()=>{
        const subjectLessons = subjects.map((e: SubjectData)=>e.lessons).flat();
        setLessonIds([...classData.data.lessons, ...subjectLessons]);
    }, [classData.data, subjects]);

    let lessons = (Object.values(lessonMap) as LessonData[])
    .filter((lsn: LessonData) => typeof lsn === "object" && lsn);

    let unloadedLessons = (lessonIds as string[])
    .filter((lsn: any) => typeof lessonMap[lsn] === "undefined");

    const reload = () => {
        setLessonMap({});
        setReloadToken(prev => prev + 1);
    }

    return (
        <LessonDataContext.Provider value={{lessons, unloadedLessons, reload, loading: unloadedLessons.length > 0}}>
            {lessonIds.map((id: string) => {
                return (
                    <DataLoader
                        key={`${id}-${reloadToken}`}
                        id={id}
                        keys={DataManager.lessonData}
                        body={{ lessonid: id }}
                        onLoad={(id, lessondata) =>
                            setLessonMap(prev => {
                                if (prev[id]?._id === lessondata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: lessondata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </LessonDataContext.Provider>
    );
}

export function useLessonData() {
    const context = useContext(LessonDataContext);

    if (!context) {
        throw new Error("useLessonData must be used inside LessonDataProvider");
    }

    return context;
}