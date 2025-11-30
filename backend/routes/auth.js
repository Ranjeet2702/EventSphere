// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

// This line is crucial - it runs the code that sets up the Google Strategy
require('../config/passport-setup');

const router = express.Router();

// --- GOOGLE OAUTH ROUTES ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://127.0.0.1:5500/login.html' }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const script = `
        <script>
            window.localStorage.setItem('token', '${token}');
            window.localStorage.setItem('userId', '${req.user._id}');
            window.localStorage.setItem('role', '${req.user.role}');
            window.localStorage.setItem('name', '${req.user.name}');
            window.localStorage.setItem('email', '${req.user.email}');
            // This is the crucial fix: Use the full, absolute URL for the redirect
            window.location.href = 'http://127.0.0.1:5500/student-dashboard.html';
        </script>
    `;
    res.send(script);
});


// --- STANDARD AUTH ROUTES ---

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required." });
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists." });
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword, role: 'student' });
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// User Login (Single, Correct Version)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (!user.password) {
      return res.status(401).json({ error: "This account uses Google Sign-In. Please use the 'Login with Google' button." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "A server error occurred during login." });
  }
});

// Change Password (authenticated)
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (!user.password) {
      return res.status(400).json({ error: 'Password change is not available for Google Sign-In accounts.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password.' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        const resetURL = `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/reset-password.html?token=${token}`;
        await sendPasswordResetEmail(user.email, resetURL);
        res.json({ message: 'If a user with that email exists, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Error processing forgot password request.' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password has been successfully reset.' });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting password.' });
    }
});


// --- USER MANAGEMENT ROUTES (ADMIN) ---

// GET all users
router.get('/users', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
    try {
        const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// PATCH update user role
router.patch('/users/:id/role', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Admin cannot change their own role.' });
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User role updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user role.' });
    }
});

module.exports = router;