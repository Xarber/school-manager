import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling, { defaultScreenSizes } from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo, UserData, useDBitem, devMode } from '@/data/datamanager';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function ResourceTab({classid, resourceid}: {classid: string, resourceid: string}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const id = resourceid;
    const userData = useUserData();

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            
        </View>
    )
}

export function AllResources({classid}: {classid: string}) {
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
                <Text style={commonStyle.text}>{i18n.t("registry.resources.header.description")}</Text>
            </View>}
            <View style={[commonStyle.dashboardSection, optimizationStyle.item]}>
                <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={reload} />
                }>
                    <Text style={commonStyle.headerText}>{i18n.t("registry.resources.title")}</Text>

                </ScrollView>
            </View>
        </View>
    )
}

export default function ResourcesTab() {
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
            return <AllResources classid={activeClassId} />;
        default:
            return <View style={[commonStyle.dashboardSection, { flex: 1 }]}><ResourceTab classid={activeClassId} resourceid={id as string}/></View>
    }
}