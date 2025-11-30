# EventSphere Enhanced Features Setup Guide

## New Features Added

### 1. Enhanced Google Authentication ✅
- **Already implemented** in your existing codebase
- Automatically stores user profile information (name, email, profile picture)
- Links Google accounts to existing email accounts
- Creates welcome notifications for new users

### 2. Logout Functionality ✅
- **Already implemented** in your navbar
- Visible logout button in the navigation bar
- Clears authentication session and redirects to login page

### 3. Notifications & Reminders System ✅
- **Browser notifications** using the Notifications API
- **In-app notifications** with toast messages
- **Scheduled reminders** for events
- **Notification bell icon** in the navbar with unread count
- **Real-time notification updates** every 30 seconds

## Environment Variables Required

Add these to your `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eventsphere

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for OAuth callback)
FRONTEND_URL=http://localhost:5500

# Server Configuration
PORT=3000
NODE_ENV=development
```

## New Files Added

### Backend Files:
- `models/Notification.js` - Database model for notifications
- `routes/notifications.js` - API routes for notification management
- `utils/notificationService.js` - Service layer for notifications
- `utils/scheduler.js` - Background scheduler for processing reminders

### Frontend Files:
- `notificationSystem.js` - Complete notification system for the frontend
- Updated `navbar.js` - Added notification bell icon
- Updated `style.css` - Added notification styles
- Updated `event.html` - Added reminder functionality

## How to Use the New Features

### 1. Google Authentication
- Users can click "Login with Google" on the login page
- New users are automatically created with their Google profile info
- Existing users can link their Google account to their email account

### 2. Notifications
- **Browser Notifications**: Users will be prompted to allow notifications
- **In-app Notifications**: Toast messages appear in the top-right corner
- **Notification Bell**: Click the bell icon in the navbar to see recent notifications
- **Unread Count**: Red badge shows number of unread notifications

### 3. Event Reminders
- On any event page, users can set reminders
- Choose from 15 minutes, 30 minutes, 1 hour, 2 hours, or 1 day before the event
- Reminders are processed by the background scheduler
- Users receive browser notifications when reminders are due

### 4. Logout
- Click the "Logout" button in the navbar
- Clears all stored data and redirects to login page

## API Endpoints Added

### Notifications:
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/reminder` - Create event reminder
- `DELETE /api/notifications/:id` - Delete notification

## Security Features

- All notification endpoints require authentication
- Users can only access their own notifications
- JWT tokens are used for authentication
- Environment variables for sensitive data
- No hardcoded secrets in the code

## Browser Compatibility

The notification system works in modern browsers that support:
- Notifications API
- Fetch API
- ES6+ JavaScript features

## Troubleshooting

### Notifications not working?
1. Check if browser notifications are enabled
2. Verify the notification system is loaded (check browser console)
3. Ensure the backend server is running

### Google Auth not working?
1. Verify Google OAuth credentials in `.env`
2. Check that callback URL is correct
3. Ensure CORS is properly configured

### Reminders not triggering?
1. Check if the scheduler is running (server logs)
2. Verify the reminder time is in the future
3. Check browser console for errors

## Future Enhancements

The notification system is designed to be easily extended with:
- Push notifications (Firebase, OneSignal)
- Email notifications
- SMS notifications
- WebSocket real-time updates
- Notification preferences per user
