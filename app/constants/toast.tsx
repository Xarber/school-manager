import { BaseToast, ErrorToast, InfoToast, BaseToastProps } from 'react-native-toast-message';
import { Theme } from './colors';



const createToastConfig = (theme: Theme) => {
    const toastStyles = {
        backgroundColor: theme.opaqueCard,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
    };
    const toastTextStyles = {
        color: theme.text,
    };
    const toastConfig = {
        success: (props: BaseToastProps) => (
            <BaseToast 
                {...props}
                style={[toastStyles, { borderLeftColor: theme.primary }]}
                text1Style={toastTextStyles}
                text2Style={toastTextStyles}
            />
        ),
        error: (props: BaseToastProps) => (
            <ErrorToast 
                {...props}
                style={[toastStyles, { borderLeftColor: theme.caution }]}
                text1Style={toastTextStyles}
                text2Style={toastTextStyles}
            />
        ),
        info: (props: BaseToastProps) => (
            <InfoToast 
                {...props}
                style={[toastStyles, { borderLeftColor: theme.action }]}
                text1Style={toastTextStyles}
                text2Style={toastTextStyles}
            />
        ),
    };

    return toastConfig;
};

export default createToastConfig;