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
                    title: "Invite created!",
                    message: "Share this code:",
                    children: (
                        <ClipboardText text={data.toString()} />
                    ),
                    actions: [
                        {
                            title: "Close",
                            onPress: () => {
                                alert.hide();
                                router.back();
                            }
                        }
                    ]
                });
            }).catch(err => {
                alert.show({
                    title: "Error",
                    message: err.message
                });
            })
            setLoading(false);
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

    const userData = useUserData();
    const inviteData = useDBitem(DataManager.invitation.db);
    const [loading, setLoading] = useState(false);
    const [canProceed, setCanProceed] = useState(true);
    const [joinAs, setJoinAs] = useState("student" as "student" | "teacher");

    const alertContext = useAlert();

    return (
        <>
            <Stack.Screen options={{headerTitle: "Create an invite"}} />
            <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                <Text style={commonStyle.text}>Your invite will look like this:</Text>
                <View style={modalStyle.cardDetails}>
                    <Text style={commonStyle.headerText}>{targetName}</Text>
                    {
                        userData.loading ? 
                        <ActivityIndicator size="small" color={theme.primary} /> :
                        <Text style={commonStyle.text}>{userData.data.name} has invited you to join a {targetType}!</Text>
                    }
                    <Text style={commonStyle.text}>Created on: {new Date().toDateString()}</Text>
                    <Text style={commonStyle.text}>Will be joining as: {joinAs}</Text>
                </View>
                <View style={modalStyle.cardEdit}>
                    <Text style={commonStyle.headerText}>Invite a:</Text>
                    <RadioButton.Group onValueChange={((v) => {setJoinAs(v as any)})} value={joinAs}>
                        <RadioButton.Item label="Student" value="student" labelStyle={commonStyle.text} />
                        <RadioButton.Item label="Teacher" value="teacher" labelStyle={commonStyle.text} />
                    </RadioButton.Group>
                </View>
                <View style={modalStyle.bottomActions}>
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
                            ? <ActivityIndicator size="small" color="white" />
                            : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>Create</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
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
        <View style={[commonStyle.dashboardSection, {flex: 1, justifyContent: "center", alignItems: "center"}]}>
            <Stack.Screen options={{headerTitle: "Enter an invite"}} />
            <Feather name="mail" size={100} color={theme.primary} />
            <View style={{padding: 50, width: "100%", alignItems: "center", gap: 20}}>
                <Text style={commonStyle.headerText}>Enter your invite here</Text>
                <View style={{gap: 10, width: "100%"}}>
                    <TextInput maxLength={14} style={[modalStyle.cardEditFieldInput, {textAlign: "center"}]} value={inviteCode} onChangeText={(t)=>{
                        setInviteCode(addDashes(t.toUpperCase().replaceAll('-', '')));
                        setCanProceed(t.length == 14);
                    }} />
                    <TouchableOpacity disabled={!canProceed} onPress={() => {
                        router.push({ pathname: "/modal/invitation/read" as any, params: {invitecode: inviteCode}});
                    }} style={[commonStyle.wideButton, canProceed ? null : {backgroundColor: theme.disabled}]}>
                        <Text style={commonStyle.text}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

function ReadInvitation() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const params = useLocalSearchParams();
    const inviteCode = params.invitecode as string;

    const inviteData = useAppDataSync(DataManager.invitation.db, DataManager.invitation.app, DataManager.invitation.default, {
        code: inviteCode
    });

    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center", gap: 20}}>
            <Stack.Screen options={{headerTitle: "Invitation"}} />
            <Feather name="mail" size={100} color={theme.primary} />
            <View style={modalStyle.cardDetails}>
                {
                    inviteData.loading ? 
                    <ActivityIndicator size="small" color={theme.primary} /> : (
                        <>
                            <Text style={commonStyle.headerText}>{inviteData.data.name}</Text>
                            <Text style={commonStyle.text}>{inviteData.data.author?.name + " " + inviteData.data.author?.surname} has invited you to join a {inviteData.data.for}!</Text>
                            <Text style={commonStyle.text}>Will be joining as: {inviteData.data.joinAs}</Text>
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
                {inviteData.loading ? <ActivityIndicator size="small" color={theme.primary} /> : <Text style={commonStyle.text}>Accept</Text>}
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
                <Text style={commonStyle.text}>There was an error loading the page.</Text>
            </View>
    }
}