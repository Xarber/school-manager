# 🎓 School Manager
Welcome to the school manager repo!
This is an Expo 55 React Native app, built for mobile and web.
School Manager uses Tauri to bundle the web version of the app into a desktop environment app.
Currently, the web app is not the main focus, so there may be more glitches.
Feel free to submit pull requests for improvements, but if you do, run tests on your own side, and possibly describe the changes before submitting the pull request.
Huge changes or undescribed changes will NOT be accepted; all pull requests will be reviewed.

# 🚀 Usage
You may test the latest release of the app through [this site](https://schoolmanager.expo.app/), or you can decide to build the app yourself with the instructions listed below, to install on your personal device.
The app is planned to be posted on app stores, once a first complete build is ready.
> ⚠️ The app's database __WILL BE CLEARED__ once the server is 100% complete and tested. Currently, many routes aren't 100% complete and may have issues. This is a safety measure for data safety.

# ⚙️ Features
* Create multiple classes
* Invite users to your class, or teachers to help manage lessons and homework
* Create multiple subjects for more specific organization of the class
* Add homework and lessons to a specific subject, or comunications to the whole class.
* Sync your account's data between devices with passwordless accounts (receive an OTP code via email)
> ⚠️ This is required for creating and joining classes

# 📋 Roadmap
## [✔️ Completed, ⚙️ In progress, ✧ Future, ? Idea, ❌ Dropped]
* ✔️ React native app project and layouts
* ✔️ Database models
* ✔️ Setup page
* ✔️ Base app components (alerts, lists, etc.)
* ✔️ User account (OTP, automatically managed signup/login, data sync)
* ✔️ Classes
* ✔️ Class invites
* ✔️ Subject creation
* ✔️ Lesson creation + adding to subject
* ✔️ Comunication creation + adding to subject
* ✔️ Homework creation + adding to subject
* ✔️ First app optimization review (fix all warnings and optimize views)
* ⚙️ Calendar page
* ⚙️ Server updates for other components
* ✧ Setting for language switching
* ✧ Setting for notification handling
* ✧ Resources (links to websites or files)
* ✧ Confirmations for comunications (accept, deny, message, read status)
* ✧ Revise server code, check permissions (minor milestone)
* ✧ User grades
* * Find required grade (or grade pair) to reach a goal.
* ✧ Week schedule
* ✧ Scheduled exams (important milestone)
* * Also add specific users only scheduled exams (health matters)
* ✧ Second app optimization review (fix all warnings and optimize views)
* ✧ Request switching account to teacher in-app
* ✧ In-app feedback and feature requests page
* ✧ App animations (for alerts and custom made components)
* ✧ Get platform licenses (important milestone, publish to testflight and distribute beta apks)
* ✧ Push notifications
* ✧ Account token revocation
* ✧ Search tab (crawl through the whole app data locally)
* ✧ Local LLM integration with search tab 
* * No results: find potential matches with LLM
* * Found results: generate related content
* * Manage study sessions + record progress
* * Homework generator (exercises on topic -> pdf output) -> Include guided exercises, scaling to more difficult exercises.
* * Topic summary from uploaded resources
* ✧ Page filters (filter homework/lessons/... by subject, date, etc)
* ✧ Integrate with personal assistant (Siri/Gemini/...)
* ✧ Custom database hosting (huge milestone, manage your own servers through desktop tauri app, integrate with main app with server code)
* ✧ Create schools
* * Check school's institutional email address with OTP code (only one user per email for maximum security)
* * Use QR verification to check if a user is actually from the school (1 minute validity)
* * School events page
* * Documents & modules (for school purposes)
* ? Bridgefy / BLE integration for mesh network (upload and receive encrypted packets hotspot-like)

# 💾 Data Usage
School Manager does not share any user data outside of the app.
App data is hosted with MongoDB Atlas, and as of right now, the actual API endpoint is hosted on Render, using Resend for mailing.
App data is not encrypted yet, avoid storing sensitive data.
Accounts do not use passwords, the sole verification method are OTP codes, effectively dropping account security management to your mailing service.
I do not take responsability for DB data leaks;
If you're going to be hosting your own server, it is up to you to ensure updating the server to the latest version. If a data leak occurs because of an outdated server, the responsability falls upon yourself.

# 🛠️ Building
You can build the web and mobile versions of the app with expo.
If you want to build the tauri app, you will need the rust framework installed, and install the cargo-tauri package.

## 🌎 Web
> Readme in progress...

## 🖥️ Desktop
> Readme in progress...

## 📱 Android
> Readme in progress...

## 📱 iOS
> You will need a MacOS device to build locally.

# Contacts
You can contact me at this email address, for questions, feedback, or any other matter.
**xarber@xcenter.it**