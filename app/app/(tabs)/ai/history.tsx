import { Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';
import LabsScreen from '@/components/LabsScreen';

export default function ProfileData() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <LabsScreen />
    );
}