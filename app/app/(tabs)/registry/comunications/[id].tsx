import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo, UserData } from '@/data/datamanager';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ComunicationTab({classid, comunicationid}: {classid: string, comunicationid: string}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const id = comunicationid;
    const [reply, setReply] = useState("");

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid,
        populate: ["comunications"]
    });

    let comunication = classData.loading ? null : classData.data.comunications.find((e: ComunicationData) => e._id === id);

    return classData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    ) : !!comunication ? (
        <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <Stack.Screen options={{ headerTitle: comunication.title }} />
            <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
                <Text style={commonStyle.headerText}>{comunication.title}</Text>
                <View style={[commonStyle.card]}>
                    <Text style={[commonStyle.text, { fontSize: 15 }]}>{comunication.content}</Text>
                </View>
                {comunication.requiresConfirmation == true && (
                    <View>
                        {(comunication.confirmationType ?? "accept") === "accept" && (
                            <ActionButtons containerStyles={{
                                position: undefined,
                                bottom: undefined
                            }} itemStyles={{borderRadius: 360}} items={[
                                {
                                    title: i18n.t("registry.comunications.reply.accept"),
                                    styles: {
                                        backgroundColor: theme.primary
                                    },
                                    iconName: "checkmark",
                                    onPress: () => {

                                    }
                                }, {
                                    title: i18n.t("registry.comunications.reply.reject"),
                                    styles: {
                                        backgroundColor: theme.caution
                                    },
                                    iconName: "ban",
                                    onPress: () => {

                                    }
                                }
                            ]} />
                        )}
                        {(comunication.confirmationType ?? "accept") === "message" && (
                            <View style={[modalStyle.cardEdit]}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("registry.comunications.reply.message")}</Text>
                                    <TextInput maxLength={300} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("registry.comunications.reply.messagePlaceholder")} value={reply} onChangeText={text => setReply(text)}/>
                                </View>
                                <TouchableOpacity style={commonStyle.wideButton} onPress={() => {

                                }}>
                                    <Text style={commonStyle.buttonText}>{i18n.t("registry.comunications.reply.send")}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.notfound.text")}</Text>
        </View>
    )
}

function AllComunications({classid, userData}: {classid: string, userData: UserData}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid,
        populate: ["comunications"]
    });

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    let comunications: ComunicationData[] = classData.data.comunications;

    return (classData.loading && !refreshing) ? ( 
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    ) : (classid == "") ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.noclass.text")}</Text>
            </View>
        ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
            }>
                <Text style={commonStyle.headerText}>{i18n.t("registry.comunications.header.text", {class: classData.data.name})}</Text>
                <View>
                    <DashboardItem title={""} items={comunications.map((e: ComunicationData) => {
                        let description = `${e.content.split("\n").slice(0, 2).join("\n")}`;
                        if (description.length > 100) description = description.slice(0, 100) + "...";
                        return {
                            title: e.title,
                            description,
                            onPress: () => {
                                router.push({pathname: `/(tabs)/registry/comunications/${e._id}` as any, params: {classid: classid}});
                            }
                        }
                    })} noItemsText={i18n.t("registry.comunications.warn.nocomunications.text")} />
                </View>
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("registry.comunications.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/comunication/create` as any, params: {classid: classid}});
                    },
                    display: classData.data.teachers.find((e: UserInfo) => e._id === (userData as any).userInfo._id) ? true : false
                }
            ]} align="right" itemStyles={{ borderRadius: 360 }} />
        </View>
    );
}

export default function ComunicationsTab() {
    const params = useLocalSearchParams();
    const id = params.id;
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    const userData = useUserData();
    const activeClassId = userData.data.settings.activeClassId;

    if (userData.loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    );

    switch (id) {
        case 'all': 
            return <AllComunications classid={activeClassId} userData={userData.data} />;
        default:
            return <View style={[commonStyle.dashboardSection, { flex: 1 }]}><ComunicationTab classid={activeClassId} comunicationid={id as string}/></View>
    }
}