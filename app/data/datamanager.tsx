import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const defaultUserInfo = {
    userid: '' as string,
    name: '' as string,
    surname: '' as string,
    email: '' as string,
    birthday: '' as string,
    role: 'student' as 'student' | 'teacher',
}
type UserInfo = typeof defaultUserInfo;

const defaultUserSettings = {
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: false as boolean,
    language: 'en' as string,
    calendarSync: {
        enabled: false as boolean,
        homework: false as boolean,
        schedule: false as boolean,
        comunications: false as boolean,
        exams: false as boolean,
    },
}
type UserSettings = typeof defaultUserSettings;

const defaultUserData = {
    name: "John Doe" as string,
    userInfo: defaultUserInfo as UserInfo,
    settings: defaultUserSettings as UserSettings,
    classes: [] as {classid: string}[],
    grades: [] as GradeData[],
    completedhomework: [] as {classid: string, subjectid: string, homeworkid: string}[],
}
type UserData = typeof defaultUserData;

const defaultScheduleHour = {
    classid: '' as string,
    subjectid: '' as string,
    teacher: undefined as string | undefined,
    room: '' as string,
    duration: '' as string,
}
type ScheduleHour = typeof defaultScheduleHour;

const defaultClassData = {
    classid: '' as string,
    name: '' as string,
    teachers: [] as UserInfo[],
    students: [] as UserInfo[],
    schedule: {} as ({ [day: string]: ScheduleHour[] }),
    comunications: [] as ComunicationData[],
    subjects: [] as SubjectData[],
    notes: [] as string[],
}
type ClassData = typeof defaultClassData;

const defaultSubjectData = {
    classid: '' as string,
    subjectid: '' as string,
    name: '' as string,
    teacher: '' as string,
    schedule: {} as { [day: string]: ScheduleHour[] },
    maxgrade: 100 as number,
    gradeType: 'percentage' as 'letter' | 'percentage' | 'points',
    homework: [] as HomeworkData[],
    lessons: [] as LessonData[],
}
type SubjectData = typeof defaultSubjectData;

const defaultGradeData = {
    title: '' as string,
    type: '' as 'oral' | 'written' | 'homework' | 'project' | 'other',
    grade: 0 as number | string,
    classid: '' as string,
    subjectid: '' as string,
    homeworkid: undefined as string | undefined,
    addedAt: '' as string,
}
type GradeData = typeof defaultGradeData;

const defaultMaterialData = {
    materialid: '' as string,
    classid: '' as string,
    subjectid: '' as string | undefined,
    title: '' as string,
    description: '' as string,
    type: 'file' as 'file' | 'link',
    url: '' as string,
    addedAt: '' as string,
}
type MaterialData = typeof defaultMaterialData;

const defaultHomeworkData = {
    homeworkid: '' as string,
    classid: '' as string,
    subjectid: '' as string,
    title: '' as string,
    description: '' as string,
    points: 0 as number | undefined,
    material: [] as {materialid: string}[],
    dueDate: '' as string | undefined,
    addedAt: '' as string,
}
type HomeworkData = typeof defaultHomeworkData;

const defaultLessonData = {
    lessonid: '' as string,
    classid: '' as string,
    subjectid: '' as string,
    title: '' as string,
    description: '' as string,
    date: '' as string,
    time: '' as string,
    teacher: undefined as UserInfo | undefined,
    room: '' as string | undefined,
    material: [] as {materialid: string}[],
    scheduled: false as boolean,
    isExam: false as boolean,
    addedAt: '' as string,
}
type LessonData = typeof defaultLessonData;

const defaultComunicationData = {
    comunicationid: '' as string,
    classid: '' as string,
    subjectid: undefined as string | undefined,
    title: '' as string,
    content: '' as string,
    date: undefined as string | undefined,
    time: undefined as string | undefined,
    urgency: 'low' as 'low' | 'medium' | 'high',
    requiresConfirmation: false as boolean,
    sender: undefined as UserInfo | undefined,
    addedAt: '' as string,
}
type ComunicationData = typeof defaultComunicationData;

export default function useAsyncData<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem(key);
            setData(stored ? (JSON.parse(stored) as T) : defaultValue);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Load failed');
            setData(defaultValue);
        } finally {
            setLoading(false);
        }
    };

    const save = async (newValue: T) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(newValue));
            setData(newValue);
        } catch (err) {
            setError('Save failed');
        }
    };

    useEffect(() => {
        load();
    }, [key]);

    return { data, loading, error, load, save };
};

export const KEYS = {
    userSettings: '@app:userSettings',
    userData: '@app:userData',

    classData: '@app:classData',                                     // `@app:classData:${classid}`
    subjectData: '@app:subjectData',                                 // `@app:subjectData:${classid}:${subjectid}`

    gradeData: '@app:gradeData',                                     // `@app:gradeData:${classid}:${subjectid}:${homeworkid}`
    idlessGradeData: '@app:idlessGradeData',                         // `@app:idlessGradeData:${classid}:${subjectid}`
    homeworkData: '@app:homeworkData',                               // `@app:homeworkData:${classid}:${subjectid}:${homeworkid}`,

    lessonData: '@app:lessonData',                                   // `@app:lessonData:${classid}:${subjectid}:${lessonid}`
    materialData: '@app:materialData',                               // `@app:materialData:${classid}:${subjectid}:${materialid}`
    subjectlessMaterialData: '@app:subjectlessMaterialData',         // `@app:subjectlessMaterialData:${classid}:${materialid}`

    comunicationData: '@app:comunicationData',                       // `@app:comunicationData:${classid}:${subjectid}:${comunicationid}`
    subjectlessComunicationData: '@app:subjectlessComunicationData', // `@app:subjectlessComunicationData:${classid}:${comunicationid}`
} as const;
export type { UserSettings, UserData, ClassData, UserInfo, SubjectData, GradeData, HomeworkData, LessonData, ComunicationData, ScheduleHour, MaterialData };
export const defaultData = {
    userSettings: defaultUserSettings,
    userData: defaultUserData,
    classData: defaultClassData,
    userInfo: defaultUserInfo,
    subjectData: defaultSubjectData,
    gradeData: defaultGradeData,
    homeworkData: defaultHomeworkData,
    lessonData: defaultLessonData,
    comunicationData: defaultComunicationData,
    materialData: defaultMaterialData,
    scheduleHour: defaultScheduleHour,
}