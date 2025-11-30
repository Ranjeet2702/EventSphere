// backend/routes/analytics.js
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs').promises; // Use the promise-based version of the file system module
const path = require('path');
const verifyToken = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// --- NEW HELPER FUNCTION TO CALCULATE FOLDER SIZE ---
async function getFolderSize(directory) {
    let totalSize = 0;
    try {
        const files = await fs.readdir(directory, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(directory, file.name);
            if (file.isDirectory()) {
                totalSize += await getFolderSize(filePath); // Recursively check subfolders
            } else {
                const stats = await fs.stat(filePath);
                totalSize += stats.size; // Add file size to total
            }
        }
    } catch (error) {
        console.error(`Could not read directory ${directory}:`, error);
        return 0; // Return 0 if folder doesn't exist or is unreadable
    }
    return totalSize;
}

// GET /api/analytics/summary
router.get('/summary', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only.' });
  }

  try {
    // 1. Get Database Health
    const dbState = mongoose.connection.readyState;
    let dbStatus = dbState === 1 ? 'Connected' : 'Disconnected';

    // 2. Calculate Total Money Earned
    const approvedEvents = await Event.find({ status: 'approved' });
    const totalRevenue = approvedEvents.reduce((acc, event) => {
        return acc + (event.attendees.length * (event.registrationFee || 0));
    }, 0);

    // --- START OF NEW FEATURE ---
    // 3. Calculate Storage Used by User Uploads
    const uploadsDirectory = path.join(__dirname, '../uploads');
    const totalUploadsSizeInBytes = await getFolderSize(uploadsDirectory);
    // Convert bytes to a more readable format (e.g., MB)
    const totalUploadsSizeInMB = (totalUploadsSizeInBytes / (1024 * 1024)).toFixed(2);
    // --- END OF NEW FEATURE ---

    // Existing Analytics
    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();
    
    res.json({
      dbStatus,
      totalRevenue,
      totalUploadsSize: `${totalUploadsSizeInMB} MB`, // Send as a formatted string
      totalEvents,
      totalUsers,
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
});

// --- NEW FEATURE: Route to get event-wise financial details ---
router.get('/financials', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only.' });
    }
    try {
        const paidEvents = await Event.find({ 
            registrationFee: { $gt: 0 },
            status: 'approved' 
        }).populate('createdBy', 'name');

        const financialSummary = paidEvents.map(event => ({
            _id: event._id,
            title: event.title,
            club: event.createdBy ? event.createdBy.name : 'N/A',
            fee: event.registrationFee,
            registrations: event.attendees.length,
            totalRevenue: event.attendees.length * event.registrationFee
        }));

        res.json(financialSummary);
    } catch (err) {
        console.error("Financials error:", err);
        res.status(500).json({ error: 'Failed to fetch financial data.' });
    }
});
// --- END OF NEW FEATURE ---
module.exports = router;