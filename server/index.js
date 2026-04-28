require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://task-manager-fullstack-cu3i.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

connectDB();

console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);

// ✅ Root route fix
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/tasks', require('./routes/taskRoutes'));
app.use('/auth', require('./routes/authRoutes'));

// ✅ Required for Vercel — export the app
module.exports = app;

// ✅ Local dev only
if (process.env.NODE_ENV !== 'production') {
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
}