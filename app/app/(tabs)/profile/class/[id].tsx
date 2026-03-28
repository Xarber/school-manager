import ActionButtons from "@/components/actionButtons";
import DashboardItem, { getTextColor } from "@/components/dashboardItem";
import LabsScreen from "@/components/LabsScreen";
import i18n from "@/constants/i18n";
import { useNetworkContext } from "@/constants/NetworkContext";
import createStyling, { defaultScreenSizes } from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { useAccountData } from "@/data/AccountDataContext";
import { ClassData, DataLoader, DataManager, SubjectData, useAppDataSync, UserInfo } from "@/data/datamanager";
import { devMode } from "@/data/devMode";
import { useUserData } from "@/data/UserDataContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AllClassList() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const [classMap, setClassMap] = useState(({} as {[key: string]: ClassData}));
    const network = useNetworkContext();

    const insets = useSafeAreaInsets();
    if (insets.bottom == 0) insets.bottom = 20;

    const userData = useUserData();
    const accountData = useAccountData();
    
    if (userData.data.classes.length === 1 && userData.data.settings.activeClassId != (userData.data.classes[0]._id ?? userData.data.classes[0])) {
        userData.save({...userData.data, settings: {...userData.data.settings,
            activeClassId: (userData.data.classes[0]._id ?? userData.data.classes[0])
        }});
    }

    const classIds = userData.data.classes;

    const reload = async () => {
        setRefreshing(true);
        await Promise.all([userData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    let classes = (Object.values(classMap) as ClassData[])
    .filter((cls: ClassData) => typeof cls === "object" && cls)
    .map((cls: ClassData) => {
        return ({
            _id: cls._id,
            title: cls.name,
            description: cls.notes.slice(0, 2).join("\n"),
            badge: (cls._id === userData.data.settings.activeClassId ? {
                text: i18n.t("profile.class.active.badge.title"),
                color: "#0A84FF"
            } : null),
            onPress: () => {
                router.push(`/profile/class/${cls._id}`);
            }
        })
    });

    let unloadedClasses = (classIds as string[])
    .filter((cls: any) => typeof classMap[cls] === "undefined")
    .map((cls: any) => {
        return ({
            _id: cls,
            title: `${i18n.t("components.unloaded.class.title")}`,
            description: `${i18n.t("components.unloaded.class.description")}`,
            badge: null,
            onPress: () => {}
        })
    });

    classes.push({
        _id: DataManager.classData.offline,
        title: i18n.t("profile.class.offlineclass.name"),
        description: i18n.t("profile.class.offlineclass.description"),
        badge: (DataManager.classData.offline === userData.data.settings.activeClassId ? {
            text: i18n.t("profile.class.active.badge.title"),
            color: "#0A84FF"
        } : null),
        onPress: () => {
            router.push(`/profile/class/${DataManager.classData.offline}`);
        }
    });

    classes = [...classes, ...unloadedClasses];

    let activeClassIndex = classes.findIndex((cls) => cls._id === userData.data.settings.activeClassId);

    if (activeClassIndex > 0) {
        const [item] = classes.splice(activeClassIndex, 1);
        classes.unshift(item);
    }

    return (
        <>
            {classIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.classData}
                        body={{ classid: id }}
                        onLoad={(id, classdata) =>
                            setClassMap(prev => {
                                if (prev[id]?._id === classdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: classdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {(userData.loading && !refreshing) ? 
            (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" color={theme.text} />
                </View>
            ) : (
                <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                    {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                        <Ionicons name="school" size={40} color={theme.text} />
                        <Text style={commonStyle.headerText}>{i18n.t("profile.class.header.title")}</Text>
                        <Text style={commonStyle.text}>{i18n.t("profile.class.header.description")}</Text>
                    </View>}
                    <View style={optimizationStyle.item}>
                        <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }} refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                        }>
                            <DashboardItem title={i18n.t("profile.class.header.title")} items={classes as any} />
                        </ScrollView>
                    </View>
                    <ActionButtons items={[
                        {
                            title: i18n.t("profile.class.create.title"),
                            iconName: "add",
                            styles: !network.serverReachable ? { backgroundColor: theme.disabled } : null,
                            enabled: network.serverReachable === true,
                            buffering: !network.ready,
                            onPress: () => {
                                router.push(`/modal/class/create`);
                            },
                            display: (userData.data.userInfo.role != "student" && accountData.data.active),
                        },
                        {
                            title: i18n.t("profile.class.join.title"),
                            iconName: "log-in",
                            styles: !network.serverReachable ? { backgroundColor: theme.disabled } : null,
                            enabled: network.serverReachable === true,
                            buffering: !network.ready,
                            onPress: () => {
                                router.push(`/modal/invitation/enter`);
                            },
                            display: (accountData.data.active)
                        }
                    ]} align="right" itemStyles={{ borderRadius: 360 }} />
                </View>
            )}
        </>
    );
}

function Class(props: { classId: string }) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const classId = props.classId;
    const network = useNetworkContext();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const userData = useUserData();
    const accountData = useAccountData();
    let activeClass = userData.loading === false ? userData.data.settings.activeClassId : 0;
    let isActiveClass = activeClass === classId;

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });

    const reload = async () => {
        setRefreshing(true);
        await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            //reload();
        }, [])
    );

    return (userData.loading || classData.loading && !refreshing) ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    ) : (
        <View style={[optimizationStyle.container, { flex: 1 }]}>
            <Stack.Screen options={{ headerTitle: classData.data.name }} />
            {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                <Ionicons name="school" size={40} color={theme.text} />
                <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                <Text style={commonStyle.text}>{i18n.t("profile.class.header.classdescription")}</Text>
            </View>}
            <View style={optimizationStyle.item}>
                <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                }>
                    <View style={commonStyle.dashboardSection}>
                        {/* CLASS INFO */}
                        <View style={{...commonStyle.card, gap: 10}}>
                            <View>
                                <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                                <Text style={commonStyle.text}>{classData.data.notes.join("\n")}</Text>
                            </View>
                            <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                <TouchableOpacity disabled={userData.loading} onPress={() => {
                                    userData.save({...userData.data, settings: {...userData.data.settings, activeClassId: classId}});
                                }} style={{...commonStyle.button, flexGrow: 1, backgroundColor: isActiveClass ? "#7d7d7d7d" : theme.primary}}>
                                    {userData.loading ? <ActivityIndicator size="small" color={theme.text} /> : <Text style={commonStyle.buttonText}>{isActiveClass ? i18n.t("profile.class.active.title") : i18n.t("profile.class.active.set.title")}</Text>}
                                </TouchableOpacity>
                                {(accountData.data.active) && classData.data.teachers.some((teacher: UserInfo) => teacher._id === userData.data.userInfo._id) && (network.serverReachable === true) && (
                                    <Link href={{ pathname: "/modal/invitation/create" as any, params: { for: "class", targetid: classId, name: classData.data.name }}} style={{...commonStyle.button}}>
                                        {(userData.loading) ? <ActivityIndicator size="small" color={theme.text} /> : (
                                            <View style={commonStyle.listUserElement}>
                                                <Ionicons style={[commonStyle.listUserElementIcon, { color: getTextColor(commonStyle.button.backgroundColor) }]} name="person-add" size={30} color={getTextColor(commonStyle.button.backgroundColor)} key="icon" />
                                                <Text style={[commonStyle.text, commonStyle.listUserElementText, { fontWeight: "normal", color: getTextColor(commonStyle.button.backgroundColor) }]}>{i18n.t("profile.class.invite.text")}</Text>
                                            </View>
                                        )}
                                    </Link>
                                )}
                            </View>
                        </View>
                        {/* CLASS SUBJECTS */}
                        <View style={{...commonStyle.card, gap: 10}}>
                            <DashboardItem title={i18n.t("profile.class.subjects.header.title")} items={[]} collapsed={true} expand={()=>{
                                router.push({ pathname: `/profile/class/${classId}` as any, params: { page: "subjects" } });
                            }} />
                        </View>
                        {/* CLASS USERS */}
                        <View style={{gap: 10}}>
                            {/* CLASS TEACHERS */}
                            <View style={{...commonStyle.card, gap: 10}}>
                                <Text style={commonStyle.headerText}>{i18n.t("profile.class.users.teachers.title")}</Text>
                                <View style={{...commonStyle.card, gap: 10}}>
                                    {classData.data.teachers.length === 0 && <Text key={"noteachers"} style={commonStyle.text}>{i18n.t("profile.class.users.teachers.noteachers.text")}</Text>}
                                    {classData.data.teachers.map((teacher: UserInfo) => (
                                        <View key={teacher._id} style={commonStyle.listUserElement}>
                                            <Ionicons style={commonStyle.listUserElementIcon} name="id-card" size={30} color={theme.text} />
                                            <Text style={{...commonStyle.text, ...commonStyle.listUserElementText}}>{teacher.name} {teacher.surname}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            {/* CLASS STUDENTS */}
                            <View style={{...commonStyle.card, gap: 10}}>
                                <Text style={commonStyle.headerText}>{i18n.t("profile.class.users.students.title")}</Text>
                                <View style={{...commonStyle.card, gap: 10}}>
                                    {classData.data.students.length === 0 && <Text key={"nostudents"} style={commonStyle.text}>{i18n.t("profile.class.users.students.nostudents.text")}</Text>}
                                    {classData.data.students.map((student: UserInfo) => (
                                        <View key={student._id} style={commonStyle.listUserElement}>
                                            <Ionicons style={commonStyle.listUserElementIcon} name="person" size={30} color={theme.text} />
                                            <Text style={{...commonStyle.text, ...commonStyle.listUserElementText}}>{student.name} {student.surname}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

function AllClassSubjects() {
    const theme = useTheme();
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const params = useLocalSearchParams();
    const classId = params.id as string;
    const network = useNetworkContext();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const userData = useUserData();
    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });
    let subjectIds = classData.data.subjects;

    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    let unloadedSubjects = (subjectIds as string[])
    .filter((sbj: any) => typeof subjectMap[sbj] === "undefined")
    .map((sbj: any) => {
        return ({
            _id: sbj,
            title: `${i18n.t("components.unloaded.subject.title")}`,
            description: `${i18n.t("components.unloaded.subject.description")}`,
            badge: null,
            onPress: () => {}
        })
    });

    const reload = async () => {
        setRefreshing(true);
        await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            //reload();
        }, [])
    );

    if (classId === DataManager.classData.offline && !devMode) {
        return <LabsScreen />;
    }

    let subjectItems = subjects.map((subject: SubjectData) => {
        let subjectTeachers = [];

        for (let teacher of subject.teacher) {
            // classData.data.teachers where {_id: teacher}
            let teacherData = classData.data.teachers.find((teacherData: UserInfo) => teacherData._id === teacher);

            if (teacherData) {
                subjectTeachers.push(teacherData);
            }
        }

        return {
            title: subject.name,
            description: i18n.t("profile.class.subjects.teachers.list.text", {teachers: subjectTeachers.map((teacher: UserInfo) => teacher.name + " " + teacher.surname).join(", ")}),
            onPress: () => {

            }
        }
    });

    subjectItems = [...subjectItems, ...unloadedSubjects];

    return (
        <>
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
            {((classData.loading || userData.loading) && !refreshing) ? 
            (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" color={theme.text} />
                </View>
            ) : (
                <>
                    <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                        <Stack.Screen options={{ headerTitle: i18n.t("profile.class.subjects.all.header.title", {class: ""}).trim() }} />
                        {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                            <Ionicons name="school" size={40} color={theme.text} />
                            <Text style={commonStyle.headerText}>{i18n.t("profile.class.subjects.all.header.title", {class: ""}).trim()}</Text>
                            <Text style={commonStyle.text}>{i18n.t("profile.class.subjects.all.header.description")}</Text>
                        </View>}
                        <View style={optimizationStyle.item}>
                            <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: safeAreaInsets.bottom + 70}} refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                            }>
                                <DashboardItem title={i18n.t("profile.class.subjects.all.header.title", {class: classData.data.name})} items={subjectItems} />
                            </ScrollView>
                        </View>
                    </View>
                    <ActionButtons items={[
                        {
                            title: i18n.t("profile.class.subjects.all.create.title"),
                            iconName: "add",
                            styles: (!network.serverReachable && classId != DataManager.classData.offline) ? { backgroundColor: theme.disabled } : null,
                            enabled: (network.serverReachable === true || classId === DataManager.classData.offline),
                            buffering: !network.ready,
                            onPress: () => {
                                router.push({pathname: `/modal/subject/create` as any, params: { classid: classId }});
                            },
                            display: classData.data.teachers.some((teacher: UserInfo) => teacher._id === userData.data.userInfo._id),
                        }
                    ]} align="right" itemStyles={{ borderRadius: 360 }} />
                </>
            )}
        </>
    );
}

export default function ClassTab() {
    const params = useLocalSearchParams();
    const classId = params.id as string;
    const page = params.page as string;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    if (classId === "all") return <AllClassList />;

    switch (page) {
        case "subjects":
            return <AllClassSubjects />;
        default:
            return <Class classId={classId} />
    }
}