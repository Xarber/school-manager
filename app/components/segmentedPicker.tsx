import React, { useEffect } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface SegmentedSliderProps<T extends string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  height?: number
}

export default function SegmentedSlider<T extends string>({
  options,
  value,
  onChange,
  height = 36
}: SegmentedSliderProps<T>) {

    const width = useSharedValue(0)
    const translateX = useSharedValue(5)

    const index = options.indexOf(value)

    useEffect(() => {
        if (width.value === 0) return
        const segmentWidth = width.value / options.length
        translateX.value = withTiming(5 + segmentWidth * index, { duration: 180 })
    }, [value])

    const onLayout = (e: LayoutChangeEvent) => {
        width.value = e.nativeEvent.layout.width
    }

    const sliderStyle = useAnimatedStyle(() => {
        const segmentWidth = width.value / options.length
        return {
            width: segmentWidth - 10,
            transform: [{ translateX: translateX.value }]
        }
    })

    return (
        <View style={[styles.container, { height: height  }]} onLayout={onLayout}>
            <Animated.View style={[styles.slider, sliderStyle]} />

            {options.map(opt => (
                <Pressable
                    key={opt}
                    style={styles.segment}
                    onPress={() => onChange(opt)}
                >
                <Text style={[
                    styles.text,
                    value === opt && styles.textActive
                ]}>
                    {opt}
                </Text>
                </Pressable>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#1f1f1f",
        borderRadius: 12,
        overflow: "hidden",
        padding: 5
    },

    slider: {
        position: "absolute",
        height: "100%",
        backgroundColor: "#2f2f2f",
        borderRadius: 10,
        top: 5,
        bottom: 5,
    },

    segment: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    text: {
        fontWeight: "500",
        color: "#aaa"
    },

    textActive: {
        color: "white",
        fontWeight: "600"
    }
})