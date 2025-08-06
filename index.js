const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
const allowedOrigins = [
  'https://time-table-tracker.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// app.use(cors());
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
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Database URL:', config.MONGODB_URI);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Using in-memory storage as fallback');
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
    database: dbConnected ? 'MongoDB' : 'In-Memory',
    timestamp: new Date().toISOString()
  });
});

// Test MongoDB connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ 
        status: 'Connected', 
        message: 'MongoDB is connected and working',
        readyState: mongoose.connection.readyState
      });
    } else {
      res.json({ 
        status: 'Disconnected', 
        message: 'MongoDB is not connected',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: error.message 
    });
  }
});

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📊 Database: ${dbConnected ? 'MongoDB' : 'In-Memory Storage'}`);
  console.log(`🌐 Health check: http://localhost:${config.PORT}/api/health`);
  console.log(`🔍 Test DB: http://localhost:${config.PORT}/api/test-db`);
}); 
