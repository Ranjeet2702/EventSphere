// backend/routes/notifications.js
const express = require('express');
const verifyToken = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Event = require('../models/Event');

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Create a new notification (for internal use)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, message, type, scheduledFor, eventId, actionUrl } = req.body;
    
    const notification = new Notification({
      userId: req.user.id,
      title,
      message,
      type: type || 'info',
      scheduledFor,
      eventId,
      actionUrl
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Create a reminder for an event
router.post('/reminder', verifyToken, async (req, res) => {
  try {
    const { eventId, reminderTime } = req.body;
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if reminder already exists
    const existingReminder = await Notification.findOne({
      userId: req.user.id,
      eventId,
      type: 'reminder'
    });
    
    if (existingReminder) {
      return res.status(400).json({ error: 'Reminder already exists for this event' });
    }
    
    const notification = new Notification({
      userId: req.user.id,
      title: `Event Reminder: ${event.title}`,
      message: `Your event "${event.title}" starts in ${reminderTime} minutes`,
      type: 'reminder',
      scheduledFor: new Date(Date.now() + (reminderTime * 60 * 1000)), // Convert minutes to milliseconds
      eventId,
      actionUrl: `/event.html?id=${eventId}`
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Delete a notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get scheduled reminders that are due (for cron job or scheduled task)
router.get('/scheduled/due', async (req, res) => {
  try {
    const dueReminders = await Notification.find({
      scheduledFor: { $lte: new Date() },
      isRead: false,
      type: 'reminder'
    }).populate('userId', 'name email').populate('eventId', 'title');
    
    res.json(dueReminders);
  } catch (error) {
    console.error('Error fetching due reminders:', error);
    res.status(500).json({ error: 'Failed to fetch due reminders' });
  }
});

module.exports = router;
