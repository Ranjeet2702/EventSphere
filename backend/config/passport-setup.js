// backend/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const NotificationService = require('../utils/notificationService');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback', // This is the route Google will redirect to
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // First check if user exists by Google ID
        let currentUser = await User.findOne({ googleId: profile.id });

        if (currentUser) {
          // Update profile information if it has changed
          if (currentUser.name !== profile.displayName || 
              currentUser.profileImageUrl !== profile.photos[0].value) {
            currentUser.name = profile.displayName;
            currentUser.profileImageUrl = profile.photos[0].value;
            await currentUser.save();
          }
          return done(null, currentUser);
        } else {
          // Check if user exists by email (for users who might have signed up with email first)
          const existingUserByEmail = await User.findOne({ email: profile.emails[0].value });
          
          if (existingUserByEmail) {
            // Link Google account to existing email account
            existingUserByEmail.googleId = profile.id;
            existingUserByEmail.profileImageUrl = profile.photos[0].value;
            if (!existingUserByEmail.name) {
              existingUserByEmail.name = profile.displayName;
            }
            await existingUserByEmail.save();
            return done(null, existingUserByEmail);
          } else {
            // Create a new user
            const newUser = await new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              role: 'student',
              profileImageUrl: profile.photos[0].value,
            }).save();
            
            // Create welcome notification for new user
            try {
              await NotificationService.createNotification(
                newUser._id,
                'Welcome to EventSphere! 🎉',
                'Thank you for joining EventSphere! You can now explore events, join clubs, and stay updated with notifications.',
                'success',
                { actionUrl: '/student-dashboard.html' }
              );
            } catch (notifError) {
              console.error('Error creating welcome notification:', notifError);
              // Don't fail the login if notification creation fails
            }
            
            return done(null, newUser);
          }
        }
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);