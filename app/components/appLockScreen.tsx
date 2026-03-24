
import i18n from '@/constants/i18n';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import { Ionicons } from '@expo/vector-icons';
import createStyling from '@/constants/styling';

export default function AppLockScreen({authenticate, isAuthenticated}: {authenticate: () => void, isAuthenticated: boolean}) {
    const theme = useTheme();
    const commonStyles = createStyling.createCommonStyles(theme);

    // useEffect(()=>{
    //   if (!isAuthenticated) authenticate();
    // }, [isAuthenticated]);

    return (
      <View style={{flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
        <Ionicons name="lock-closed" size={50} color={theme.text}/>
        <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t("components.applock.screen.locked")}</Text>
        <TouchableOpacity style={[commonStyles.button, { padding: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 360 }]} onPress={authenticate}>
            <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t("components.applock.screen.unlock")}</Text>
        </TouchableOpacity>
      </View>
    )
}