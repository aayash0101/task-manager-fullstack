require('dotenv').config()
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// Verify JWT_SECRET is loaded
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);

// routes
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});