import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { DataManager, useAppDataSync } from '@/data/datamanager';
import i18n from '@/constants/i18n';
import { useState } from 'react';
import ActionButtons from '@/components/actionButtons';
import { ScrollView } from 'react-native';

export default function ProfileData() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [mode, setMode] = useState<"read" | "write">("read");
    const [loading, setLoading] = useState(false);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    console.warn(JSON.stringify(userData, null, 4));

    const [username, setUsername] = useState("");
    const [usersurname, setUsersurname] = useState("");

    if (!userData.loading && !username && !usersurname) {
        setUsername(userData.data.userInfo.name);
        setUsersurname(userData.data.userInfo.surname);
    }

    const canSave = username.length > 1 && usersurname.length > 1;

    return userData.loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" />
        </View>
    ) : (
        <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={[commonStyle.dashboardSection, { flex: 1 }]}>
                    <Text style={commonStyle.headerText}>{i18n.t("profile.data.title")}</Text>
                    <View style={[commonStyle.card, { gap: 10 }]}>
                        <View>
                            <Text style={[commonStyle.headerText, { fontSize: 20 }]}>{username} {usersurname}</Text>
                            <Text style={[commonStyle.text, { fontSize: 15, color: theme.secondary }]}>{userData.data.userInfo.email}</Text>
                        </View>
                        {mode == "write" && (
                            <View style={modalStyle.cardEdit}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("profile.data.edit.name")}</Text>
                                    <TextInput style={modalStyle.cardEditFieldInput} value={username} onChangeText={setUsername} />
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("profile.data.edit.surname")}</Text>
                                    <TextInput style={modalStyle.cardEditFieldInput} value={usersurname} onChangeText={setUsersurname} />
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={[commonStyle.card]}>
                        <Text style={[commonStyle.headerText, { fontSize: 20 }]}>{i18n.t(`profile.data.role`)}</Text>
                        <Text style={[commonStyle.text, { fontSize: 15 }]}>{userData.data.userInfo.role.split("")[0].toUpperCase() + userData.data.userInfo.role.slice(1)}</Text>
                    </View>
                    <View style={[commonStyle.card]}>
                        <Text style={[commonStyle.headerText, { fontSize: 20 }]}>{i18n.t(`profile.data.joindate`)}</Text>
                        <Text style={[commonStyle.text, { fontSize: 15 }]}>{new Date(userData.data.addedAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[commonStyle.card]}>
                        <Text style={[commonStyle.headerText, { fontSize: 20 }]}>{i18n.t(`profile.data.classes`)}</Text>
                        <Text style={[commonStyle.text, { fontSize: 15 }]}>{userData.data.classes.length}</Text>
                    </View>
                </View>
            </ScrollView>
            <ActionButtons items={[
                {
                    title: i18n.t("profile.data.actions.edit.title"),
                    iconName: "pencil-sharp",
                    onPress: () => {
                        setMode("write");
                    },
                    display: mode === "read",
                },
                {
                    title: i18n.t("profile.data.actions.save.title"),
                    iconName: "checkmark",
                    enabled: canSave,
                    buffering: loading,
                    onPress: () => {
                        setLoading(true);
                        userData.save({
                            ...userData.data,
                            name: `${username} ${usersurname}`,
                            userInfo: {
                                ...userData.data.userInfo,
                                name: username,
                                surname: usersurname,
                            }
                        }).then(() => {
                            setLoading(false);
                            setMode("read");
                        });
                    },
                    display: mode === "write",
                },
            ]} align="right" styles={{ borderRadius: 360 }} />
        </View>
    );
}