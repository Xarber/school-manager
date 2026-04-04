
import i18n from '@/constants/i18n';
import createStyling from '@/constants/styling';
import { useTheme } from '@/constants/useThemes';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from 'react';
import { KeyboardShift } from './keyboardShift';
import { ScrollView } from 'react-native';

export default function AppLockScreen({authenticate, isAuthenticated}: {authenticate: () => void, isAuthenticated: boolean}) {
    const theme = useTheme();
    const commonStyles = createStyling.createCommonStyles(theme);
    const modalStyles = createStyling.createModalStyles(theme);
    const [canAuthenticate, setCanAuthenticate] = useState<boolean | null>(null);
    const [pin, setPin] = useState("");

    // useEffect(()=>{
    //   if (!isAuthenticated) authenticate();
    // }, [isAuthenticated]);

    useEffect(()=>{
      const hasHardware = LocalAuthentication.hasHardwareAsync();
      const isEnrolled = LocalAuthentication.isEnrolledAsync();

      Promise.all([hasHardware, isEnrolled]).then(([hasHardware, isEnrolled]) => {
        //setCanAuthenticate(hasHardware && isEnrolled);
        setCanAuthenticate(true); // todo: Actual support for pin codes
      })
    }, []);

    const handleLocalAuthentication = () => {

    };

    return (
      <KeyboardShift extraPadding={-70}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ flex: 1 }}>
          <View style={{flex: 1, justifyContent: "center", alignItems: "center", gap: 10}}>
            <Ionicons name="lock-closed" size={50} color={theme.text}/>
            <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t("components.applock.screen.locked")}</Text>
            {canAuthenticate === null && <ActivityIndicator size="small" color={theme.text} />}
            {canAuthenticate === true && <TouchableOpacity style={[commonStyles.button, { padding: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 360 }]} onPress={authenticate}>
              <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t("components.applock.screen.unlock")}</Text>
            </TouchableOpacity>}
            {canAuthenticate === false && (
              <View style={{ gap: 20 }}>
                <Text style={commonStyles.text}>{i18n.t("components.applock.pincode.message")}</Text>
                <View>
                  <TextInput style={[modalStyles.cardEditFieldInput, {textAlign: "center"}]} keyboardType="number-pad" maxLength={6} secureTextEntry autoFocus autoCapitalize='none'
                    value={pin}
                    onChangeText={setPin}
                    placeholder={i18n.t("components.applock.pincode.placeholder")}
                    placeholderTextColor={theme.disabled}
                  />
                </View>
                <TouchableOpacity style={[commonStyles.button, { padding: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 360 }]} onPress={handleLocalAuthentication}>
                  <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t("components.applock.screen.unlock")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardShift>
    )
}