const express = require('express');
const router = express.Router();
const TimetableEntry = require('../models/TimetableEntry');
const mongoose = require('mongoose');

// Helper to get current week's Monday
function getCurrentWeekMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// In-memory storage fallback
let timetableEntries = [];

// Get all entries for a user for the current week
router.get('/:userId', async (req, res) => {
  try {
    const weekStart = getCurrentWeekMonday();
    console.log(`🔍 Getting entries for user: ${req.params.userId}, week: ${weekStart}`);
    
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      console.log('📊 Using MongoDB for data retrieval');
      const entries = await TimetableEntry.find({ userId: req.params.userId, weekStart });
      console.log(`✅ Found ${entries.length} entries in MongoDB`);
      res.json(entries);
    } else {
      // Use in-memory storage
      console.log('💾 Using in-memory storage for data retrieval');
      const entries = timetableEntries.filter(entry => entry.userId === req.params.userId && new Date(entry.weekStart).getTime() === weekStart.getTime());
      console.log(`✅ Found ${entries.length} entries in memory`);
      res.json(entries);
    }
  } catch (error) {
    console.error('❌ Error getting timetable entries:', error);
    res.status(500).json({ error: 'Failed to get timetable entries', details: error.message });
  }
});

// Add new timetable entry for the current week
router.post('/', async (req, res) => {
  try {
    const { userId, action, status } = req.body;
    const weekStart = getCurrentWeekMonday();
    
    console.log(`➕ Adding new entry:`, { userId, action, weekStart });
    
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      console.log('📊 Using MongoDB for data storage');
      
      // Prevent duplicate actions for the same week
      const exists = await TimetableEntry.findOne({ userId, action, weekStart });
      if (exists) {
        console.log('⚠️ Action already exists for this week');
        return res.status(400).json({ error: 'Action already exists for this week' });
      }
      
      const newEntry = new TimetableEntry({ userId, action, weekStart, status });
      const savedEntry = await newEntry.save();
      console.log('✅ Entry saved to MongoDB:', savedEntry._id);
      res.status(201).json(savedEntry);
    } else {
      // In-memory
      console.log('💾 Using in-memory storage for data storage');
      
      const exists = timetableEntries.find(e => e.userId === userId && e.action === action && new Date(e.weekStart).getTime() === weekStart.getTime());
      if (exists) {
        console.log('⚠️ Action already exists for this week (memory)');
        return res.status(400).json({ error: 'Action already exists for this week' });
      }
      
      const newEntry = {
        _id: `local_${Date.now()}`,
        userId,
        action,
        weekStart,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      timetableEntries.push(newEntry);
      console.log('✅ Entry saved to memory:', newEntry._id);
      res.status(201).json(newEntry);
    }
  } catch (error) {
    console.error('❌ Error adding timetable entry:', error);
    res.status(500).json({ error: 'Failed to add timetable entry', details: error.message });
  }
});

// Update timetable entry (only for current week)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const weekStart = getCurrentWeekMonday();
    
    console.log(`🔄 Updating entry: ${req.params.id}`, { status, weekStart });
    
    if (mongoose.connection.readyState === 1) {
      console.log('📊 Using MongoDB for update');
      const updatedEntry = await TimetableEntry.findOneAndUpdate(
        { _id: req.params.id, weekStart },
        { status },
        { new: true }
      );
      if (!updatedEntry) {
        console.log('❌ Entry not found in MongoDB');
        return res.status(404).json({ error: 'Timetable entry not found for this week' });
      }
      console.log('✅ Entry updated in MongoDB');
      res.json(updatedEntry);
    } else {
      console.log('💾 Using in-memory storage for update');
      const entryIndex = timetableEntries.findIndex(entry => entry._id === req.params.id && new Date(entry.weekStart).getTime() === weekStart.getTime());
      if (entryIndex === -1) {
        console.log('❌ Entry not found in memory');
        return res.status(404).json({ error: 'Timetable entry not found for this week' });
      }
      timetableEntries[entryIndex].status = status;
      timetableEntries[entryIndex].updatedAt = new Date();
      console.log('✅ Entry updated in memory');
      res.json(timetableEntries[entryIndex]);
    }
  } catch (error) {
    console.error('❌ Error updating timetable entry:', error);
    res.status(500).json({ error: 'Failed to update timetable entry', details: error.message });
  }
});

// Delete timetable entry (only for current week)
router.delete('/:id', async (req, res) => {
  try {
    const weekStart = getCurrentWeekMonday();
    
    console.log(`🗑️ Deleting entry: ${req.params.id}`, { weekStart });
    
    if (mongoose.connection.readyState === 1) {
      console.log('📊 Using MongoDB for deletion');
      const deletedEntry = await TimetableEntry.findOneAndDelete({ _id: req.params.id, weekStart });
      if (!deletedEntry) {
        console.log('❌ Entry not found in MongoDB for deletion');
        return res.status(404).json({ error: 'Timetable entry not found for this week' });
      }
      console.log('✅ Entry deleted from MongoDB');
      res.json({ message: 'Timetable entry deleted successfully' });
    } else {
      console.log('💾 Using in-memory storage for deletion');
      const entryIndex = timetableEntries.findIndex(entry => entry._id === req.params.id && new Date(entry.weekStart).getTime() === weekStart.getTime());
      if (entryIndex === -1) {
        console.log('❌ Entry not found in memory for deletion');
        return res.status(404).json({ error: 'Timetable entry not found for this week' });
      }
      timetableEntries.splice(entryIndex, 1);
      console.log('✅ Entry deleted from memory');
      res.json({ message: 'Timetable entry deleted successfully' });
    }
  } catch (error) {
    console.error('❌ Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry', details: error.message });
  }
});

module.exports = router; 