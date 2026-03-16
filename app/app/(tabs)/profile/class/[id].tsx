import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { Icon, Link, Stack, useFocusEffect } from "expo-router";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import DashboardItem from "@/components/dashboardItem";
import { useAppDataSync, DataManager, ClassData, UserInfo, useDBitem, SubjectData } from "@/data/datamanager";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButtons from "@/components/actionButtons";
import i18n from "@/constants/i18n";
import { useCallback } from "react";
import { useUserData } from "@/data/UserDataContext";

function AllClassList() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default, {populate: ["classes"]});
    
    if (userData.data.classes.length === 1 && userData.data.settings.activeClassId != (userData.data.classes[0]._id ?? userData.data.classes[0])) {
        userData.save({...userData.data, settings: {...userData.data.settings,
            activeClassId: (userData.data.classes[0]._id ?? userData.data.classes[0])
        }});
    }

    useFocusEffect(
        useCallback(() => {
            const reload = async () => {
                await Promise.all([userData.load()]);
            };
            reload();
        }, [])
    );

    let classes = userData.data.classes.map((cls: ClassData) => ((typeof cls === "object" ? {
        title: cls.name,
        description: cls.notes.slice(0, 2).join("\n"),
        badge: (cls._id === userData.data.settings.activeClassId ? {
            text: i18n.t("profile.class.active.badge.title"),
            color: "#0A84FF"
        } : null),
        onPress: () => {
            router.push(`/profile/class/${cls._id}`);
        }
    } : null)));

    let activeClassIndex = classes.findIndex((cls: ClassData) => cls._id === userData.data.settings.activeClassId);

    if (activeClassIndex > 0) {
        const [item] = classes.splice(activeClassIndex, 1);
        classes.unshift(item);
    }

    return userData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <DashboardItem title={i18n.t("profile.class.header.title")} items={classes} />
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("profile.class.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push(`/modal/class/create`);
                    },
                    display: userData.data.userInfo.role != "student",
                },
                {
                    title: i18n.t("profile.class.join.title"),
                    iconName: "log-in",
                    onPress: () => {
                        router.push(`/modal/invitation/enter`);
                    },
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
    );
}

function Class(props: { classId: string }) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const classId = props.classId;

    const userData = useUserData();
    let activeClass = userData.loading === false ? userData.data.settings.activeClassId : 0;
    let isActiveClass = activeClass === classId;

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });

    useFocusEffect(
        useCallback(() => {
            const reload = async () => {
                await Promise.all([userData.load()]);
                await Promise.all([classData.load()]);
            };
            reload();
        }, [])
    );

    return classData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
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
                    {classData.data.teachers.some((teacher: UserInfo) => teacher.userid === userData.data.userInfo.userid) && (
                        <Link href={{ pathname: "/modal/invitation/create" as any, params: { for: "class", targetid: classId, name: classData.data.name }}} style={{...commonStyle.button}}>
                            {userData.loading ? <ActivityIndicator size="small" color={theme.text} /> : (
                                <View style={commonStyle.listUserElement}>
                                    <Ionicons style={commonStyle.listUserElementIcon} name="person-add" size={30} color={theme.text} key="icon" />
                                    <Text style={[commonStyle.text, commonStyle.listUserElementText, { fontWeight: "normal"}]}>{i18n.t("profile.class.invite.text")}</Text>
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
                        {classData.data.teachers.length === 0 && <Text style={commonStyle.text}>{i18n.t("profile.class.users.teachers.noteachers.text")}</Text>}
                        {classData.data.teachers.map((teacher: UserInfo) => (
                            <View key={teacher.userid} style={commonStyle.listUserElement}>
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
                        {classData.data.students.length === 0 && <Text style={commonStyle.text}>{i18n.t("profile.class.users.students.nostudents.text")}</Text>}
                        {classData.data.students.map((student: UserInfo) => (
                            <View key={student.userid} style={commonStyle.listUserElement}>
                                <Ionicons style={commonStyle.listUserElementIcon} name="person" size={30} color={theme.text} />
                                <Text style={{...commonStyle.text, ...commonStyle.listUserElementText}}>{student.name} {student.surname}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}

function AllClassSubjects() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const classId = params.id as string;

    const userData = useUserData();
    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        populate: ["subjects"],
        classid: classId
    });

    useFocusEffect(
        useCallback(() => {
            const reload = async () => {
                await Promise.all([userData.load()]);
                await Promise.all([classData.load()]);
            };
            reload();
        }, [])
    );

    let subjects = classData.loading === false ? classData.data.subjects.map((subject: SubjectData) => {
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
    }) : [];

    return (classData.loading || userData.loading) ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <DashboardItem title={i18n.t("profile.class.subjects.all.header.title", {class: classData.data.name})} items={subjects} />
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("profile.class.subjects.all.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/subject/create` as any, params: { classid: classId }});
                    },
                    display: classData.data.teachers.some((teacher: UserInfo) => teacher.userid === userData.data.userInfo.userid),
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
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