import * as React from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'

type Props = {
  children: React.ReactNode,
  extraPadding?: number
}

export const KeyboardShift = ({ children, extraPadding }: Props) => {
  const height = useHeaderHeight()

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={height + (extraPadding || 47)}
      behavior="padding"
      enabled>
      {children}
    </KeyboardAvoidingView>
  )
}