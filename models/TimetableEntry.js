const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  status: {
    Monday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Tuesday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Wednesday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Thursday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Friday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Saturday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    },
    Sunday: {
      type: String,
      enum: ['yes', 'no', null],
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema); 