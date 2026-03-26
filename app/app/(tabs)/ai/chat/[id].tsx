import LabsScreen from '@/components/LabsScreen';
import createStyling from '@/constants/styling';
import { useTheme } from '@/constants/useThemes';
import { useLocalSearchParams, useRouter } from 'expo-router';

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