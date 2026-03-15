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
import { useUserData } from '@/data/UserDataContext';
import { KeyboardShift } from '@/components/keyboardShift';

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
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateLesson({action, classid, subjectid, title, description, date, time, isExam, setLoading, create, alert}: updateLessonProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                classid,
                subjectid,
                title,
                description,
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
            }).catch(err => {
                alert.show({title: i18n.t("modal.lesson.create.error.title"), message: err});
            })
            setLoading(false);
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
    const [lessonName, setLessonName] = useState(i18n.t("modal.lesson.create.name.default"));
    const [subjectId, setSubjectId] = useState("");
    const [date, setDate] = useState(new Date());
    const [isExam, setIsExam] = useState(false);
    const [subjectPickeriOSvisible, setSubjectPickeriOSvisible] = useState(false);
    const [lessonDescription, setLessonDescription] = useState(i18n.t("modal.lesson.create.description.default"));
    const params = useLocalSearchParams();
    const classId = params.classid as string;

    const userData = useUserData();
    const [loading, setLoading] = useState(false);

    const canProceed = (lessonName.length > 0) && (subjectId.length > 0);

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId,
        populate: ["subjects"]
    });

    const lessonData = useDBitem(DataManager.lessonData.db);

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
            <Stack.Screen options={{headerTitle: i18n.t("modal.lesson.create.stack.title")}} />
            {
                classData.loading ? <ActivityIndicator size="small" /> : 
                <KeyboardShift>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        <View style={[commonStyle.dashboardSection, modalStyle.container, {flex: 1}]}>
                            <View style={modalStyle.cardDetails}>
                                <Text style={commonStyle.headerText}>{lessonName}</Text>
                                <Text style={commonStyle.text}>{lessonDescription}</Text>
                                <Text style={commonStyle.text}>{i18n.t("modal.lesson.create.datetime.description", {date: date.toLocaleDateString(), time: date.toLocaleTimeString()})}</Text>
                                {
                                    userData.loading ? 
                                    <ActivityIndicator size="small" color={theme.primary} /> :
                                    <Text style={commonStyle.text}>{i18n.t("modal.lesson.create.teacher.text", { teacher: userData.data.name })}</Text>
                                }
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.lesson.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.lesson.create.merge.text", {lessonName: lessonName, className: classData.data.name})}</Text>
                            </View>
                            <View style={modalStyle.cardEdit}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.input.name.title")}</Text>
                                    <TextInput style={modalStyle.cardEditFieldInput} value={lessonName} onChangeText={text => setLessonName(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.input.description.title")}</Text>
                                    <TextInput multiline={true} style={modalStyle.cardEditFieldTextArea} value={lessonDescription} onChangeText={text => setLessonDescription(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.lesson.create.subject.title")}</Text>
                                    {
                                        Platform.OS === "ios" && (
                                            <>
                                                <TouchableOpacity style={modalStyle.cardEditFieldSelect} onPress={()=>setSubjectPickeriOSvisible(true)}>
                                                    <Text style={modalStyle.cardEditFieldSelectText}>{classData.data.subjects.find((subject: SubjectData) => subject._id === subjectId)?.name ?? i18n.t("modal.lesson.create.subject.select")}</Text>
                                                    <Ionicons style={modalStyle.cardEditFieldSelectChevron} name="chevron-down" size={18} color={theme.text} />
                                                </TouchableOpacity>
                                            </>
                                        )
                                    }
                                    {
                                        Platform.OS === "android" && (
                                            <Picker
                                                mode="dropdown"
                                                style={modalStyle.cardEditFieldSelect}
                                                dropdownIconColor={theme.text}
                                                selectedValue={subjectId}
                                                onValueChange={value => setSubjectId(value)}
                                            >
                                                <Picker.Item style={modalStyle.cardEditFieldSelectItem} label={i18n.t("modal.lesson.create.subject.select")} value="" enabled={subjectId.length === 0} />
                                                {
                                                    classData.data.subjects.map((subject: SubjectData) => <Picker.Item style={modalStyle.cardEditFieldSelectItem} key={subject._id} label={subject.name} value={subject._id} />)
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
                                        Platform.OS === "ios" && <DateTimePicker 
                                            value={date}
                                            mode="datetime"
                                            display="default"
                                            onChange={updateDate}
                                        />
                                    }
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={modalStyle.bottomActions}>
                        <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateLesson({
                            action: "create",
                            title: lessonName,
                            description: lessonDescription,
                            date: date.toISOString().split("T")[0],
                            time: date.toISOString().split("T")[1],
                            isExam: isExam,
                            classid: classId,
                            subjectid: subjectId,
                            setLoading,
                            create: lessonData.create,
                            alert
                        })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                            {loading 
                                ? <ActivityIndicator size="small" />
                                : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.lesson.create.confirm")}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                    {
                        Platform.OS === "ios" && 
                        <Pressable onPress={()=>setSubjectPickeriOSvisible(false)} style={[modalStyle.cardEditFieldPickerBackground, !subjectPickeriOSvisible && {display: "none"}]}>
                            <Pressable style={[modalStyle.cardEditFieldPickerView]} onPress={e=>e.stopPropagation()}>
                                <BlurView style={modalStyle.cardEditFieldPickerBlurView}>
                                    <Picker style={modalStyle.cardEditFieldPicker} selectedValue={subjectId} onValueChange={value => {if (value.length > 0) setSubjectId(value)}}>
                                        <Picker.Item label={i18n.t("modal.lesson.create.subject.select")} value="" enabled={subjectId.length === 0}/>
                                        {
                                            classData.data.subjects.map((subject: SubjectData) => <Picker.Item key={subject._id} label={subject.name} value={subject._id} />)
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