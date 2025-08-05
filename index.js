const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for fallback
let users = [];
let timetableEntries = [];

// MongoDB Connection with fallback
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.log('MongoDB not available, using in-memory storage');
    return false;
  }
};

// Initialize database connection
let dbConnected = false;
connectDB().then(connected => {
  dbConnected = connected;
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/timetable', require('./routes/timetable'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbConnected ? 'MongoDB' : 'In-Memory'
  });
});

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Database: ${dbConnected ? 'MongoDB' : 'In-Memory Storage'}`);
}); 