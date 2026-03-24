import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Platform, Keyboard, Pressable } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';
import { BlurView } from 'expo-blur';

import createStyling from '@/constants/styling';
import { useAppDataSync, DataManager, useDBitem, SubjectData } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';
import i18n from '@/constants/i18n';
import { useUserData } from '@/data/UserDataContext';
import { KeyboardShift } from '@/components/keyboardShift';
import { useClassData } from '@/data/ClassContext';
import { useSubjectData } from '@/data/SubjectMapContext';
import Timeline from '@/components/timeline';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface updatePeriodProps {
    day: number,
    classData: any,
    period: {startTime: string, endTime: string, subjects: string[]},
    setLoading: (loading: boolean) => void,
    alert: {
        show: (e: AlertProps) => void,
        hide: () => void
    }
}

async function updatePeriod({day, classData, period, setLoading, alert}: updatePeriodProps) {
    setLoading(true);
    let currentSchedule = classData.data.schedule.find((s: {day: number}) => s.day === day) ?? {day, hours: []};
    let filteredSchedule = classData.data.schedule.filter((s: {day: number}) => s.day !== day);

    classData.save({
        ...classData.data,
        schedule: [
            ...filteredSchedule,
            {
                day,
                hours: [
                    ...currentSchedule.hours,
                    {
                        startTime: period.startTime,
                        endTime: period.endTime,
                        subjects: period.subjects
                    }
                ],
                addedAt: currentSchedule.addedAt ?? new Date().toISOString(),
                editedAt: Date.now()
            }
        ]
    }).then(() => {
        alert.show({title: i18n.t("modal.schedule.create.success.title"), message: i18n.t("modal.schedule.create.success.description"), actions: [
            {
                title: i18n.t("modal.schedule.create.success.confirm"),
                onPress: () => {
                    alert.hide();
                    router.back();
                }
            }
        ]});
        setLoading(false);
    }).catch((err: any) => {
        alert.show({title: i18n.t("modal.schedule.create.error.title"), message: err});
        setLoading(false);
    })
}

function NewSchedule() {
    const [loading, setLoading] = useState(false);

    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);

    const params = useLocalSearchParams();
    
    const [h1, m1] = [9, 0];
    const [h2, m2] = [10, 0];
    const [d1, d2] = [new Date(), new Date()];

    d1.setHours(h1, m1, 0, 0);
    d2.setHours(h2, m2, 0, 0);

    const [startTime, setStartTime] = useState(d1);
    const [endTime, setEndTime] = useState(d2);

    const startTimeText = `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;
    const endTimeText = `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

    const [periodSubjects, setPeriodSubjects] = useState<string[]>([]);
    const [subjectPickeriOSvisible, setSubjectPickeriOSvisible] = useState(false);
    const [addingPeriod, setAddingPeriod] = useState("");

    const [bottomHeight, setBottomHeight] = useState(0);

    const userData = useUserData();

    const canProceed = startTime && endTime && endTime.getTime() > startTime.getTime();

    const classData = useClassData();
    let subjects = useSubjectData().subjects;

    const alert = useAlert();
    const day = Number(params.day);

    const showStartMode = (currentMode: "date" | "time") => {
        DateTimePickerAndroid.open({
            value: startTime,
            onChange: (e: any, d: Date | undefined)=>{
                setStartTime(d || startTime);
            },
            mode: currentMode,
            is24Hour: true,
        });
    };

    const showEndMode = (currentMode: "date" | "time") => {
        DateTimePickerAndroid.open({
            value: endTime,
            onChange: (e: any, d: Date | undefined)=>{
                setEndTime(d || endTime);
            },
            mode: currentMode,
            is24Hour: true,
        });
    };
    
    if (subjectPickeriOSvisible) Keyboard.dismiss();

    const periodData = {
        startTime: startTimeText,
        endTime: endTimeText,
        subjects: periodSubjects
    };

    return (
        <>
            <Stack.Screen options={{headerTitle: i18n.t("modal.subject.create.stack.title")}} />
            {
                classData.loading ? <ActivityIndicator size="small" color={theme.text} /> : 
                <KeyboardShift>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: bottomHeight}}>
                        <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                            <View style={modalStyle.cardDetails}>
                                <View style={{ padding: 20, paddingBottom: 0 }}>
                                    <Text style={commonStyle.headerText}>{i18n.t("components.calendar.localeconfig.dayNames")[day]}</Text>
                                </View>
                                <Timeline periods={[{startTime: startTimeText, endTime: endTimeText, items: (periodSubjects).map((e: string)=>{
                                    if (!subjects.find((s: SubjectData) => s._id === e)) return null;
                                    let sub = subjects.find((s: SubjectData) => s._id === e);
                                    return {
                                        title: sub.name
                                    };
                                }).filter(e => e != null)}]} />
                                <Text style={commonStyle.text}>{i18n.t("modal.schedule.create.createdon.text", {createdOn: new Date().toDateString()})}</Text>
                                <Text style={commonStyle.text}>{i18n.t("modal.schedule.create.merge.text", {className: classData.data.name})}</Text>
                            </View>
                            <View style={modalStyle.cardEdit}>
                                {/* <View style={{ display: "flex", flexDirection: "row", gap: 10}}> */}
                                    <View style={[modalStyle.cardEditField, {flex: 1}]}>
                                        <Text style={[commonStyle.headerText, modalStyle.cardEditFieldText]}>{i18n.t("modal.schedule.create.datetime.startTitle")}</Text>
                                        {
                                            Platform.OS === "android" && (
                                                <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                                    <TouchableOpacity style={[commonStyle.button, {backgroundColor: theme.opaqueCard}]} onPress={()=>showStartMode("time")}>
                                                        <Text style={commonStyle.text}>{startTimeText}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        }
                                        {
                                            Platform.OS === "web" && (
                                                <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                                    <input
                                                        type="time"
                                                        style={modalStyle.cardEditFieldInput}
                                                        value={startTime.toTimeString().slice(0,5)}
                                                        onChange={(e: any) => {
                                                            const [h,min] = e.target.value.split(":").map(Number);
                                                            const newDate = new Date(startTime);
                                                            newDate.setHours(h);
                                                            newDate.setMinutes(min);
                                                            setStartTime(newDate);
                                                        }}
                                                    />
                                                </View>
                                            )
                                        }
                                        {
                                            Platform.OS === "ios" && <DateTimePicker
                                                value={startTime}
                                                mode="time"
                                                display="default"
                                                onChange={(e, d) => setStartTime(d || startTime)}
                                            />
                                        }
                                    </View>
                                    <View style={[modalStyle.cardEditField, {flex: 1}]}>
                                        <Text style={[commonStyle.headerText, modalStyle.cardEditFieldText]}>{i18n.t("modal.schedule.create.datetime.endTitle")}</Text>
                                        {
                                            Platform.OS === "android" && (
                                                <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                                    <TouchableOpacity style={[commonStyle.button, {backgroundColor: theme.opaqueCard}]} onPress={()=>showEndMode("time")}>
                                                        <Text style={commonStyle.text}>{endTimeText}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        }
                                        {
                                            Platform.OS === "web" && (
                                                <View style={{display: "flex", flexDirection: "row", gap: 10}}>
                                                    <input
                                                        type="time"
                                                        style={modalStyle.cardEditFieldInput}
                                                        value={endTime.toTimeString().slice(0,5)}
                                                        onChange={(e: any) => {
                                                            const [h,min] = e.target.value.split(":").map(Number);
                                                            const newDate = new Date(endTime);
                                                            newDate.setHours(h);
                                                            newDate.setMinutes(min);
                                                            setEndTime(newDate);
                                                        }}
                                                    />
                                                </View>
                                            )
                                        }
                                        {
                                            Platform.OS === "ios" && <DateTimePicker
                                                value={endTime}
                                                mode="time"
                                                display="default"
                                                onChange={(e, d) => setEndTime(d || endTime)}
                                            />
                                        }
                                    </View>
                                {/* </View> */}
                                <View style={modalStyle.cardEditField}>
                                    <Text style={[commonStyle.headerText, modalStyle.cardEditFieldText]}>{i18n.t("modal.schedule.create.subjects.title")}</Text>
                                    <View style={{ gap: 10 }}>
                                        {periodSubjects.map((subject, index) => {
                                            if (!subjects.find((s: SubjectData) => s._id === subject)) return null;
                                            let sub = subjects.find((s: SubjectData) => s._id === subject);
                                            return (
                                                <View key={index} style={[commonStyle.card, { display: "flex", flexDirection: "row", alignItems: "center", gap: 10}]}>
                                                    <Text style={[commonStyle.text, { flex: 1 }]}>{sub.name}</Text>
                                                    <Ionicons name="close-circle" size={24} color={theme.text} onPress={() => {
                                                        setPeriodSubjects(periodSubjects.filter((s, i) => i !== index));
                                                    }} />
                                                </View>
                                            )
                                        })}
                                    </View>
                                    <View style={modalStyle.cardEditField}>
                                        <Text style={modalStyle.cardEditFieldText}>{i18n.t("modal.schedule.create.subjects.addtitle")}</Text>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10, flex: 1, alignItems: "center" }}>
                                            {
                                                Platform.OS === "ios" && (
                                                    <>
                                                        <TouchableOpacity style={[modalStyle.cardEditFieldSelect, {flex: 1, width: "auto"}]} onPress={()=>setSubjectPickeriOSvisible(true)}>
                                                            <Text style={modalStyle.cardEditFieldSelectText}>{subjects.find((e: SubjectData)=>e._id === addingPeriod)?.name ?? i18n.t("modal.schedule.create.subjects.select")}</Text>
                                                            <Ionicons style={modalStyle.cardEditFieldSelectChevron} name="chevron-down" size={18} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </>
                                                )
                                            }
                                            {
                                                (Platform.OS === "android" || Platform.OS === "web") && (
                                                    <Picker
                                                        mode="dropdown"
                                                        style={[modalStyle.cardEditFieldSelect, {flex: 1}]}
                                                        dropdownIconColor={theme.text}
                                                        selectedValue={addingPeriod}
                                                        onValueChange={value => setAddingPeriod(value)}
                                                    >
                                                        <Picker.Item style={modalStyle.cardEditFieldSelectItem} label={i18n.t("modal.schedule.create.subjects.select")} value="" enabled={addingPeriod.length === 0} />
                                                        {
                                                            subjects.map((subject: any) => <Picker.Item style={modalStyle.cardEditFieldSelectItem} key={subject._id} label={subject.name} value={subject._id} />)
                                                        }
                                                    </Picker>
                                                )
                                            }
                                            <TouchableOpacity style={[]} onPress={()=>{
                                                if (addingPeriod.length > 0) {
                                                    setPeriodSubjects([...periodSubjects, addingPeriod]);
                                                }
                                                setAddingPeriod("");
                                            }}>
                                                <Ionicons style={modalStyle.cardEditFieldSelectChevron} name="add-circle" size={24} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={modalStyle.bottomActions} onLayout={e => setBottomHeight(e.nativeEvent.layout.height + 40)}>
                        <BlurView>
                            <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updatePeriod({
                                day,
                                classData,
                                period: periodData,
                                setLoading,
                                alert
                            })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                                {loading
                                    ? <ActivityIndicator size="small" color={theme.text} />
                                    : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>{i18n.t("modal.schedule.create.confirm")}</Text>
                                }
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                    {
                        Platform.OS === "ios" && 
                        <Pressable onPress={()=>setSubjectPickeriOSvisible(false)} style={[modalStyle.cardEditFieldPickerBackground, !subjectPickeriOSvisible && {display: "none"}]}>
                            <Pressable style={[modalStyle.cardEditFieldPickerView]} onPress={e=>e.stopPropagation()}>
                                <BlurView style={modalStyle.cardEditFieldPickerBlurView}>
                                    <Picker style={modalStyle.cardEditFieldPicker} selectedValue={addingPeriod} onValueChange={value => {if (value.length > 0) setAddingPeriod(value)}}>
                                        <Picker.Item label={i18n.t("modal.schedule.create.subjects.select")} value="" enabled={addingPeriod.length === 0}/>
                                        {
                                            subjects.map((subject: any) => <Picker.Item key={subject._id} label={subject.name} value={subject._id} />)
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

export default function ScheduleModal() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const page = params.action;

    switch (page) {
        case "create":
            return <NewSchedule />;
        default:
            return <NewSchedule />;
    }
}