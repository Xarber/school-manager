const express = require('express');
const mongoose = require('mongoose');

const paths = require('./db/routes/paths.json');

const auth = require("./db/middleware/auth");

const userRoutes = require('./db/routes/users');
const debugRoutes = require('./db/routes/debug');
const authRoutes = require('./db/routes/auth');

const classesRoutes = require('./db/routes/classes/classes');
const comunicationsRoutes = require('./db/routes/classes/comunications');
const gradesRoutes = require('./db/routes/classes/grades');
const homeworkRoutes = require('./db/routes/classes/homework');
const lessonsRoutes = require('./db/routes/classes/lessons');
const materialsRoutes = require('./db/routes/classes/materials');
const subjectsRoutes = require('./db/routes/classes/subjects');

mongoose.connect(process.env.MONGODB_URI);

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

app.use(auth);
app.use('/api/users', userRoutes);  // Mount routes
/*
app.use('/api/debug', debugRoutes);

app.use('/api/classes', classesRoutes);
app.use('/api/classes/comunications', comunicationsRoutes);
app.use('/api/classes/grades', gradesRoutes);
app.use('/api/classes/homework', homeworkRoutes);
app.use('/api/classes/lessons', lessonsRoutes);
app.use('/api/classes/materials', materialsRoutes);
app.use('/api/classes/subjects', subjectsRoutes);
*/

app.listen(paths.dbPort, () => {
    console.log(`Server is running on port ${paths.dbPort}.`);
});