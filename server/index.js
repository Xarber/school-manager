const express = require('express');
const mongoose = require('mongoose');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const dotenv = require('dotenv');
const cors = require("cors");
const i18n = require("i18n");
const path = require('path');
dotenv.config();

const useLocalDB = process.argv.includes("-l") || process.argv.includes("--local");
let mongod;

const branch = process.env.BRANCH;

i18n.configure({
    locales: ['en', 'it'],
    defaultLocale: 'en',
    directory: path.join(__dirname, 'locales'),
    objectNotation: true,
    autoReload: true,
    updateFiles: false,
    api: {
        '__': 't',
        '__n': 'tn'
    }
});

const paths = require('./db/routes/paths.js');

const auth = require("./db/middleware/auth");
const debugTest = require("./db/middleware/test");
const locales = require("./db/middleware/locales.js");

const userRoutes = require('./db/routes/users');
const accountRoutes = require('./db/routes/account');
const debugRoutes = require('./db/routes/debug');
const authRoutes = require('./db/routes/auth');

const classesRoutes = require('./db/routes/classes/classes');
const comunicationsRoutes = require('./db/routes/classes/comunications');
const gradesRoutes = require('./db/routes/classes/grades');
const homeworkRoutes = require('./db/routes/classes/homework');
const lessonsRoutes = require('./db/routes/classes/lessons');
const scheduledRoutes = require('./db/routes/classes/scheduled');
const materialsRoutes = require('./db/routes/classes/materials');
const subjectsRoutes = require('./db/routes/classes/subjects');
const invitationRoutes = require('./db/routes/invitation');
const uploadRoutes = require('./db/routes/db/upload');

async function connectDB() {
    let mongoDBuri = process.env.MONGODB_URI
    if (useLocalDB) {
        mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: "./db/files/mongo"
            }
        });
        mongoDBuri = mongod.getUri();
        console.warn("[DB] Using local database:", mongoDBuri);
    }

    mongoose.connect(mongoDBuri, {
        dbName: `schoolmanager-${branch}`,
        appName: "SchoolManager-API",
    }).catch(err => {
        console.error('MongoDB connection error:', err);
    });
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
    } catch(e) {}

    if (useLocalDB) try {
        await mongod.stop();
    } catch(e) {}
}

async function startServer() {
    await connectDB();

    const app = express();
    app.use(i18n.init);
    app.use(cors());
    app.use(express.json());
    app.use(locales);
    app.use(debugTest);  // Debug middleware for metrics and testing
    app.use('/api/auth', authRoutes);

    app.use(auth);

    app.use('/api/account', accountRoutes);  // todo: Delete account
    app.use('/api/users', userRoutes);  // Mount routes

    app.use('/api/debug', debugRoutes);

    app.use('/api/classes', classesRoutes);
    app.use('/api/classes/comunications', comunicationsRoutes);
    app.use('/api/classes/grades', gradesRoutes);
    app.use('/api/classes/homework', homeworkRoutes);
    app.use('/api/classes/lessons', lessonsRoutes);
    app.use('/api/classes/scheduled', scheduledRoutes);
    app.use('/api/classes/materials', materialsRoutes);
    app.use('/api/classes/subjects', subjectsRoutes);
    app.use('/api/invitation', invitationRoutes);
    app.use('/api/upload', uploadRoutes);

    // Invalid URL
    app.use((req, res) => {
        console.error('Invalid endpoint accessed:', req.method, req.originalUrl);
        res.status(404).json({ error: req.t("errors.invalid_endpoint") });
    });

    app.listen(paths.dbPort, () => {
        console.warn(`Server is running on port ${paths.dbPort}.`);
    });
}

process.on("SIGINT", async () => {
    disconnectDB();
    process.exit(0);
});

startServer();