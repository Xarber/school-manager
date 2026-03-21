import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo, UserData, useDBitem } from '@/data/datamanager';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function ComunicationTab({classid, comunicationid}: {classid: string, comunicationid: string}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const id = comunicationid;
    const [reply, setReply] = useState("");
    const [accept, setAccept] = useState(false);
    const [responseSent, setResponseSent] = useState(false);
    const userData = useUserData();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;
    const comunicationResponse = useDBitem(DataManager.comunicationResponseData.db);

    const comunicationData = useAppDataSync(DataManager.comunicationData.db, `${DataManager.comunicationData.app}:${classid}`, [DataManager.comunicationData.default], {
        classid: classid
    });

    if (comunicationData.loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="small" color={theme.text} />
            </View>
        );
    }

    let comunication = comunicationData.data.find((e: ComunicationData) => e._id === id);

    let userResponse = comunication?.responses ? comunication.responses.find((e: any) => e.user._id === userData.data.userInfo._id) : null;
    if (!responseSent && userResponse) {
        setReply(userResponse.message);
        setAccept(userResponse.state);
        setResponseSent(true);
    }

    const canSend = comunication && ((comunication.confirmationType ?? "accept") === "message") ?
        (!responseSent && reply.trim().length > 0) : 
        (!responseSent);

    return !!comunication ? (
        <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}>
            <Stack.Screen options={{ headerTitle: comunication.title }} />
            <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
                <Text style={commonStyle.headerText}>{comunication.title}</Text>
                <View style={[commonStyle.card]}>
                    <Text style={[commonStyle.text, { fontSize: 15 }]}>{comunication.content}</Text>
                </View>
                {comunication.requiresConfirmation == true && (
                    <View style={{gap: 10}}>
                        <Text style={[commonStyle.headerText]}>{i18n.t("registry.comunications.reply.title")}</Text>
                        {(comunication.confirmationType ?? "accept") === "accept" && (
                            <ActionButtons containerStyles={{
                                position: undefined,
                                flex: 1,
                                bottom: undefined,
                                left: undefined,
                                right: undefined
                            }} itemStyles={{borderRadius: 360, flex: 1}} items={[
                                {
                                    title: i18n.t("registry.comunications.reply.accept"),
                                    styles: {
                                        backgroundColor: (canSend || (!canSend && accept)) ? theme.primary : theme.disabled,
                                        opacity: canSend ? 1 : 0.5
                                    },
                                    iconName: "checkmark",
                                    onPress: () => {
                                        comunicationResponse.create({
                                            comunicationid: comunication._id,
                                            state: true
                                        }).then(() => {
                                            comunicationData.load();
                                        });
                                    }
                                }, {
                                    title: i18n.t("registry.comunications.reply.reject"),
                                    styles: {
                                        backgroundColor: (canSend || (!canSend && !accept)) ? theme.caution : theme.disabled,
                                        opacity: canSend ? 1 : 0.5
                                    },
                                    iconName: "ban",
                                    onPress: () => {
                                        comunicationResponse.create({
                                            comunicationid: comunication._id,
                                            state: false
                                        }).then(() => {
                                            comunicationData.load();
                                        });
                                    }
                                }
                            ]} />
                        )}
                        {(comunication.confirmationType ?? "accept") === "message" && (
                            <View style={[modalStyle.cardEdit]}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("registry.comunications.reply.message")}</Text>
                                    <TextInput readOnly={(responseSent === true)} maxLength={300} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("registry.comunications.reply.messagePlaceholder")} value={reply} onChangeText={text => setReply(text)}/>
                                </View>
                                <TouchableOpacity disabled={!canSend} style={[commonStyle.wideButton, (!canSend ? { backgroundColor: theme.disabled } : null)]} onPress={() => {
                                    comunicationResponse.create({
                                        comunicationid: comunication._id,
                                        message: reply
                                    }).then(() => {
                                        comunicationData.load();
                                    });
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
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classid}`, DataManager.classData.default, {
        classid: classid,
        populate: ["comunications"]
    });

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

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
    ) : (
        <>
            <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
                {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                    <Ionicons name="school" size={40} color={theme.text} />
                    <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                    <Text style={commonStyle.text}>{i18n.t("registry.comunications.header.description")}</Text>
                </View>}
                <View style={optimizationStyle.item}>
                    <ScrollView style={commonStyle.dashboardSection} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: safeAreaInsets.bottom + 70 }, (comunications.length == 0 ? { flex: 1 } : {})]} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                    }>
                        <Text style={commonStyle.headerText}>{i18n.t("registry.comunications.header.text", {class: classData.data.name})}</Text>
                        <View style={(comunications.length == 0 ? { flex: 1 } : {})}>
                            {comunications.length == 0 && (
                                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
                                    <Ionicons name="albums-outline" size={40} color={theme.text} />
                                    <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.nocomunications.text")}</Text>
                                </View>
                            )}
                            <DashboardItem title={""} hideIfEmpty={true} items={comunications.map((e: ComunicationData) => {
                                let description = `${e.content?.split("\n").slice(0, 2).join("\n")}`;
                                if (description.length > 100) description = description.slice(0, 100) + "...";
                                return {
                                    title: e.title,
                                    description,
                                    onPress: () => {
                                        router.push({pathname: `/(tabs)/registry/comunications/${e._id}` as any, params: {classid: classid}});
                                    }
                                }
                            })} />
                        </View>
                    </ScrollView>
                </View>
            </View>
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
        </>
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

    if (activeClassId == "") return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={40} color={theme.text} />
            <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.noclass.text")}</Text>
        </View>
    );

    switch (id) {
        case 'all': 
            return <AllComunications classid={activeClassId} userData={userData.data} />;
        default:
            return <View style={[commonStyle.dashboardSection, { flex: 1 }]}><ComunicationTab classid={activeClassId} comunicationid={id as string}/></View>
    }
}