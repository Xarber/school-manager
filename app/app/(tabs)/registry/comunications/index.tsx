import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo } from '@/data/datamanager';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';

export default function ComunicationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const classData = useAppDataSync(userData.loading ? null : DataManager.classData.db, `${DataManager.classData.app}:${userData.data.settings.activeClassId}`, DataManager.classData.default, {
        classid: userData.data.settings.activeClassId,
        populate: ["subjects"]
    });

    let defaultComunicationsData = [{subjectid: "", data: [DataManager.comunicationData.default]}];
    const comunicationData = useAppDataSync(userData.loading ? null : DataManager.comunicationData.db, `${DataManager.comunicationData.app}:${userData.data.settings.activeClassId}`, defaultComunicationsData, {
        classid: userData.data.settings.activeClassId
    });

    useFocusEffect(
        useCallback(() => {
            userData.load();
            classData.load();
            comunicationData.load();
        }, [])
    );

    let comunications: ComunicationData[] = [];

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
            <ScrollView style={commonStyle.dashboardSection}>
                <Text style={commonStyle.headerText}>{i18n.t("registry.comunications.header.text", {class: classData.data.name})}</Text>
                <View>
                    <DashboardItem title={""} items={comunications.map((e: ComunicationData) => {
                        // todo max line length, expand to /comunications/id
                        return {
                            title: e.title,
                            description: `${e.content.split("\n")}\n\n${classData.data.teachers.find((t: UserInfo) => t._id == e.sender)?.name}\n${new Date(`${e.date}T${e.time}`).toLocaleTimeString()}`,
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