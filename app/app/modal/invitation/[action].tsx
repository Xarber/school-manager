import { View, Text } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDataSync, DataManager, useDBitem } from '@/data/datamanager';
import { Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { TextInput } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AlertProps, AlertProvider, useAlert } from '@/components/alert/AlertContext';
import ClipboardText from '@/components/clipboardText';
import { useUserData } from '@/data/UserDataContext';
import { KeyboardShift } from '@/components/keyboardShift';
import { ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import i18n from '@/constants/i18n';

function addDashes(str: string) {
  return str.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

interface updateInviteProps {
    action: string;
    targetid: string;
    invitefor: string;
    joinAs: string;
    styles: any;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    };
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
}

function updateInvite({action, invitefor, targetid, joinAs, setLoading, create, alert}: updateInviteProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                for: invitefor,
                joinAs: joinAs,
                targetid: targetid
            }).then(data => {
                alert.show({
                    title: i18n.t("modal.invitation.create.alert.title"),
                    message: i18n.t("modal.invitation.create.alert.message"),
                    children: (
                        <ClipboardText text={data.toString()} />
                    ),
                    actions: [
                        {
                            title: i18n.t("modal.invitation.create.alert.close"),
                            onPress: () => {
                                alert.hide();
                                router.back();
                            }
                        }
                    ]
                });
                setLoading(false);
            }).catch(err => {
                alert.show({
                    title: i18n.t("modal.invitation.create.alert.error.title"),
                    message: err.message
                });
                setLoading(false);
            })
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewInvitation() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);

    const params = useLocalSearchParams();
    const targetName = params.name as string;
    const targetType = params.for as string;
    const targetId = params.targetid as string;

    const [bottomHeight, setBottomHeight] = useState(0);

    const userData = useUserData();
    const inviteData = useDBitem(DataManager.invitation.db, DataManager.invitation.default);
    const [loading, setLoading] = useState(false);
    const [canProceed, setCanProceed] = useState(true);
    const [joinAs, setJoinAs] = useState("student" as "student" | "teacher");

    const alertContext = useAlert();

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.invitation.create.stack.title")}} />
            <KeyboardShift>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                    <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                        <Text style={commonStyle.text}>{i18n.t("modal.invitation.create.preview.text")}</Text>
                        <View style={modalStyle.cardDetails}>
                            <Text style={commonStyle.headerText}>{targetName}</Text>
                            {
                                userData.loading ? 
                                <ActivityIndicator size="small" color={theme.text} /> :
                                <Text style={commonStyle.text}>{i18n.t("modal.invitation.create.invited.text", {user: userData.data.name, target: i18n.t("modal.invitation.types." + targetType)})}</Text>
                            }
                            <Text style={commonStyle.text}>{i18n.t("modal.invitation.create.createdate", {date: new Date().toDateString()})}</Text>
                            <Text style={commonStyle.text}>{i18n.t("modal.invitation.create.joinas", {joinAs: i18n.t("modal.invitation.types." + joinAs)})}</Text>
                        </View>
                        <View style={modalStyle.cardEdit}>
                            <Text style={commonStyle.headerText}>{i18n.t("modal.invitation.create.type.title")}</Text>
                            <RadioButton.Group onValueChange={((v) => {setJoinAs(v as any)})} value={joinAs}>
                                <RadioButton.Item label={i18n.t("modal.invitation.create.type.student")} value="student" labelStyle={commonStyle.text} />
                                <RadioButton.Item label={i18n.t("modal.invitation.create.type.teacher")} value="teacher" labelStyle={commonStyle.text} />
                            </RadioButton.Group>
                        </View>
                    </View>
                </ScrollView>
                <View style={modalStyle.bottomActions} onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                    <BlurView>
                        <TouchableOpacity disabled={loading} onPress={()=>updateInvite({
                            action: "create",
                            invitefor: targetType,
                            targetid: targetId,
                            joinAs: joinAs,
                            styles: commonStyle,
                            alert: alertContext,
                            setLoading,
                            create: inviteData.create
                        })} style={[modalStyle.bottomActionButton]}>
                            {loading 
                                ? <ActivityIndicator size="small" color={theme.text} />
                                : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.invitation.create.confirm")}</Text>
                            }
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </KeyboardShift>
        </>
    );
}

function EnterInvitation() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const params = useLocalSearchParams();
    const router = useRouter();

    const [inviteCode, setInviteCode] = useState("");
    const [canProceed, setCanProceed] = useState(false);

    return (
        <KeyboardShift>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={[commonStyle.dashboardSection, {flex: 1, justifyContent: "center", alignItems: "center"}]}>
                    <Stack.Screen options={{headerTitle: i18n.t("modal.invitation.enter.stack.title")}} />
                    <Feather name="mail" size={100} color={theme.primary} />
                    <View style={{padding: 50, width: "100%", alignItems: "center", gap: 20}}>
                        <Text style={commonStyle.headerText}>{i18n.t("modal.invitation.enter.title")}</Text>
                        <View style={{gap: 10, width: "100%"}}>
                            <TextInput autoFocus={true} maxLength={14} style={[modalStyle.cardEditFieldInput, {textAlign: "center"}]} value={inviteCode} onChangeText={(t)=>{
                                setInviteCode(addDashes(t.toUpperCase().replaceAll('-', '')));
                                setCanProceed(t.length == 14);
                            }} />
                            <TouchableOpacity disabled={!canProceed} onPress={() => {
                                router.replace({ pathname: "/modal/invitation/read" as any, params: {invitecode: inviteCode}});
                            }} style={[commonStyle.wideButton, canProceed ? null : {backgroundColor: theme.disabled}]}>
                                <Text style={commonStyle.text}>{i18n.t("modal.invitation.enter.confirm")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardShift>
    )
}

function ReadInvitation() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const params = useLocalSearchParams();
    const inviteCode = params.invitecode as string;

    const inviteData = useAppDataSync(DataManager.invitation.db, `${DataManager.invitation.app}:${inviteCode.replaceAll('-', '')}`, DataManager.invitation.default, {
        code: inviteCode
    });

    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center", gap: 20}}>
            <Stack.Screen options={{headerTitle: i18n.t("modal.invitation.read.stack.title")}} />
            <Feather name="mail" size={100} color={theme.primary} />
            <View style={modalStyle.cardDetails}>
                {
                    inviteData.loading ? 
                    <ActivityIndicator size="small" color={theme.text} /> : (
                        <>
                            <Text style={commonStyle.headerText}>{inviteData.data.name}</Text>
                            <Text style={commonStyle.text}>{i18n.t("modal.invitation.read.title", {author: `${inviteData.data.author?.name} ${inviteData.data.author?.surname}`, type: i18n.t("modal.invitation.types." + inviteData.data.for)})}</Text>
                            <Text style={commonStyle.text}>{i18n.t("modal.invitation.read.joinas", {joinAs: i18n.t("modal.invitation.types." + inviteData.data.joinAs)})}</Text>
                        </>
                    )
                }
            </View>
            <TouchableOpacity onPress={(()=>{
                inviteData.save({
                    code: inviteCode
                }).then(data=>{
                    router.dismissAll();
                })
            })} style={modalStyle.bottomActionButton}>
                {inviteData.loading ? <ActivityIndicator size="small" color={theme.text} /> : <Text style={commonStyle.text}>{i18n.t("modal.invitation.read.accept")}</Text>}
            </TouchableOpacity>
        </View>

    );

}

export default function InvitationPage() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();

    switch (params.action) {
        case "create":
            return <NewInvitation />;
        case "enter":
            return <EnterInvitation />;
        case "read":
            return <ReadInvitation />;
        default:
            return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyle.text}>{i18n.t("modal.invitation.error")}</Text>
            </View>
    }
}