// backend/utils/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  // Create a notification for a user
  static async createNotification(userId, title, message, type = 'info', options = {}) {
    try {
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        scheduledFor: options.scheduledFor || null,
        eventId: options.eventId || null,
        actionUrl: options.actionUrl || null
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create event-related notifications
  static async createEventNotification(userId, event, type, message) {
    return this.createNotification(
      userId,
      `Event ${type}: ${event.title}`,
      message,
      'info',
      {
        eventId: event._id,
        actionUrl: `/event.html?id=${event._id}`
      }
    );
  }

  // Create reminder for an event
  static async createEventReminder(userId, event, reminderMinutes) {
    const scheduledFor = new Date(Date.now() + (reminderMinutes * 60 * 1000));
    
    return this.createNotification(
      userId,
      `Event Reminder: ${event.title}`,
      `Your event "${event.title}" starts in ${reminderMinutes} minutes`,
      'reminder',
      {
        scheduledFor,
        eventId: event._id,
        actionUrl: `/event.html?id=${event._id}`
      }
    );
  }

  // Get due reminders (for scheduled processing)
  static async getDueReminders() {
    try {
      return await Notification.find({
        scheduledFor: { $lte: new Date() },
        isRead: false,
        type: 'reminder'
      }).populate('userId', 'name email').populate('eventId', 'title');
    } catch (error) {
      console.error('Error fetching due reminders:', error);
      throw error;
    }
  }

  // Mark reminder as processed
  static async markReminderProcessed(notificationId) {
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } catch (error) {
      console.error('Error marking reminder as processed:', error);
      throw error;
    }
  }

  // Bulk create notifications for multiple users
  static async createBulkNotifications(userIds, title, message, type = 'info', options = {}) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        scheduledFor: options.scheduledFor || null,
        eventId: options.eventId || null,
        actionUrl: options.actionUrl || null
      }));
      
      await Notification.insertMany(notifications);
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Clean up old notifications (keep last 100 per user)
  static async cleanupOldNotifications() {
    try {
      const users = await Notification.distinct('userId');
      
      for (const userId of users) {
        const notifications = await Notification.find({ userId })
          .sort({ createdAt: -1 })
          .skip(100); // Skip first 100 (keep them)
        
        if (notifications.length > 0) {
          const idsToDelete = notifications.map(n => n._id);
          await Notification.deleteMany({ _id: { $in: idsToDelete } });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
