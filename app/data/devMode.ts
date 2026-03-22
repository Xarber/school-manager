import Constants from "expo-constants";
import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";
export const env = Constants.executionEnvironment;
export const isProductionBinary = env === "standalone";
export const devMode = (__DEV__ && !isProductionBinary);