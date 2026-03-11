import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';

import createStyling from '@/constants/styling';
import { useAppDataSync, DataManager, useDBitem } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import i18n from '@/constants/i18n';

interface updateSubjectProps {
    action: string;
    classid: string;
    maxgrade: number;
    gradeType: string;
    name: string;
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateSubject({action, classid, maxgrade, gradeType, name, setLoading, create, alert}: updateSubjectProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                classid,
                name,
                maxgrade,
                gradeType
            }).then(data => {
                alert.show({title: i18n.t("modal.subject.create.success.title"), message: i18n.t("modal.subject.create.success.description"), actions: [
                    {
                        title: i18n.t("modal.subject.create.success.confirm"),
                        onPress: () => {
                            alert.hide();
                            router.back();
                        }
                    }
                ]});
            }).catch(err => {
                alert.show({title: i18n.t("modal.subject.create.error.title"), message: err});
            })
            setLoading(false);
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewSubject() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [subjectName, setSubjectName] = useState(i18n.t("modal.subject.create.name.default"));
    const params = useLocalSearchParams();
    const classId = params.classid as string;

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    const [loading, setLoading] = useState(false);

    const canProceed = subjectName.length > 0;

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });
    const subjectData = useDBitem(DataManager.subjectData.db);

    const alert = useAlert();

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.subject.create.stack.title")}} />
            {
                classData.loading ? <ActivityIndicator size="small" /> : 
                <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                    <View style={modalStyle.cardDetails}>
                        <Text style={commonStyle.headerText}>{subjectName}</Text>
                        {
                            userData.loading ? 
                            <ActivityIndicator size="small" color={theme.primary} /> :
                            <Text style={commonStyle.text}>{i18n.t("modal.subject.create.teacher.text", { teacher: userData.data.name })}</Text>
                        }
                        <Text style={commonStyle.text}>{i18n.t("modal.subject.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                        <Text style={commonStyle.text}>{i18n.t("modal.subject.create.merge.text", {subjectName: subjectName, className: classData.data.name})}</Text>
                    </View>
                    <View style={modalStyle.cardEdit}>
                        <View style={modalStyle.cardEditField}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.subject.create.input.name.title")}</Text>
                            <TextInput style={modalStyle.cardEditFieldInput} value={subjectName} onChangeText={text => setSubjectName(text)}/>
                        </View>
                    </View>
                    <View style={modalStyle.bottomActions}>
                        <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateSubject({
                            action: "create",
                            name: subjectName,
                            maxgrade: 100,
                            gradeType: "points",
                            classid: classId,
                            setLoading,
                            create: subjectData.create,
                            alert
                        })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                            {loading 
                                ? <ActivityIndicator size="small" />
                                : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.subject.create.confirm")}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            }
        </>
    );
}

export default function SubjectModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewSubject />;
        default:
            return <NewSubject />;
    }
}