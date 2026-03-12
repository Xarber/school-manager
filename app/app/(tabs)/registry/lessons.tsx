import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, useAppDataSync } from '@/data/datamanager';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';

export default function LessonsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const classData = useAppDataSync(userData.loading ? null : DataManager.classData.db, `${DataManager.classData.app}:${userData.data.settings.activeClassId}`, DataManager.classData.default, {
        classid: userData.data.settings.activeClassId,
        populate: ["subjects"]
    });

    useFocusEffect(
        useCallback(() => {
            userData.load();
            classData.load();
        }, [])
    );

    return (userData.loading || classData.loading) ? ( 
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (userData.data.settings.activeClassId == "") ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.noclass.text")}</Text>
            </View>
        ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView style={commonStyle.dashboardSection}>
                <Text style={commonStyle.headerText}>{i18n.t("registry.lessons.header.text", {class: classData.data.name})}</Text>
                <View style={commonStyle.card}>
                    {classData.data.lessons.length === 0 ? (
                        <Text style={commonStyle.text}>{i18n.t("registry.lessons.warn.nolessons.text")}</Text>
                    ) : null}
                </View>
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("registry.lessons.create.title"),
                    iconName: "add",
                    onPress: () => {
                        router.push({pathname: `/modal/lesson/create` as any, params: {classid: userData.data.settings.activeClassId}});
                    },
                    display: userData.data.userInfo.role != "student",
                }
            ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
    );
}