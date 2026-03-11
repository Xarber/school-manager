import { StyleSheet } from 'react-native';
import { Theme } from './colors';

const createCommonStyles = (theme: Theme) => StyleSheet.create({
    /* General Styles */
    mainView: {
        backgroundColor: theme.background,
    },
    text: {
        color: theme.text,
    },
    buttonText: {
        color: "white",
    },
    headerText: {
        color: theme.text,
        fontSize: 24,
        fontWeight: "bold",
    },
    card: {
        backgroundColor: theme.card,
        padding: 15,
        borderRadius: 10,
    },
    wideButton: {
        backgroundColor: theme.primary,
        padding: 15,
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 5,
        width: "100%",
        alignItems: "center"
    },
    button: {
        backgroundColor: theme.primary,
        padding: 10,
        borderRadius: 10,
        alignItems: "center"
    },
    listUserElement: {
        display: "flex",
        flexDirection: "row",
        gap: 10
    },
    listUserElementIcon: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.text,
    },
    listUserElementText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    /* Dashboard Component */
    dashboardSection: {
        display: "flex",
        gap: 10,
        padding: 10,
        borderRadius: 8,
    },
    dashboardSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.text,
    },
    dashboardSectionContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: theme.card,
        padding: 10,
        borderRadius: 8,
        gap: 10,
    },
    dashboardSectionItem: {
        display: "flex",
        flexDirection: "row",
        gap: 5,

        flexGrow: 1,
        padding: 10,
        backgroundColor: theme.card,
        borderRadius: 8,
    },
    dashboardSectionItemIcon: {
        width: 34,
        height: 34,
        borderRadius: 8,
    },
    dashboardSectionItemText: {
        fontSize: 16,
        fontWeight: "900",
    },
    dashboardSectionItemContent: { flex: 1, display: "flex", flexDirection: "row", justifyContent: "space-between"},
    dashboardSectionItemTextContainer: { display: "flex", flexDirection: "column", gap: 2 },
    dashboardSectionItemBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        height: 25,
        borderRadius: 360,
        color: theme.text,
        fontSize: 12,
        fontWeight: "bold",
    },

    /* User Grades Component */
    userGrades: {
        display: "flex",
        flexDirection: "row",
        gap: 10,
    },

    /* Action Menu Component */
    actionMenuContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: theme.card,
        padding: 10,
        borderRadius: 8,
        gap: 10,
        alignItems: "flex-start",  // Key fix: prevents row height stretching to tallest item
    },
    actionMenuItemContainer: {
        flexBasis: 0,  // Targets 3 per row (33.333%), minus ~gap/3 (10px gap / 3 rows)
        flexGrow: 1,
        flex: 3,
        minWidth: 120,
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        gap: 5,
        backgroundColor: theme.card,
        borderRadius: 8,
    },
    actionMenuItem: {
        color: theme.text,
        fontWeight: "bold",
        textAlign: "center",
        flexShrink: 1,  // Allows text to wrap if very long
    },

    clipboardTextContainer: {
        backgroundColor: theme.card,
        padding: 10,
        borderRadius: 8,
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        margin: 10,
        gap: 10,
    },
    clipboardText: {
        flexGrow: 1,
        color: theme.text,
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
    clipboardTextCopy: {
        borderRadius: 8,
        padding: 5,
        backgroundColor: theme.card,
        color: "white",
        fontWeight: "bold",
    }
});

const createHomeScreenStyles = (theme: Theme) => StyleSheet.create({
    welcomeText: {
        paddingTop: 20,
        paddingLeft: 20,
        fontSize: 24,
        marginTop: 25,
        marginLeft: 10,
        color: theme.text,
    },

    dashboard: {
        padding: 20,
        display: "flex",
        borderRadius: 15,
        gap: 10,
    },
    dashboardSectionHeader: {
        height: 120,
    }
});

const createUserLoginStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
        padding: 20,
    },
    input: {
        width: '80%',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: theme.text,
        borderRadius: 5,
        color: theme.text,
    },
    button: {
        backgroundColor: theme.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

const createUserProfileStyles = (theme: Theme) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    text: {
        color: theme.text,
        fontSize: 18,
    },
});

const createCalendarStyles = (theme: Theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.background,
    },
});

const createRegistryStyles = (theme: Theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.background,
        padding: 20,
    },
});

const createWelcomescreenStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        padding: 20,
        display: "flex",
        gap: 10
    },
    topView: {
        maxHeight: "45%",
    },
    topViewImage: {
        width: "80%",
        height: "100%",
        margin: "auto",
        resizeMode: "contain"
    },
    bottomView: {
        flex: 1,
        display: "flex",
        gap: 10
    },
    bottomViewHeader: {
        
    },
    bottomViewHeaderTitle: {
        color: theme.text,
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center"
    },
    bottomViewBody: {
        flex: 1,
        display: "flex",
        gap: 10
    },
    bottomViewBodyText: {
        color: theme.text,
        fontSize: 18,
        textAlign: "center"
    },
    actions: {
        width: "100%",
        minHeight: 60,
        display: "flex",
        gap: 10,
    },
    actionsButton: {
        width: "100%",
        height: 60,
        backgroundColor: theme.primary,
        borderRadius: 15,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    actionsButtonText: {
        color: "white", //theme.text,
        fontSize: 18,
        fontWeight: "bold"
    },
    bottomViewBodyInput: {
        width: "100%",
        height: 50,
        backgroundColor: theme.card,
        borderRadius: 15,
        color: theme.text,
        textAlign: "center",
        paddingLeft: 15,
        paddingRight: 15
    },
    bottomViewBodyForm: {
        paddingTop: 30,
        display: "flex",
        gap: 20
    },
    bottomViewBodyFormField: {
        display: "flex",
        gap: 10
    },
    bottomViewBodyFormFieldText: {
        color: theme.text,
        fontSize: 18,
        textAlign: "left"
    },
    bottomViewBodyFormFieldInput: {
        width: "100%",
        height: 50,
        backgroundColor: theme.card,
        borderRadius: 15,
        color: theme.text,
        textAlign: "left",
        paddingLeft: 15,
        paddingRight: 15
    },
});

const createModalStyles = (theme: Theme) => StyleSheet.create({
    container: {
        display: "flex",
        flex: 1,
        gap: 20,
        padding: 20,
    },

    cardEdit: {
        display: "flex",
        gap: 15,
    },
    cardDetails: {
        display: "flex",
        gap: 10,
        borderWidth: 1,
        borderRadius: 15,
        borderColor: theme.primary,
        padding: 15,
    },

    cardEditField: {
        display: "flex",
        gap: 10
    },
    cardEditFieldText: {
        color: theme.text,
        fontSize: 18,
        textAlign: "left"
    },
    cardEditFieldInput: {
        width: "100%",
        height: 50,
        backgroundColor: theme.card,
        borderRadius: 15,
        color: theme.text,
        textAlign: "left",
        paddingLeft: 15,
        paddingRight: 15
    },

    bottomActions: {
        position: "absolute",
        bottom: 40,
        right: 40,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end"
    },
    bottomActionButton: {
        backgroundColor: theme.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 360,
    },
    bottomActionButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold"
    }
});

const createAlertStyles = (theme: Theme) => StyleSheet.create({
    container: {
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        padding: 20
    },
    alert: {
        display: "flex",
        gap: 20,
        padding: 20,
        backgroundColor: theme.opaqueCard,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
        borderRadius: 15,
    },
    alertHeaderText: {
        color: theme.text,
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center"
    },
    alertContent: {
        display: "flex",
        gap: 10,
        padding: 10
    },
    alertText: {
        color: theme.text,
        fontSize: 18,
        textAlign: "center"
    },
    alertActions: {
        display: "flex",
        flexDirection: "row",
        gap: 10
    },
    alertButton: {
        width: "100%",
        height: 50,
        backgroundColor: theme.primary,
        borderRadius: 15,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    alertButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold"
    }
});

export default {
    createCommonStyles,
    createAlertStyles,
    createHomeScreenStyles,
    createUserLoginStyles,
    createUserProfileStyles,
    createCalendarStyles,
    createRegistryStyles,
    createWelcomescreenStyles,
    createModalStyles
}