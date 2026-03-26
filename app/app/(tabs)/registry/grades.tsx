import LabsScreen from '@/components/LabsScreen';
import i18n from '@/constants/i18n';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { useTheme } from '@/constants/useThemes';
import { useClassData } from '@/data/ClassContext';
import { devMode } from '@/data/devMode';
import { useUserData } from '@/data/UserDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GradesTab() {
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

    const classData = useClassData();

    const reload = async () => {
        setRefreshing(true);
        // await Promise.all([userData.load()]);
        await Promise.all([classData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(()=>{
            //reload();
        }, [])
    )

    if (!devMode) return (
        <LabsScreen />
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
                <Text style={commonStyle.text}>{i18n.t("registry.grades.header.description")}</Text>
            </View>}
            <View style={[commonStyle.dashboardSection, optimizationStyle.item]}>
                <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={reload} />
                }>
                    <Text style={commonStyle.headerText}>{i18n.t("registry.grades.title")}</Text>

                </ScrollView>
            </View>
        </View>
    )
}