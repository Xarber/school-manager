const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require("cors");
dotenv.config();

const branch = process.env.BRANCH;

const paths = require('./db/routes/paths.js');

const auth = require("./db/middleware/auth");
const debugTest = require("./db/middleware/test");

const userRoutes = require('./db/routes/users');
const accountRoutes = require('./db/routes/account');
const debugRoutes = require('./db/routes/debug');
const authRoutes = require('./db/routes/auth');

const classesRoutes = require('./db/routes/classes/classes');
const comunicationsRoutes = require('./db/routes/classes/comunications');
const gradesRoutes = require('./db/routes/classes/grades');
const homeworkRoutes = require('./db/routes/classes/homework');
const lessonsRoutes = require('./db/routes/classes/lessons');
const materialsRoutes = require('./db/routes/classes/materials');
const subjectsRoutes = require('./db/routes/classes/subjects');
const invitationRoutes = require('./db/routes/invitation');

mongoose.connect(process.env.MONGODB_URI, {
    dbName: `schoolmanager-${branch}`,
    appName: "SchoolManager-API",
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const app = express();
app.use(cors);
app.use(express.json());
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
app.use('/api/classes/materials', materialsRoutes);
app.use('/api/classes/subjects', subjectsRoutes);
app.use('/api/invitation', invitationRoutes);

// Invalid URL
app.use((req, res) => {
    res.status(404).json({ error: 'Invalid API endpoint' });
});

app.listen(paths.dbPort, () => {
    console.warn(`Server is running on port ${paths.dbPort}.`);
});