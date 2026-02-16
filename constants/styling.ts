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
    headerText: {
        color: theme.text,
        fontSize: 24,
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

export default {
    createCommonStyles,
    createHomeScreenStyles,
    createUserLoginStyles,
    createUserProfileStyles,
    createCalendarStyles,
    createRegistryStyles,
}