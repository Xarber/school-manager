import { useHeaderHeight } from '@react-navigation/elements';
import * as React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode,
  extraPadding?: number
}

export const KeyboardShift = ({ children, extraPadding }: Props) => {
  let height = 0;
  try {
    height = useHeaderHeight();
  } catch (e) {}
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={height + insets.top + (extraPadding || 10)}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      enabled>
      {children}
    </KeyboardAvoidingView>
  )
}