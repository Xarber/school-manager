import { ActivityIndicator, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';
import { DataManager, devMode, useAppDataSync } from '@/data/datamanager';
import { useUserData } from '@/data/UserDataContext';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export default function ScheduleTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);
    const { width, height } = useWindowDimensions();
    const wrapperScreenSize = (defaultScreenSizes.phone.width * 2 + 40);
    const [refreshing, setRefreshing] = useState(false);
    const userData = useUserData();
    const activeClassId = userData.data.settings.activeClassId;

    const safeAreaInsets = useSafeAreaInsets();
    safeAreaInsets.bottom = safeAreaInsets.bottom ?? 20;

    const classData = useAppDataSync(activeClassId != "" ? DataManager.classData.db : null, `${DataManager.classData.db}:${activeClassId}`, DataManager.classData.default, {
        classid: activeClassId
    });

    const reload = async () => {
        setRefreshing(true);
        // await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            reload();
        }, [])
    )

    if (!devMode) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="flask-sharp" size={40} color={theme.text} />
            <Text style={[commonStyle.headerText, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.title")}</Text>
            <Text style={[commonStyle.text, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.message")}</Text>
        </View>
    );

    if ((classData.loading || userData.loading) && !refreshing) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color={theme.text} />
        </View>
    )

    return (
        <View style={[commonStyle.dashboardSection, optimizationStyle.container, { flex: 1 }]}>
            {(width > wrapperScreenSize) && <View style={[optimizationStyle.item, { justifyContent: "center", gap: 5, alignItems: "center", height: "100%" }]}>
                <Ionicons name="school" size={40} color={theme.text} />
                <Text style={commonStyle.headerText}>{classData.data.name}</Text>
                <Text style={commonStyle.text}>{i18n.t("registry.schedule.header.description")}</Text>
            </View>}
            <View style={[commonStyle.dashboardSection, optimizationStyle.item]}>
                <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={reload} />
                }>
                    <Text style={commonStyle.headerText}>{i18n.t("registry.schedule.title")}</Text>

                </ScrollView>
            </View>
        </View>
    )
}