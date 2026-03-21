
import Constants from "expo-constants";
import { Platform } from 'react-native';


const env = Constants.executionEnvironment;
const isProductionBinary = env === "standalone"; // release build created with/without EAS Build
const isWeb = Platform.OS === "web";

let dbpathstmp = {
    development: "http://127.0.0.1:3000",
    allDevPaths: ["http://127.0.0.1:3000", "http://192.168.1.168:3000", "http://10.94.102.4:3000"],
    release: 'https://schoolmanager-api.xcenter.it',
    use: ""
};

if (__DEV__ && !isProductionBinary && !isWeb) dbpathstmp.use = dbpathstmp.development;
else dbpathstmp.use = dbpathstmp.release;

export const dbpaths = {...dbpathstmp};