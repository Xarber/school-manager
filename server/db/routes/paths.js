const port = process.env.PORT || 3000;
const paths = {
    "dbPort": port,
    "dbUpdate": "/update",
    "dbCreate": "/add",
    "dbDelete": "/delete",
    "dbGet": "/get",
    "dbMe": "/me",

    "authenticate": "/send",
    "authenticateOtp": "/verify",
    "accountRegisterForPushNotifications": "/register-push",
    "accountUnregisterForPushNotifications": "/unregister-push",
};

module.exports = paths;