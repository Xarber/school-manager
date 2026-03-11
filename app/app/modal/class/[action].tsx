import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import {router, Stack, useLocalSearchParams} from "expo-router";
import {useState} from "react";
import { TextInput } from 'react-native';

import createStyling from '@/constants/styling';
import { useAppDataSync, DataManager, useDBitem } from '@/data/datamanager';
import { AlertProps, useAlert } from '@/components/alert/AlertContext';

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
                alert.show({title: "Success", message: "Class created!", actions: [
                    {
                        title: "Okay",
                        onPress: () => {
                            alert.hide();
                            router.back();
                            router.push({pathname: `/(tabs)/profile/class/${data}` as any});
                        }
                    }
                ]});

            }).catch(err => {
                alert.show({title: "Error", message: err});
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
    const [className, setClassName] = useState("New Class");
    const [classDescription, setClassDescription] = useState("This is a new class.");

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);
    const [loading, setLoading] = useState(false);

    const canProceed = className.length > 0 && classDescription.length > 0;

    const classData = useDBitem(DataManager.classData.db);

    const alert = useAlert();

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
                        setLoading,
                        create: classData.create,
                        alert
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