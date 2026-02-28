import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';

import createStyling from '@/constants/styling';
import useAsyncData, { DBKEYS, DBrequest, defaultData, KEYS } from '@/data/datamanager';

interface updateClassProps {
    action: string;
    id?: string;
    name: string;
    description: string;
    setLoading: (loading: boolean) => void;
}

async function updateClass({action, id, name, description, setLoading}: updateClassProps) {
    setLoading(true);
    switch (action) {
        case "create":
            const data = await DBrequest(DBKEYS.classData + DBKEYS.dbCreate, "POST", { name, description });
            if (data.success) {
                alert("Class created");
            }
            setLoading(false);
            return data;
        default:
            setLoading(false);
            return {error: "Invalid action"};
    }
}

function NewClass() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const modalStyle = createStyling.createModalStyles(theme);
    const [className, setClassName] = useState("New Class");
    const [classDescription, setClassDescription] = useState("This is a new class.");

    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const [loading, setLoading] = useState(false);

    const canProceed = className.length > 0 && classDescription.length > 0;

    return (
        <>
            <Stack.Screen options={{headerTitle: "Create a class"}} />
            <View style={[commonStyle.dashboardSection, modalStyle.container]}>
                <View style={modalStyle.cardDetails}>
                    <Text style={commonStyle.headerText}>{className}</Text>
                    {
                        userData.loading ? 
                        <ActivityIndicator size="small" color={theme.primary} /> :
                        <Text style={commonStyle.text}>Teacher: {userData.data.name}</Text>
                    }
                    <Text style={commonStyle.text}>Created on: {new Date().toDateString()}</Text>
                    <Text style={commonStyle.text}>{classDescription}</Text>
                </View>
                <View style={modalStyle.cardEdit}>
                    <View style={modalStyle.cardEditField}>
                        <Text style={modalStyle.cardEditFieldText}>Class Name</Text>
                        <TextInput style={modalStyle.cardEditFieldInput} value={className} onChangeText={text => setClassName(text)}/>
                    </View>

                    <View>
                        <Text style={modalStyle.cardEditFieldText}>Class Description</Text>
                        <TextInput style={modalStyle.cardEditFieldInput} value={classDescription} onChangeText={text => setClassDescription(text)} />
                    </View>
                </View>
                <View style={modalStyle.bottomActions}>
                    <TouchableOpacity disabled={!canProceed && !loading} onPress={()=>updateClass({
                        action: "create",
                        name: className,
                        description: classDescription,
                        setLoading
                    })} style={[modalStyle.bottomActionButton, canProceed ? {} : {backgroundColor: theme.disabled}]}>
                        {loading 
                            ? <ActivityIndicator size="small" />
                            : <Text style={[commonStyle.text, modalStyle.bottomActionButtonText]}>Create</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
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