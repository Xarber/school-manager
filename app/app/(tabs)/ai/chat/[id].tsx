import { View, Text } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import { useRouter, useLocalSearchParams } from 'expo-router';
import createStyling from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';
import LabsScreen from '@/components/LabsScreen';

export default function ChatScreen() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const chatId = params.id as string;
    const router = useRouter();
    // You can use chatId to fetch chat data or perform other actions related to this specific chat

    return (
        <LabsScreen />
    );
}