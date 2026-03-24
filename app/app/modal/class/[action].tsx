import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';

import createStyling from '@/constants/styling';
import { DataManager, useDBitem } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import i18n from '@/constants/i18n';
import { useUserData } from '@/data/UserDataContext';
import { KeyboardShift } from '@/components/keyboardShift';
import { BlurView } from 'expo-blur';

interface updateClassProps {
    action: string;
    name: string;
    description: string;
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateClass({action, name, description, setLoading, create, alert}: updateClassProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                name,
                description
            }).then(data => {
                alert.show({title: i18n.t("modal.class.create.success.title"), message: i18n.t("modal.class.create.success.description"), actions: [
                    {
                        title: i18n.t("modal.class.create.success.confirm"),
                        onPress: () => {
                            alert.hide();
                            router.back();
                            router.push({pathname: `/(tabs)/profile/class/${data}` as any});
                        }
                    }
                ]});

            }).catch(err => {
                alert.show({title: i18n.t("modal.class.create.error.title"), message: err});
            })
            setLoading(false);
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewClass() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [className, setClassName] = useState("");
    const [classDescription, setClassDescription] = useState("");

    const [bottomHeight, setBottomHeight] = useState(0);
    
    const userData = useUserData();
    const [loading, setLoading] = useState(false);

    const canProceed = className.length > 0 && classDescription.length > 0;

    const classData = useDBitem(DataManager.classData.db, DataManager.classData.default);

    const alert = useAlert();

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.class.create.stack.title")}} />
            <KeyboardShift>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                    <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                        <View style={modalStyle.cardDetails}>
                            <Text style={commonStyle.headerText}>{className || i18n.t("modal.class.create.name.default")}</Text>
                            {
                                userData.loading ? 
                                <ActivityIndicator size="small" color={theme.text} /> :
                                <Text style={commonStyle.text}>{i18n.t("modal.class.create.teacher.text", {teacher: userData.data.name})}</Text>
                            }
                            <Text style={commonStyle.text}>{i18n.t("modal.class.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                            <Text style={commonStyle.text}>{classDescription || i18n.t("modal.class.create.description.default")}</Text>
                        </View>
                        <View style={modalStyle.cardEdit}>
                            <View style={modalStyle.cardEditField}>
                                <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.class.create.input.name.title")}</Text>
                                <TextInput maxLength={30} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("modal.class.create.name.default")} value={className} onChangeText={text => setClassName(text)}/>
                            </View>

                            <View>
                                <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.class.create.input.description.title")}</Text>
                                <TextInput style={modalStyle.cardEditFieldInput} placeholder={i18n.t("modal.class.create.description.default")} value={classDescription} onChangeText={text => setClassDescription(text)} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
                <View style={modalStyle.bottomActions} onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                    <BlurView>
                        <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateClass({
                            action: "create",
                            name: className,
                            description: classDescription,
                            setLoading,
                            create: classData.create,
                            alert
                        })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                            {loading 
                                ? <ActivityIndicator size="small" color={theme.text} />
                                : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.class.create.confirm")}</Text>
                            }
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </KeyboardShift>
        </>
    );
}

export default function ClassModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewClass />;
        default:
            return <NewClass />;
    }
}