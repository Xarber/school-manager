import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, ComunicationData, SubjectData, useAppDataSync, UserInfo, UserData, useDBitem } from '@/data/datamanager';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import i18n from '@/constants/i18n';
import ActionButtons from '@/components/actionButtons';
import { ActivityIndicator } from 'react-native';
import DashboardItem from '@/components/dashboardItem';
import { useUserData } from '@/data/UserDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function AllResources({classid, userData}: {classid: string, userData: UserData}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);


    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    return (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            
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
            return <AllResources classid={activeClassId} userData={userData.data} />;
        default:
            return <View style={[commonStyle.dashboardSection, { flex: 1 }]}><ResourceTab classid={activeClassId} resourceid={id as string}/></View>
    }
}