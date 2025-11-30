// backend/routes/users.js
const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');
const router = express.Router();

// Get current user's profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Update user's profile (name, email, phone)
router.patch('/profile', verifyToken, async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (typeof phone !== 'undefined') user.phone = phone;

        await user.save();
        res.json({ message: 'Profile updated successfully.', user });
    } catch (error) {
        console.error("Error updating profile details:", error);
        res.status(500).json({ error: 'Server error while updating profile.' });
    }
});

// Upload/update user's profile image
router.post('/profile/image', verifyToken, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file was uploaded.' });
        }
        // If upload is successful, req.file will contain file info
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImageUrl: `/uploads/profiles/${req.file.filename}` },
            { new: true }
        ).select('-password');
        
        res.json({ message: 'Profile image updated successfully!', user });
    } catch (error) {
        // This will now print a detailed error to your backend console if something goes wrong
        console.error("!!! CRITICAL ERROR during profile image upload:", error); 
        res.status(500).json({ error: 'Server error while uploading image. Check backend console for details.' });
    }
});

module.exports = router;