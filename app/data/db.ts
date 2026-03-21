
import Constants from "expo-constants";
import { Platform } from 'react-native';


const env = Constants.executionEnvironment;
const isProductionBinary = env === "standalone"; // release build created with/without EAS Build
const isWeb = Platform.OS === "web";

let dbpathstmp = {
    development: "",
    release: "",
    allDevPaths: ["http://127.0.0.1:3000", "http://172.20.10.13:3000", "http://192.168.1.168:3000", "http://10.94.102.4:3000"],
    allReleasePaths: ["https://schoolmanager-api.xcenter.it"],
    use: "",
    useArray: [] as string[]
};

if (__DEV__ && !isProductionBinary && !isWeb) {
    dbpathstmp.use = dbpathstmp.allDevPaths[0];
    dbpathstmp.useArray = dbpathstmp.allDevPaths;
}
else {
    dbpathstmp.use = dbpathstmp.allReleasePaths[0];
    dbpathstmp.useArray = dbpathstmp.allReleasePaths;
}

export const dbpaths = {...dbpathstmp};