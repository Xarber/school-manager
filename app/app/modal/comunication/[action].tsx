import { View, Text, ActivityIndicator, TouchableOpacity, Platform, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import createStyling from '@/constants/styling';
import { useAppDataSync, DataManager, useDBitem, SubjectData } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import i18n from '@/constants/i18n';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import SegmentedSlider from "@/components/segmentedPicker";

interface updateComunicationProps {
    action: string;
    classid: string;
    title: string;
    content: string;
    date: string;
    time: string;
    urgency: "low" | "medium" | "high";
    requiresConfirmation: boolean;
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateComunication({action, classid, title, content, date, time, urgency, requiresConfirmation, setLoading, create, alert}: updateComunicationProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                classid,
                title,
                content,
                date,
                time,
                urgency,
                requiresConfirmation
            }).then(data => {
                alert.show({title: i18n.t("modal.comunication.create.success.title"), message: i18n.t("modal.comunication.create.success.description"), actions: [
                    {
                        title: i18n.t("modal.comunication.create.success.confirm"),
                        onPress: () => {
                            alert.hide();
                            router.back();
                        }
                    }
                ]});
            }).catch(err => {
                alert.show({title: i18n.t("modal.comunication.create.error.title"), message: err});
            })
            setLoading(false);
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewComunication() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [comunicationName, setComunicationName] = useState(i18n.t("modal.comunication.create.name.default"));
    const [date, setDate] = useState(new Date());
    const [urgency, setUrgency] = useState("low" as "low" | "medium" | "high");
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [comunicationDescription, setComunicationDescription] = useState(i18n.t("modal.comunication.create.description.default"));
    const params = useLocalSearchParams();
    const classId = params.classid as string;

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    const [loading, setLoading] = useState(false);

    const canProceed = (comunicationName.length > 0) && (comunicationDescription.length > 0);

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });

    const comunicationData = useDBitem(DataManager.comunicationData.db);

    const alert = useAlert();

    const updateDate = (e: any, d: Date | undefined)=>{
        setDate(d || date);
    };

    const showMode = (currentMode: "date" | "time") => {
        DateTimePickerAndroid.open({
            value: date,
            onChange: updateDate,
            mode: currentMode,
            is24Hour: true,
        });
    };

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.comunication.create.stack.title")}} />
            {
                classData.loading ? <ActivityIndicator size="small" /> : 
                <View style={[commonStyle.dashboardSection, modalStyle.container, {flex: 1}]}>
                    <View style={modalStyle.cardDetails}>
                        <Text style={commonStyle.headerText}>{comunicationName}</Text>
                        <Text style={commonStyle.text}>{comunicationDescription}</Text>
                        <Text style={commonStyle.text}>{i18n.t("modal.comunication.create.datetime.description", {date: date.toLocaleDateString(), time: date.toLocaleTimeString()})}</Text>
                        {
                            userData.loading ? 
                            <ActivityIndicator size="small" color={theme.primary} /> :
                            <Text style={commonStyle.text}>{i18n.t("modal.comunication.create.teacher.text", { teacher: userData.data.name })}</Text>
                        }
                        <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.comunication.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                        <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.comunication.create.merge.text", {comunicationName: comunicationName, className: classData.data.name})}</Text>
                    </View>
                    <View style={modalStyle.cardEdit}>
                        <View style={modalStyle.cardEditField}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.input.name.title")}</Text>
                            <TextInput style={modalStyle.cardEditFieldInput} value={comunicationName} onChangeText={text => setComunicationName(text)}/>
                        </View>
                        <View style={modalStyle.cardEditField}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.input.description.title")}</Text>
                            <TextInput multiline={true} style={modalStyle.cardEditFieldTextArea} value={comunicationDescription} onChangeText={text => setComunicationDescription(text)}/>
                        </View>
                        <View style={modalStyle.cardEditField}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.datetime.title")}</Text>
                            {
                                Platform.OS === "android" && (
                                    <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                        <TouchableOpacity style={[commonStyle.button, {backgroundColor: theme.opaqueCard}]} onPress={()=>showMode("date")}>
                                            <Text style={commonStyle.text}>{date.toDateString()}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[commonStyle.button, {backgroundColor: theme.opaqueCard}]} onPress={()=>showMode("time")}>
                                            <Text style={commonStyle.text}>{date.toTimeString().split(" ")[0]}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            }
                            {
                                Platform.OS === "ios" && <DateTimePicker 
                                    value={date}
                                    mode="datetime"
                                    display="default"
                                    onChange={updateDate}
                                />
                            }
                        </View>
                        <View style={modalStyle.cardEditField}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.urgency.title")}</Text>
                            <SegmentedSlider 
                                options={[
                                    i18n.t("modal.comunication.create.urgency.options.low"),
                                    i18n.t("modal.comunication.create.urgency.options.medium"),
                                    i18n.t("modal.comunication.create.urgency.options.high"),
                                ]}
                                value={i18n.t(`modal.comunication.create.urgency.options.${urgency}`)}
                                onChange={(v)=>{
                                    switch (v) {
                                        case i18n.t("modal.comunication.create.urgency.options.low"):
                                            setUrgency("low");
                                            break;
                                        case i18n.t("modal.comunication.create.urgency.options.medium"):
                                            setUrgency("medium");
                                            break;
                                        case i18n.t("modal.comunication.create.urgency.options.high"):
                                            setUrgency("high");
                                            break;
                                    }
                                }}
                            />
                        </View>
                        <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between"}]}>
                            <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.requiresconfirmation.title")}</Text>
                            <Switch value={requiresConfirmation} onValueChange={setRequiresConfirmation} />
                        </View>
                    </View>
                    <View style={modalStyle.bottomActions}>
                        <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateComunication({
                            action: "create",
                            classid: classId,
                            title: comunicationName,
                            content: comunicationDescription,
                            date: date.toISOString().split("T")[0],
                            time: date.toISOString().split("T")[1],
                            urgency,
                            requiresConfirmation,
                            setLoading,
                            create: comunicationData.create,
                            alert
                        })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                            {loading 
                                ? <ActivityIndicator size="small" />
                                : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.comunication.create.confirm")}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            }
        </>
    );
}

export default function ComunicationModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewComunication />;
        default:
            return <NewComunication />;
    }
}