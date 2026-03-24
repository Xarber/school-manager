import { View, Text, ActivityIndicator, TouchableOpacity, Platform, ScrollView, Pressable, Keyboard } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
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

interface updateHomeworkProps {
    action: string;
    classid: string;
    subjectid: string;
    title: string;
    description: string;
    date: string;
    time: string;
    points?: number;
    setLoading: (loading: boolean) => void;
    create: (data: Object) => Promise<any>;
    alert: {
        show: (props: AlertProps) => void;
        hide: () => void;
    }
}

async function updateHomework({action, classid, subjectid, title, description, date, time, points, setLoading, create, alert}: updateHomeworkProps) {
    setLoading(true);
    switch (action) {
        case "create":
            create({
                classid,
                subjectid,
                title,
                description,
                dueDate: `${date} ${time}`,
                points
            }).then(data => {
                alert.show({title: i18n.t("modal.homework.create.success.title"), message: i18n.t("modal.homework.create.success.description"), actions: [
                    {
                        title: i18n.t("modal.homework.create.success.confirm"),
                        onPress: () => {
                            alert.hide();
                            router.back();
                        }
                    }
                ]});
                setLoading(false);
            }).catch(err => {
                alert.show({title: i18n.t("modal.homework.create.error.title"), message: err});
                setLoading(false);
            })
            break;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewHomework() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [subjectMap, setSubjectMap] = useState(({} as {[key: string]: SubjectData}));
    const [homeworkName, setHomeworkName] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [date, setDate] = useState(new Date());
    const [points, setPoints] = useState(undefined);
    const [subjectPickeriOSvisible, setSubjectPickeriOSvisible] = useState(false);
    const [homeworkDescription, setHomeworkDescription] = useState("");
    const params = useLocalSearchParams();
    const classId = params.classid as string;

    const [bottomHeight, setBottomHeight] = useState(0);

    const userData = useUserData();
    const [loading, setLoading] = useState(false);

    const canProceed = (homeworkName.length > 0) && (subjectId.length > 0);

    const classData = useAppDataSync(DataManager.classData.db, `${DataManager.classData.app}:${classId}`, DataManager.classData.default, {
        classid: classId
    });

    const subjectIds = classData.data.subjects;
    let subjects = (Object.values(subjectMap) as SubjectData[])
    .filter((sbj: SubjectData) => typeof sbj === "object" && sbj);

    const homeworkData = useDBitem(DataManager.homeworkData.db, DataManager.homeworkData.default);

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
            <Stack.Screen options={{headerTitle: i18n.t("modal.homework.create.stack.title")}} />
            {subjectIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.subjectData}
                        body={{ subjectid: id }}
                        onLoad={(id, subjectdata) =>
                            setSubjectMap(prev => {
                                if (prev[id]?._id === subjectdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: subjectdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {
                classData.loading ? <ActivityIndicator size="small" color={theme.text} /> : 
                <KeyboardShift>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                        <View style={[commonStyle.dashboardSection, modalStyle.container, {flex: 1}]}>
                            <View style={modalStyle.cardDetails}>
                                <Text style={commonStyle.headerText}>{homeworkName || i18n.t("modal.homework.create.name.default")}</Text>
                                <Text style={commonStyle.text}>{homeworkDescription || i18n.t("modal.homework.create.description.default")}</Text>
                                <Text style={commonStyle.text}>{i18n.t("modal.homework.create.datetime.description", {date: date.toLocaleDateString(), time: date.toLocaleTimeString()})}</Text>
                                {
                                    userData.loading ? 
                                    <ActivityIndicator size="small" color={theme.text} /> :
                                    <Text style={commonStyle.text}>{i18n.t("modal.homework.create.teacher.text", { teacher: userData.data.name })}</Text>
                                }
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.homework.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                                <Text style={[commonStyle.text, {display: "none"}]}>{i18n.t("modal.homework.create.merge.text", {homeworkName: homeworkName || i18n.t("modal.homework.create.name.default"), className: classData.data.name})}</Text>
                            </View>
                            <View style={modalStyle.cardEdit}>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.homework.create.input.name.title")}</Text>
                                    <TextInput maxLength={50} style={modalStyle.cardEditFieldInput} placeholder={i18n.t("modal.homework.create.name.default")} value={homeworkName} onChangeText={text => setHomeworkName(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.homework.create.input.description.title")}</Text>
                                    <TextInput multiline={true} style={modalStyle.cardEditFieldTextArea} placeholder={i18n.t("modal.homework.create.description.default")} value={homeworkDescription} onChangeText={text => setHomeworkDescription(text)}/>
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.homework.create.subject.title")}</Text>
                                    {
                                        Platform.OS === "ios" && (
                                            <>
                                                <TouchableOpacity style={modalStyle.cardEditFieldSelect} onPress={()=>setSubjectPickeriOSvisible(true)}>
                                                    <Text style={modalStyle.cardEditFieldSelectText}>{subjects.find((subject: SubjectData) => subject._id === subjectId)?.name ?? i18n.t("modal.homework.create.subject.select")}</Text>
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
                                                <Picker.Item style={modalStyle.cardEditFieldSelectItem} label={i18n.t("modal.homework.create.subject.select")} value="" enabled={subjectId.length === 0} />
                                                {
                                                    subjects.map((subject: SubjectData) => <Picker.Item style={modalStyle.cardEditFieldSelectItem} key={subject._id} label={subject.name} value={subject._id} />)
                                                }
                                            </Picker>
                                        )
                                    }
                                </View>
                                <View style={modalStyle.cardEditField}>
                                    <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.homework.create.datetime.title")}</Text>
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
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={modalStyle.bottomActions} onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                        <BlurView>
                            <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateHomework({
                                action: "create",
                                title: homeworkName,
                                description: homeworkDescription,
                                date: date.toISOString().split("T")[0],
                                time: date.toISOString().split("T")[1],
                                points: points,
                                classid: classId,
                                subjectid: subjectId,
                                setLoading,
                                create: homeworkData.create,
                                alert
                            })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                                {loading 
                                    ? <ActivityIndicator size="small" color={theme.text} />
                                    : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.homework.create.confirm")}</Text>
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
                                        <Picker.Item label={i18n.t("modal.homework.create.subject.select")} value="" enabled={subjectId.length === 0}/>
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

export default function HomeworkModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewHomework />;
        default:
            return <NewHomework />;
    }
}