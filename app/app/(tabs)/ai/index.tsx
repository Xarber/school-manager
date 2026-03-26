import LabsScreen from '@/components/LabsScreen';
import createStyling from '@/constants/styling';
import { useTheme } from '@/constants/useThemes';

export default function ChatScreen() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <LabsScreen />
    );
}