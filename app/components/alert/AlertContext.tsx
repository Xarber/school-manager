import React, { createContext, useContext, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";

interface Action {
  title: string;
  onPress?: () => void;
}

export interface AlertProps {
  title: string;
  message: string;
  children?: React.ReactNode;
  actions?: Action[];
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
        <View style={styles.container}>
          <View style={styles.alert}>
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
                    hide();
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
                  <Text style={styles.alertButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      )}

    </AlertContext.Provider>
  );
};