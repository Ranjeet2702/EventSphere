// backend/utils/scheduler.js
const NotificationService = require('./notificationService');

class Scheduler {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🕐 Scheduler started - checking for due reminders every minute');
    
    // Check for due reminders every minute
    this.interval = setInterval(async () => {
      await this.processDueReminders();
    }, 60000); // 1 minute
    
    // Also process immediately on startup
    this.processDueReminders();
  }

  // Stop the scheduler
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Scheduler stopped');
  }

  // Process due reminders
  async processDueReminders() {
    try {
      const dueReminders = await NotificationService.getDueReminders();
      
      if (dueReminders.length > 0) {
        console.log(`📢 Processing ${dueReminders.length} due reminders`);
        
        for (const reminder of dueReminders) {
          try {
            // Mark as processed to avoid duplicate processing
            await NotificationService.markReminderProcessed(reminder._id);
            
            // Log the reminder (in a real app, you might send push notifications, emails, etc.)
            console.log(`🔔 Reminder for ${reminder.userId.name}: ${reminder.title} - ${reminder.message}`);
            
            // Here you could integrate with:
            // - Push notification services (Firebase, OneSignal, etc.)
            // - Email services
            // - SMS services
            // - WebSocket connections for real-time notifications
            
          } catch (error) {
            console.error(`Error processing reminder ${reminder._id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in scheduler processDueReminders:', error);
    }
  }

  // Clean up old notifications (run daily)
  async cleanupOldNotifications() {
    try {
      await NotificationService.cleanupOldNotifications();
      console.log('🧹 Cleaned up old notifications');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Manual trigger for testing
  async triggerReminderCheck() {
    console.log('🔍 Manually triggering reminder check');
    await this.processDueReminders();
  }
}

module.exports = Scheduler;
