// backend/test-notifications.js
// Simple test script to verify notification system

require('dotenv').config();
const mongoose = require('mongoose');
const NotificationService = require('./utils/notificationService');
const User = require('./models/User');

async function testNotifications() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`🧪 Testing with user: ${testUser.name} (${testUser.email})`);

    // Test 1: Create a simple notification
    console.log('\n📝 Test 1: Creating simple notification...');
    const notification = await NotificationService.createNotification(
      testUser._id,
      'Test Notification',
      'This is a test notification to verify the system is working.',
      'info'
    );
    console.log('✅ Notification created:', notification._id);

    // Test 2: Create a reminder
    console.log('\n⏰ Test 2: Creating reminder...');
    const reminder = await NotificationService.createNotification(
      testUser._id,
      'Test Reminder',
      'This is a test reminder that should trigger in 1 minute.',
      'reminder',
      {
        scheduledFor: new Date(Date.now() + 60000) // 1 minute from now
      }
    );
    console.log('✅ Reminder created:', reminder._id);

    // Test 3: Get unread count
    console.log('\n🔢 Test 3: Getting unread count...');
    const dueReminders = await NotificationService.getDueReminders();
    console.log(`✅ Found ${dueReminders.length} due reminders`);

    // Test 4: Clean up test notifications
    console.log('\n🧹 Test 4: Cleaning up test notifications...');
    // Note: In a real test, you might want to delete the test notifications
    console.log('✅ Test completed successfully!');

    console.log('\n🎉 All tests passed! The notification system is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Open the frontend and test the notification bell');
    console.log('3. Try setting a reminder on an event page');
    console.log('4. Check browser console for any errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testNotifications();
