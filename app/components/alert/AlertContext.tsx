import i18n from "@/constants/i18n";
import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import React, { createContext, useContext, useState } from "react";
import { Keyboard, Pressable, Text, TouchableOpacity, View } from "react-native";

interface Action {
  title: string;
  onPress?: () => void;
}

export interface AlertProps {
  title: string;
  message: string;
  dismissable?: boolean;
  children?: React.ReactNode;
  actions?: Action[];
  autodismiss?: boolean;
}

export interface AlertContextType {
  show: (props: AlertProps) => void;
  hide: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used inside AlertProvider");
  return ctx;
};

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const colors = useTheme();
  const styles = createStyling.createAlertStyles(colors);

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

  return (
    <AlertContext.Provider value={{ show, hide }}>
      {children}

      {visible && alertProps && (
        <Pressable style={styles.container} onPress={alertProps.dismissable ? hide : undefined}>
          <Pressable style={styles.alert} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.alertHeaderText}>{alertProps.title}</Text>

            <View style={styles.alertContent}>
              <Text style={styles.alertText}>{alertProps.message}</Text>
              {alertProps.children}
            </View>

            <View style={styles.alertActions}>
              {alertProps.actions?.slice(0,2).map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.alertButton, {backgroundColor: i === 0 ? colors.primary : colors.secondary}]}
                  onPress={() => {
                    action.onPress?.();
                    if (!!alertProps.autodismiss) hide();
                  }}
                >
                  <Text style={styles.alertButtonText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
              {(alertProps.actions ?? []).length === 0 && (
                <TouchableOpacity
                  style={[styles.alertButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    hide();
                  }}
                >
                  <Text style={styles.alertButtonText}>{i18n.t("components.alert.close.default.text")}</Text>
                </TouchableOpacity>
              )}
            </View>

          </Pressable>
        </Pressable>
      )}

    </AlertContext.Provider>
  );
};