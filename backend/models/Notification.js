// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'reminder'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    default: null // For scheduled reminders
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null // Link to specific event if applicable
  },
  actionUrl: {
    type: String,
    default: null // URL to navigate to when notification is clicked
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
