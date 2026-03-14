import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo } from '@/data/datamanager';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';

function ComunicationTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const id = params.id;

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const classData = useAppDataSync(userData.loading ? null : DataManager.classData.db, `${DataManager.classData.app}:${userData.data.settings.activeClassId}`, DataManager.classData.default, {
        classid: userData.data.settings.activeClassId,
        populate: ["comunications"]
    });

    let comunication = classData.loading ? null : classData.data.comunications.find((e: ComunicationData) => e._id === id);
    console.log(comunication);

    return userData.loading || classData.loading ? 
    (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : !!comunication ? (
        <View style={commonStyle.dashboardSection}>
            <Text style={commonStyle.headerText}>{comunication.title}</Text>
            <View style={[commonStyle.card, { minHeight: 200 }]}>
                <Text style={commonStyle.text}>{comunication.content}</Text>
            </View>
        </View>
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.notfound.text")}</Text>
        </View>
    )
}

function AllComunications() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const classData = useAppDataSync(userData.loading ? null : DataManager.classData.db, `${DataManager.classData.app}:${userData.data.settings.activeClassId}`, DataManager.classData.default, {
        classid: userData.data.settings.activeClassId,
        populate: ["comunications"]
    });

    const reload = async () => {
        setRefreshing(true);
        await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    let comunications: ComunicationData[] = classData.data.comunications;

    return (userData.loading || classData.loading) ? ( 
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (userData.data.settings.activeClassId == "") ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("registry.comunications.warn.noclass.text")}</Text>
            </View>
        ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={reload} />
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
                                router.push({pathname: `/(tabs)/registry/comunications/${e._id}` as any});
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
                        router.push({pathname: `/modal/comunication/create` as any, params: {classid: userData.data.settings.activeClassId}});
                    },
                    display: userData.data.userInfo.role != "student",
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
    );
}

export default function ComunicationsTab() {
    const params = useLocalSearchParams();
    const id = params.id;

    switch (id) {
        case 'all': 
            return <AllComunications />;
        default:
            return <ComunicationTab />
    }
}