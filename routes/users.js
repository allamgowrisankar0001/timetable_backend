const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose'); // Added missing import

// In-memory storage fallback
let users = [];

// Save or update user
router.post('/', async (req, res) => {
  try {
    const { uid, name, email, photoURL } = req.body;
    
    // Check if MongoDB is available
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      let user = await User.findOne({ uid });
      
      if (user) {
        // Update existing user
        user.name = name;
        user.email = email;
        user.photoURL = photoURL;
        await user.save();
      } else {
        // Create new user
        user = new User({
          uid,
          name,
          email,
          photoURL
        });
        await user.save();
      }
      
      res.status(200).json(user);
    } else {
      // Use in-memory storage
      let user = users.find(u => u.uid === uid);
      
      if (user) {
        // Update existing user
        user.name = name;
        user.email = email;
        user.photoURL = photoURL;
      } else {
        // Create new user
        user = {
          uid,
          name,
          email,
          photoURL,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        users.push(user);
      }
      
      res.status(200).json(user);
    }
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Get user by UID
router.get('/:uid', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const user = await User.findOne({ uid: req.params.uid });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } else {
      // Use in-memory storage
      const user = users.find(u => u.uid === req.params.uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    }
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router; 