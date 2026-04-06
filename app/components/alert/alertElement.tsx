import { useTheme } from "@/constants/useThemes";
import { Keyboard, Pressable, Text, TouchableOpacity, View } from "react-native";
import createStyling from "@/constants/styling";
import { forwardRef, useImperativeHandle, useState } from "react";
import { AlertProps } from "./AlertContext";
import i18n from "@/constants/i18n";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { addTransparency } from "../actionButtons";

export const AlertElement = forwardRef((props, ref) => {
    const colors = useTheme();
    const styles = createStyling.createAlertStyles(colors);
    const liquidGlass = isLiquidGlassAvailable();
    
    const [visible, setVisible] = useState(false);
    const [alertProps, setAlertProps] = useState<AlertProps | null>(null);
    
    const show = (props: AlertProps) => {
        Keyboard.dismiss();
        if (props.dismissable === undefined && !props.actions) props.dismissable = true;
        else if (!!props.actions) props.dismissable = false;
        setAlertProps(props);
        setVisible(true);
    };
    
    const hide = () => {
        setVisible(false);
    };

    useImperativeHandle(ref, () => ({
        show,
        hide
    }));

    
    return (
        <>
            {visible && alertProps && (
                <Pressable style={styles.container} onPress={alertProps.dismissable ? hide : undefined}>
                    <Pressable style={{ flex: 1, width: "100%", justifyContent: "center", alignItems: "center" }} onPress={(e) => e.stopPropagation()}>
                        <GlassView style={[styles.alert, liquidGlass && { backgroundColor: "transparent" }]}>
                            <Text style={styles.alertHeaderText}>{alertProps.title}</Text>

                            <View style={styles.alertContent}>
                                <Text style={styles.alertText}>{alertProps.message}</Text>
                                {alertProps.children}
                            </View>

                            <View style={styles.alertActions}>
                                {alertProps.actions?.slice(0,2).map((action, i) => {
                                    let buttonBackground = i === 0 ? colors.primary : colors.secondary;
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.alertButton, {backgroundColor: liquidGlass ? addTransparency(buttonBackground, 0.8) : buttonBackground}]}
                                            onPress={() => {
                                                action.onPress?.();
                                                if (!!alertProps.autodismiss) hide();
                                            }}
                                        >
                                            <Text style={styles.alertButtonText}>{action.title}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                {(alertProps.actions ?? []).length === 0 && (
                                    <TouchableOpacity
                                        style={[styles.alertButton, { backgroundColor: liquidGlass ? addTransparency(colors.primary, 0.8) : colors.primary }]}
                                        onPress={() => {
                                            hide();
                                        }}
                                    >
                                        <Text style={styles.alertButtonText}>{i18n.t("components.alert.close.default.text")}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </GlassView>
                    </Pressable>
                </Pressable>
            )}
        </>
    );
});

export default AlertElement;