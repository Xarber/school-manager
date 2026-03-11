import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from 'react';
import Constants from "expo-constants";

export const env = Constants.executionEnvironment;
export const isProductionBinary = env === "standalone"; // release build created with/without EAS Build
export const isStoreClient = env === "storeClient";     // Expo Go OR a dev build using expo-dev-client

// Expo Go specific: expoVersion is the Expo Go version string when running in Expo Go
export const isExpoGo = isStoreClient && !!Constants.expoVersion;
export const isDevClient = isStoreClient && !Constants.expoVersion;

export const isOnline = NetInfo.fetch().then(state => (state.isInternetReachable || state.isConnected));
export const connectionMode = NetInfo.fetch().then(state => state.type);

const defaultIndexData = {
    accountId: "" as string,
    debugId: "" as string,
    userInfoId: "" as string,
    userDataId: "" as string,
};
export type IndexData = typeof defaultIndexData;

const defaultOutboxData = [{
    keys: {
        app: "" as string,
        db: "" as string,
        method: "" as "GET" | "POST",
        token: "" as string,
        body: undefined as Object | undefined
    },
    data: {} as any,
    addedAt: "" as string | undefined,
    editedAt: 0 as number
}];
export type OutboxData = typeof defaultOutboxData;

const defaultAccountData = {
    _id: "" as string,
    userid: "" as string,
    userData: "" as string, // _id rel
    userDebug: "" as string, // _id rel
    token: "" as string,
    pushToken: null as string | null,
    locked: false as boolean,
    active: false as boolean,
    addedAt: "" as string,
    editedAt: 0 as number
};
export type AccountData = typeof defaultAccountData;

const defaultDebugData = {
    _id: "" as string,
    userid: "" as string,
    firstLaunch: false as boolean,
    firstLaunchDate: "" as string,
    lastLaunchDate: "" as string,
    launchCount: 0 as number,
    appVersion: "" as string,
    errorLogs: [] as string[],
    performanceMetrics: [] as any[],
    addedAt: "" as string,
    editedAt: 0 as number
};
export type DebugData = typeof defaultDebugData;

const defaultUserInfo = {
    _id: "" as string,
    userid: "" as string,
    name: '' as string,
    surname: '' as string,
    email: '' as string,
    role: 'student' as 'student' | 'teacher',
    addedAt: '' as string,
    editedAt: 0 as number
};
export type UserInfo = typeof defaultUserInfo;

const defaultUserSettings = {
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: false as boolean,
    language: 'en' as string,
    activeClassId: '' as string,
    calendarSync: {
        enabled: false as boolean,
        homework: false as boolean,
        schedule: false as boolean,
        comunications: false as boolean,
        exams: false as boolean,
    },
};
export type UserSettings = typeof defaultUserSettings;

const defaultUserData = {
    _id: "" as string,
    userid: "" as string,
    name: "User" as string,
    birthday: "" as string,
    userInfo: "" as string, // _id rel
    settings: defaultUserSettings as UserSettings,
    classes: [] as string[], // _id rel
    grades: [] as string[], // _id rel
    completedhomework: [] as string[], // _id rel
    addedAt: "" as string,
    editedAt: 0 as number
};
export type UserData = typeof defaultUserData;

const defaultClassData = {
    _id: "" as string,
    name: '' as string,
    teachers: [] as string[], // _id rel
    students: [] as string[], // _id rel
    schedule: [] as WeekSchedule[],
    comunications: [] as string[], // _id rel
    materials: [] as string[], // _id rel
    homework: [] as string[], // _id rel
    lessons: [] as string[], // _id rel
    subjects: [] as string[], // _id rel
    notes: [] as string[],
    addedAt: '' as string,
    editedAt: 0 as number
};
export type ClassData = typeof defaultClassData;

const defaultScheduleHour = {
    subject: '' as string, // _id rel
    startTime: '' as string,
    endTime: '' as string
};
export type ScheduleHour = typeof defaultScheduleHour;

const defaultWeekSchedule = {
    day: 'Monday' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
    hours: [] as ScheduleHour[],
    addedAt: '' as string,
    editedAt: 0 as number
};
export type WeekSchedule = typeof defaultWeekSchedule;

const defaultSubjectData = {
    _id: "" as string,
    name: '' as string,
    teacher: [] as string[], // _id rel
    maxgrade: 100 as number,
    gradeType: 'percentage' as 'letter' | 'percentage' | 'points',
    homework: [] as string[], // _id rel
    lessons: [] as string[], // _id rel
    material: [] as string[], // _id rel
    addedAt: '' as string,
    editedAt: 0 as number
};
export type SubjectData = typeof defaultSubjectData;

const defaultGradeData = {
    _id: "" as string,
    class: "" as string, // _id rel
    subject: "" as string, // _id rel
    homework: undefined as string | undefined, // _id rel
    title: '' as string,
    type: 'other' as 'oral' | 'written' | 'homework' | 'project' | 'other',
    grade: 0 as number,
    gradeTitle: undefined as string | undefined,
    addedAt: '' as string,
    editedAt: 0 as number
};
export type GradeData = typeof defaultGradeData;

const defaultMaterialData = {
    _id: "" as string,
    title: '' as string,
    description: '' as string,
    type: 'file' as 'file' | 'link',
    url: '' as string,
    addedAt: '' as string,
    editedAt: 0 as number
};
export type MaterialData = typeof defaultMaterialData;

const defaultHomeworkData = {
    _id: "" as string,
    title: '' as string,
    description: '' as string,
    points: 0 as number | undefined,
    material: [] as string[], // _id rel
    dueDate: '' as string,
    addedAt: '' as string,
    editedAt: 0 as number
};
export type HomeworkData = typeof defaultHomeworkData;

const defaultLessonData = {
    _id: "" as string,
    title: '' as string,
    description: '' as string,
    date: '' as string,
    time: '' as string,
    teacher: "" as string, // _id rel
    room: '' as string | undefined,
    material: [] as string[], // _id rel
    scheduled: false as boolean,
    isExam: false as boolean,
    addedAt: '' as string,
    editedAt: 0 as number
};
export type LessonData = typeof defaultLessonData;

const defaultComunicationData = {
    _id: "" as string,
    title: '' as string,
    content: '' as string,
    date: undefined as string | undefined,
    time: undefined as string | undefined,
    urgency: 'low' as 'low' | 'medium' | 'high',
    requiresConfirmation: false as boolean,
    sender: "" as string, // _id rel
    addedAt: '' as string,
    editedAt: 0 as number
};
export type ComunicationData = typeof defaultComunicationData;

const defaultSchoolData = {
    _id: "" as string,
    name: '' as string,
    address: '' as string,
    city: '' as string,
    country: '' as string,
    website: '' as string | undefined,
    istitutionalEmailDomain: '' as string,

    facebook: '' as string | undefined,
    instagram: '' as string | undefined,
    linkedin: '' as string | undefined,
    twitter: '' as string | undefined,
    youtube: '' as string | undefined,
    about: '' as string | undefined,
    banner: '' as string | undefined,

    comunications: [] as string[], // _id rel
    classes: [] as string[], // _id rel
    students: [] as string[], // _id rel
    teachers: [] as string[], // _id rel
    admins: [] as string[], // _id rel

    addedAt: '' as string,
    editedAt: 0 as number
};
export type SchoolData = typeof defaultSchoolData;

const defaultInvitationData = {
    _id: "" as string,
    author: "" as string, // _id rel
    targetid: "" as string, // _id rel
    for: "class" as "class" | "school",
    joinAs: "student" as "student" | "teacher",
    maxUsage: -1 as number,
    used: 0 as number,
    addedAt: '' as string,
}
export type InvitationData = typeof defaultInvitationData;

const defaultReadInvitationData = {
    _id: "" as string,
    for: "class" as "class" | "school",
    name: '' as string,
    notes: [] as string[],
    teachers: [] as UserInfo[],
    students: 0 as number,
    author: {
        name: '' as string,
        surname: '' as string
    }
}
export type ReadInvitationData = typeof defaultReadInvitationData;

export function useAppDataSync(dbkey: string | null, appkey: string | null, defaultValue: any, body: Object = {}) {
    const [data, setData]: any = useState(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        const userToken = JSON.parse((await AsyncStorage.getItem(DataManager.accountData.app)) ?? "{}").token;
        let loadDebug = {
            mode: "pending",
            operation: "load",
            key: [dbkey, appkey]
        }
        try {
            setLoading(true);
            const localstored = appkey ? (await AsyncStorage.getItem(appkey)) : null;
            const netState = await NetInfo.fetch();
            if (dbkey != null && !!userToken && (netState.isInternetReachable || netState.isConnected)) {
                loadDebug.mode = "database";
                const stored = await fetch(DataManager.db.connect + dbkey + DataManager.db.get, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify(body)
                })
                .then(async response => {
                    let responseData = await response.json() as any;
                    if (response.ok) return responseData;
                    else throw new Error(responseData.error || response.statusText);
                });
                if (appkey) await AsyncStorage.setItem(appkey, JSON.stringify(stored.data));
                setData(stored.data);
                return stored.data;
            } else {
                loadDebug.mode = "local";
                let outputData = localstored ? (JSON.parse(localstored) as any) : { ...defaultValue, _loaded: false };
                setData(outputData);
                return outputData;
            }
        } catch (err) {
            console.error(err);
            loadDebug.mode = "failed";
            setError(err instanceof Error ? err.message : 'Load failed');
            let outputData = { ...defaultValue, _loaded: false }
            setData(outputData);
            return outputData;
        } finally {
            //console.log(loadDebug);
            setLoading(false);
        }
    };

    const save = async (newValue: Object) => {
        const userToken = JSON.parse((await AsyncStorage.getItem(DataManager.accountData.app)) ?? "{}").token;
        (newValue as any).editedAt = Date.now();
        let loadDebug = {
            mode: "pending",
            operation: "save",
            key: [dbkey, appkey]
        }
        try {
            let updated = { data: newValue };
            const netState = await NetInfo.fetch();
            if (dbkey != null && !!userToken && (netState.isInternetReachable || netState.isConnected)) {
                loadDebug.mode = "database";
                const response = await fetch(DataManager.db.connect + dbkey + DataManager.db.update, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({...body, ...newValue})
                })
                .then(async response => {
                    let responseData = await response.json() as any;
                    //console.log(response, responseData);
                    if (response.ok) return responseData;
                    else throw new Error(responseData.error || response.statusText);
                });
                //console.log(response, dbkey + DataManager.db.update, newValue);
                if (!response.success) throw new Error(response.error || response.message || 'Save failed');
            } else if (dbkey != null && !!userToken) {
                // Save operation to outbox
                loadDebug.mode = "outbox";
                let outbox = JSON.parse((await AsyncStorage.getItem(DataManager.outbox.app)) ?? "[]");
                let outboxData = {
                    keys: {
                        app: appkey,
                        db: dbkey,
                        method: "POST",
                        token: userToken,
                        body: body
                    },
                    data: { data: newValue },
                    addedAt: new Date().toISOString(),
                    editedAt: Date.now()
                } as OutboxData[0];
                outbox.push(outboxData);
                await AsyncStorage.setItem(DataManager.outbox.app, JSON.stringify(outbox));
            } else {
                loadDebug.mode = "local";
            }
            if (appkey) await AsyncStorage.setItem(appkey, JSON.stringify(updated.data));
            setData(updated.data);
            return updated.data;
        } catch (err) {
            console.error(err);
            loadDebug.mode = "failed";
            setError('Save failed');
            return data;
        } finally {
            //console.log(loadDebug);
        }
    };

    const remove = async () => {
        try {
            if (appkey) await AsyncStorage.removeItem(appkey);
            setData(defaultValue);
            return true;
        } catch (err) {
            setError('Clear failed');
            return false;
        }
    }

    const clear = async () => {
        try {
            await AsyncStorage.clear();
            setData(defaultValue);
            return true;
        } catch (err) {
            setError('Clear failed');
            return false;
        }
    }

    useEffect(() => {
        load();
    }, [appkey]);

    return { data, loading, error, load, save, remove, clear };
}

export function useDBitem(dbkey: string, body: Object = {}) {
    const [data, setData]: any = useState({ _id: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const create = async (itemdata: Object) => {
        setLoading(true);
        const userToken = JSON.parse((await AsyncStorage.getItem(DataManager.accountData.app)) ?? "").token;
        let loadDebug = {
            mode: "pending",
            operation: "create",
            key: [dbkey]
        }
        try {
            const netState = await NetInfo.fetch();
            if (!!userToken && (netState.isInternetReachable || netState.isConnected)) {
                loadDebug.mode = "database";
                const response = await fetch(DataManager.db.connect + dbkey + DataManager.db.create, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({...body, ...itemdata})
                })
                .then(async response => {
                    let responseData = await response.json() as any;
                    if (response.ok) return responseData;
                    else throw new Error(responseData.error || response.statusText);
                });
                if (response.success) setData(response.data);
                else throw new Error(response.error || response.message || 'Create failed');
                return response.data;
            } else {
                loadDebug.mode = "no-token";
                throw new Error('Create failed: ' + ((!!userToken) ? 'Offline' : 'No token'));
            }
        } catch (err) {
            console.error(err);
            loadDebug.mode = "failed";
            setError(err instanceof Error ? err.message : 'Create failed');
            setData({});
            return {};
        } finally {
            //console.log(loadDebug);
            setLoading(false);
        }
    };

    const remove = async () => {
        setLoading(true);
        const userToken = JSON.parse((await AsyncStorage.getItem(DataManager.accountData.app)) ?? "").token;
        let loadDebug = {
            mode: "pending",
            operation: "remove",
            key: [dbkey]
        }
        try {
            const netState = await NetInfo.fetch();
            if (!!userToken && (netState.isInternetReachable || netState.isConnected)) {
                loadDebug.mode = "database";
                const response = await fetch(DataManager.db.connect + dbkey + DataManager.db.delete, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({ ...body, _id: data._id })
                })
                .then(async response => {
                    let responseData = await response.json() as any;
                    if (response.ok) return responseData;
                    else throw new Error(responseData.error || response.statusText);
                });
                if (response.success) setData({ _id: null });
                else throw new Error(response.error || response.message || 'Delete failed');
                return { _id: null };
            } else {
                loadDebug.mode = "no-token";
                throw new Error('Delete failed: ' + ((!!userToken) ? 'Offline' : 'No token'));
            }
        } catch (err) {
            console.error(err);
            loadDebug.mode = "failed";
            setError(err instanceof Error ? err.message : 'Delete failed');
            return false;
        } finally {
            //console.log(loadDebug);
            setLoading(false);
        }
    };

    return { data, loading, error, create, remove };
}

console.log(`\n[DATAMANAGER]\nRunning in ${env} mode;\nisProductionBinary: ${isProductionBinary};\nisStoreClient: ${isStoreClient};\nisExpoGo: ${isExpoGo};\nisDevClient: ${isDevClient}\nUsing local DB: ${(__DEV__ && !isProductionBinary) ? "true" : "false"}\n`);
export const DataManager = {
    db: {
        connect: (__DEV__ && !isProductionBinary) ? "http://127.0.0.1:3000" : 'https://schoolmanager-api.xcenter.it',
        update: "/update",
        create: "/add",
        delete: "/delete",
        get: "/get",
        me: "/me",

        authenticate: "/api/auth/send",
        authenticateOtp: "/api/auth/verify",
    },
    outbox: {
        app: "@app:outbox",
        db: null,
        default: defaultOutboxData
    },
    index: {
        app: "@app:idIndex",
        db: null,
        default: defaultIndexData
    },
    accountData: {
        app: "@app:accountData",
        db: null,
        default: defaultAccountData
    },
    debugData: {
        app: "@app:debugData",
        db: "/api/debug",
        default: defaultDebugData
    },
    userInfo: {
        app: null,
        db: null,
        default: defaultUserInfo
    },
    userSettings: {
        app: null,
        db: null,
        default: defaultUserSettings
    },
    userData: {
        app: "@app:userData",
        db: "/api/account",
        default: defaultUserData
    },
    classData: {
        app: "@app:classData",
        db: "/api/classes",
        default: defaultClassData
    },
    hourSchedule: {
        app: null,
        db: null,
        default: defaultScheduleHour
    },
    weekSchedule: {
        app: null,
        db: null,
        default: defaultWeekSchedule
    },
    subjectData: {
        app: "@app:subjectData",
        db: "/api/classes/subjects",
        default: defaultSubjectData
    },
    gradeData: {
        app: "@app:gradeData",
        db: "/api/classes/grades",
        default: defaultGradeData
    },
    materialData: {
        app: "@app:materialData",
        db: "/api/classes/materials",
        default: defaultMaterialData
    },
    homeworkData: {
        app: "@app:homeworkData",
        db: "/api/classes/homework",
        default: defaultHomeworkData
    },
    lessonData: {
        app: "@app:lessonData",
        db: "/api/classes/lessons",
        default: defaultLessonData
    },
    comunicationData: {
        app: "@app:comunicationData",
        db: "/api/classes/comunications",
        default: defaultComunicationData
    },
    invitation: {
        app: null,
        db: "/api/invitation",
        default: defaultReadInvitationData
    },
    school: {
        app: "@app:school",
        db: "/api/school",
        default: defaultSchoolData
    }
}