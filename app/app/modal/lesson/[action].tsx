import { View, Text, ActivityIndicator, TouchableOpacity, Platform, ScrollView, Pressable, Keyboard } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useEffect, useState} from "react";
import { TextInput } from 'react-native';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import createStyling from '@/constants/styling';
import { useAppDataSync, DataManager, useDBitem, SubjectData, DataLoader } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import i18n from '@/constants/i18n';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '@/data/UserDataContext';
import { KeyboardShift } from '@/components/keyboardShift';
import { Switch } from 'react-native-paper';
import { useSubjectData } from '@/data/SubjectMapContext';
import { useClassData } from '@/data/ClassContext';
import { useNetworkContext } from '@/constants/NetworkContext';

interface updateLessonProps {
    action: string;
    classid: string;
    subjectid: string;
    title: string;
    description: string;
    date: string;
    time: string;
    room?: string;
    isExam: boolean;
    isScheduled: boolean;
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateLesson({action, classid, isScheduled, subjectid, title, description, date, time, isExam, setLoading, create, alert}: updateLessonProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                classid,
                subjectid,
                title,
                description,
                isScheduled,
                date,
                time,
                isExam
            }).then(data => {
                alert.show({title: i18n.t("modal.lesson.create.success.title"), message: i18n.t("modal.lesson.create.success.description"), actions: [
                    {
                        title: i18n.t("modal.lesson.create.success.confirm"),
                        onPress: () => {
                            alert.hide();
                            router.back();
                        }
                    }
                ]});
                setLoading(false);
            }).catch(err => {
                alert.show({title: i18n.t("modal.lesson.create.error.title"), message: err});
                setLoading(false);
            })
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewLesson() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [lessonName, setLessonName] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [date, setDate] = useState(new Date());
    const [isScheduled, setIsScheduled] = useState(false);
    const [isExam, setIsExam] = useState(false);
    const [subjectPickeriOSvisible, setSubjectPickeriOSvisible] = useState(false);
    const [lessonDescription, setLessonDescription] = useState("");
    const params = useLocalSearchParams();
    const classId = params.classid as string;
    const network = useNetworkContext();

    const [bottomHeight, setBottomHeight] = useState(0);

    const userData = useUserData();
    const [loading, setLoading] = useState(false);

    const canProceed = network.serverReachable === true && (lessonName.length > 0) && (subjectId.length > 0);

    const classData = useClassData();
    useEffect(()=>{
        classData.load();
    }, []);

    let subjects = useSubjectData().subjects;

    const lessonData = useDBitem(DataManager.lessonData.db, DataManager.lessonData.default);

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
    
    if (subjectPickeriOSvisible) Keyboard.dismiss();

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.lesson.create.stack.title")}} />
            {
                classData.loading ? <ActivityIndicator size="small" color={theme.text} /> : 
                <KeyboardShift>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                        <View style={[commonStyle.dashboardSection, modalStyle.container, {flex: 1}]}>
                            <View style={modalStyle.cardDetails}>
                                <Text style={commonStyle.headerText}>{lessonName || i18n.t("modal.lesson.create.name.default")}</Text>
                                <Text style={commonStyle.text}>{lessonDescription || i18n.t("modal.lesson.create.description.default")}</Text>
                                <Text style={commonStyle.text}>{i18n.t("modal.lesson.create.datetime.description", {date: date.toLocaleDateString(), time: date.toLocaleTimeString()})}</Text>
                                {
                                    userData.loading ? 
                                    <ActivityIndicator size="small" color={theme.text} /> :
                                    <Text style={commonStyle.text}>{i18n.t("modal.lesson.create.teacher.text", { teacher: userData.data.name })}</Text>
                                }
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.lesson.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.lesson.create.merge.text", {lessonName: lessonName || i18n.t("modal.lesson.create.name.default"), className: classData.data.name})}</Text>
                            </View>
                            <View style={modalStyle.cardEdit}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.input.name.title")}</Text>
                                    <TextInput maxLength={50} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("modal.lesson.create.name.default")} value={lessonName} onChangeText={text => setLessonName(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.input.description.title")}</Text>
                                    <TextInput multiline={true} style={modalStyle.cardEditFieldTextArea} placeholder={i18n.t("modal.lesson.create.description.default")} value={lessonDescription} onChangeText={text => setLessonDescription(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.subject.title")}</Text>
                                    {
                                        Platform.OS === "ios" && (
                                            <>
                                                <TouchableOpacity style={modalStyle.cardEditFieldSelect} onPress={()=>setSubjectPickeriOSvisible(true)}>
                                                    <Text style={modalStyle.cardEditFieldSelectText}>{subjects.find((subject: SubjectData) => subject._id === subjectId)?.name ?? i18n.t("modal.lesson.create.subject.select")}</Text>
                                                    <Ionicons style={modalStyle.cardEditFieldSelectChevron} name="chevron-down" size={18} color={theme.text} />
                                                </TouchableOpacity>
                                            </>
                                        )
                                    }
                                    {
                                        (Platform.OS === "android" || Platform.OS === "web") && (
                                            <Picker
                                                mode="dropdown"
                                                style={modalStyle.cardEditFieldSelect}
                                                dropdownIconColor={theme.text}
                                                selectedValue={subjectId}
                                                onValueChange={value => setSubjectId(value)}
                                            >
                                                <Picker.Item style={modalStyle.cardEditFieldSelectItem} label={i18n.t("modal.lesson.create.subject.select")} value="" enabled={subjectId.length === 0} />
                                                {
                                                    subjects.map((subject: SubjectData) => <Picker.Item style={modalStyle.cardEditFieldSelectItem} key={subject._id} label={subject.name} value={subject._id} />)
                                                }
                                            </Picker>
                                        )
                                    }
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.datetime.title")}</Text>
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
                                <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between"}]}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.isexam.title")}</Text>
                                    <Switch value={isExam} onValueChange={value => setIsExam(value)}/>
                                </View>
                                <View style={[modalStyle.cardEditField, {flexDirection: "row", justifyContent: "space-between", display: isExam ? "flex" : "none"}]}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.isscheduled.title")}</Text>
                                    <Switch value={isScheduled} onValueChange={value => setIsScheduled(value)}/>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={modalStyle.bottomActions}>
                        <BlurView onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                            <TouchableOpacity disabled={!canProceed || loading} onPress={()=>updateLesson({
                                action: "create",
                                title: lessonName,
                                description: lessonDescription,
                                date: date.toISOString().split("T")[0],
                                time: date.toISOString().split("T")[1],
                                isExam: isExam,
                                classid: classId,
                                subjectid: subjectId,
                                isScheduled: isScheduled && isExam,
                                setLoading,
                                create: lessonData.create,
                                alert
                            })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                                {loading 
                                    ? <ActivityIndicator size="small" color={theme.text} />
                                    : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.lesson.create.confirm")}</Text>
                                }
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                    {
                        Platform.OS === "ios" && 
                        <Pressable onPress={()=>setSubjectPickeriOSvisible(false)} style={[modalStyle.cardEditFieldPickerBackground, !subjectPickeriOSvisible && {display: "none"}]}>
                            <Pressable style={[modalStyle.cardEditFieldPickerView]} onPress={e=>e.stopPropagation()}>
                                <BlurView style={modalStyle.cardEditFieldPickerBlurView}>
                                    <Picker style={modalStyle.cardEditFieldPicker} selectedValue={subjectId} onValueChange={value => {if (value.length > 0) setSubjectId(value)}}>
                                        <Picker.Item label={i18n.t("modal.lesson.create.subject.select")} value="" enabled={subjectId.length === 0}/>
                                        {
                                            subjects.map((subject: SubjectData) => <Picker.Item key={subject._id} label={subject.name} value={subject._id} />)
                                        }
                                    </Picker>
                                </BlurView>
                            </Pressable>
                        </Pressable>
                    }
                </KeyboardShift>
            }
        </>
    );
}

export default function LessonModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewLesson />;
        default:
            return <NewLesson />;
    }
}