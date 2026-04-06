import i18n from "@/constants/i18n";
import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import React, { createContext, useContext, useRef, useState } from "react";
import { Keyboard, Pressable, Text, TouchableOpacity, View } from "react-native";
import AlertElement from "./alertElement";

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
  const alertRef = useRef<{ show: (props: AlertProps) => void; hide: () => void} | null>(null);

  return (
    <AlertContext.Provider 
      value={{
        show: (props) => alertRef.current?.show(props),
        hide: () => alertRef.current?.hide()
      }}
    >
      {children}

      <AlertElement ref={alertRef} />
    </AlertContext.Provider>
  );
};