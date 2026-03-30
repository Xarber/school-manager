import { DataLoader, DataManager, LessonData, LessonScheduleData, SubjectData } from "@/data/datamanager";
import { createContext, useContext, useEffect, useState } from "react";
import { useClassData } from "./ClassContext";
import { useSubjectData } from "./SubjectMapContext";
import { useLessonData } from "./LessonMapContext";

const LessonScheduleDataContext = createContext<any>(null);

export function LessonScheduleDataProvider({ children }: { children: React.ReactNode }) {
    const [lessonScheduleMap, setLessonScheduleMap] = useState(({} as {[key: string]: LessonScheduleData}));
    const [lessonIds, setLessonIds] = useState<string[]>([]);
    const [reloadToken, setReloadToken] = useState(0);
    const allLessons = useLessonData().lessons;

    useEffect(()=>{
        setLessonIds([...allLessons.filter((lsn: LessonData) => {
            return lsn.scheduled && (typeof lsn.schedule === "object" || typeof lsn.schedule === "string");
        }).map((lsn: LessonData) => lsn._id)]);
    }, [allLessons]);

    let lessonSchedules = (Object.values(lessonScheduleMap) as LessonScheduleData[])
    .filter((lsn: LessonScheduleData) => typeof lsn === "object" && lsn);

    let unloadedLessonSchedules = (lessonIds as string[])
    .filter((lsn: any) => typeof lessonScheduleMap[lsn] === "undefined");

    const reload = () => {
        setLessonScheduleMap({});
        setReloadToken(prev => prev + 1);
    }

    return (
        <LessonScheduleDataContext.Provider value={{lessonSchedules, unloadedLessonSchedules, lessonScheduleMap, reload, loading: unloadedLessonSchedules.length > 0}}>
            {lessonIds.map((id: string) => {
                return (
                    <DataLoader
                        key={`${id}-${reloadToken}`}
                        id={id}
                        keys={DataManager.lessonScheduleData}
                        body={{ lessonid: id }}
                        onLoad={(id, lessonscheduledata) =>
                            setLessonScheduleMap(prev => {
                                if (prev[id]?._id === lessonscheduledata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: lessonscheduledata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </LessonScheduleDataContext.Provider>
    );
}

export function useLessonScheduleData() {
    const context = useContext(LessonScheduleDataContext);

    if (!context) {
        throw new Error("useLessonScheduleData must be used inside LessonScheduleDataProvider");
    }

    return context;
}