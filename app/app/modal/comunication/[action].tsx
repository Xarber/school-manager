import { useTheme } from '@/constants/useThemes';
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import { KeyboardShift } from '@/components/keyboardShift';
import SegmentedSlider from "@/components/segmentedPicker";
import i18n from '@/constants/i18n';
import { useNetworkContext } from '@/constants/NetworkContext';
import createStyling from '@/constants/styling';
import { useClassData } from '@/data/ClassContext';
import { DataManager, useDBitem } from '@/data/datamanager';
import { useUserData } from '@/data/UserDataContext';
import { BlurView } from 'expo-blur';
import { Switch } from 'react-native-paper';

interface updateComunicationProps {
    action: string;
    classid: string;
    title: string;
    content: string;
    date: string;
    time: string;
    urgency: "low" | "medium" | "high";
    requiresConfirmation: boolean;
    confirmationType: "accept" | "message";
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateComunication({action, classid, title, content, date, time, urgency, requiresConfirmation, confirmationType, setLoading, create, alert}: updateComunicationProps) {
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
                requiresConfirmation,
                confirmationType
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
                setLoading(false);
            }).catch(err => {
                alert.show({title: i18n.t("modal.comunication.create.error.title"), message: err});
                setLoading(false);
            })
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
    const [comunicationName, setComunicationName] = useState("");
    const [date, setDate] = useState(new Date());
    const [urgency, setUrgency] = useState("low" as "low" | "medium" | "high");
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState(false);
    const [comunicationDescription, setComunicationDescription] = useState("");
    const params = useLocalSearchParams();
    const classId = params.classid as string;
    const network = useNetworkContext();

    const [bottomHeight, setBottomHeight] = useState(0);

    const userData = useUserData();
    const [loading, setLoading] = useState(false);

    const canProceed = network.serverReachable === true && (comunicationName.length > 0) && (comunicationDescription.length > 0);

    const classData = useClassData();
    useEffect(()=>{
        classData.load();
    }, []);

    const comunicationData = useDBitem(DataManager.comunicationData.db, DataManager.comunicationData.default);

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
                classData.loading ? <ActivityIndicator size="small" color={theme.text} /> : 
                <KeyboardShift>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                        <View style={[commonStyle.dashboardSection, modalStyle.container, {flex: 1}]}>
                            <View style={modalStyle.cardDetails}>
                                <Text style={commonStyle.headerText}>{comunicationName || i18n.t("modal.comunication.create.name.default")}</Text>
                                <Text style={commonStyle.text}>{comunicationDescription || i18n.t("modal.comunication.create.description.default")}</Text>
                                <Text style={commonStyle.text}>{i18n.t("modal.comunication.create.datetime.description", {date: date.toLocaleDateString(), time: date.toLocaleTimeString()})}</Text>
                                {
                                    userData.loading ? 
                                    <ActivityIndicator size="small" color={theme.text} /> :
                                    <Text style={commonStyle.text}>{i18n.t("modal.comunication.create.teacher.text", { teacher: userData.data.name })}</Text>
                                }
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.comunication.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.comunication.create.merge.text", {comunicationName: comunicationName || i18n.t("modal.comunication.create.name.default"), className: classData.data.name})}</Text>
                            </View>
                            <View style={modalStyle.cardEdit}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.input.name.title")}</Text>
                                    <TextInput maxLength={50} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("modal.comunication.create.name.default")} value={comunicationName} onChangeText={text => setComunicationName(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.input.description.title")}</Text>
                                    <TextInput multiline={true} style={modalStyle.cardEditFieldTextArea} placeholder={i18n.t("modal.comunication.create.description.default")} value={comunicationDescription} onChangeText={text => setComunicationDescription(text)}/>
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
                                        Platform.OS === "web" && (
                                            <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                                <input
                                                    type="date"
                                                    style={modalStyle.cardEditFieldInput}
                                                    value={date.toISOString().split("T")[0]}
                                                    onChange={(e: any) => {
                                                        const [y,m,d] = e.target.value.split("-").map(Number);
                                                        const newDate = new Date(date);
                                                        newDate.setFullYear(y);
                                                        newDate.setMonth(m-1);
                                                        newDate.setDate(d);
                                                        setDate(newDate);
                                                    }}
                                                />
                                                <input
                                                    type="time"
                                                    style={modalStyle.cardEditFieldInput}
                                                    value={date.toTimeString().slice(0,5)}
                                                    onChange={(e: any) => {
                                                        const [h,min] = e.target.value.split(":").map(Number);
                                                        const newDate = new Date(date);
                                                        newDate.setHours(h);
                                                        newDate.setMinutes(min);
                                                        setDate(newDate);
                                                    }}
                                                />
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
                                <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between", display: requiresConfirmation ? "flex" : "none"}]}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.comunication.create.confirmationmessage.title")}</Text>
                                    <Switch value={confirmationMessage} onValueChange={setConfirmationMessage} />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={modalStyle.bottomActions} onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                        <BlurView>
                            <TouchableOpacity disabled={!canProceed || loading} onPress={()=>updateComunication({
                                action: "create",
                                classid: classId,
                                title: comunicationName,
                                content: comunicationDescription,
                                date: date.toISOString().split("T")[0],
                                time: date.toISOString().split("T")[1],
                                urgency,
                                requiresConfirmation,
                                confirmationType: confirmationMessage ? "message" : "accept",
                                setLoading,
                                create: comunicationData.create,
                                alert
                            })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                                {loading 
                                    ? <ActivityIndicator size="small" color={theme.text} />
                                    : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.comunication.create.confirm")}</Text>
                                }
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </KeyboardShift>
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