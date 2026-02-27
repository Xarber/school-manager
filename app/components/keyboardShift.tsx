import * as React from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode,
  extraPadding?: number
}

export const KeyboardShift = ({ children, extraPadding }: Props) => {
  const height = useHeaderHeight();
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