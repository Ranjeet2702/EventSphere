// backend/routes/feedback.js
const express = require('express');
const verifyToken = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const router = express.Router();

router.post('/:eventId', verifyToken, async (req, res) => {
    const { eventId } = req.params;
    const { comment, rating } = req.body;
    const userId = req.user.id;

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found.' });

        const attendeeRecord = event.attendees.find(a => a.userId.equals(userId));
        if (!attendeeRecord || !attendeeRecord.isAttended) {
            return res.status(403).json({ error: 'You can only review events you have attended.' });
        }

        const eventDateTime = new Date(event.date);
        if (event.time) {
            const [hours, minutes] = event.time.split(':');
            eventDateTime.setHours(hours, minutes, 0, 0);
        }

        // FIX: Corrected time window logic
        const reviewDeadline = new Date(eventDateTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours AFTER event start
        const now = new Date();

        if (now < eventDateTime) {
            return res.status(403).json({ error: 'You cannot review an event that has not happened yet.' });
        }
        if (now > reviewDeadline) {
            return res.status(403).json({ error: 'The 24-hour review period for this event has ended.' });
        }
        
        const existingFeedback = await Feedback.findOne({ eventId, userId });
        if (existingFeedback) {
            return res.status(400).json({ error: 'You have already submitted feedback for this event.' });
        }

        const feedback = await Feedback.create({ eventId, userId, comment, rating });
        res.status(201).json(feedback);
    } catch (err) {
        res.status(400).json({ error: 'Failed to submit feedback.' });
    }
});

router.get('/:eventId', async (req, res) => {
    try {
        const feedback = await Feedback.find({ eventId: req.params.eventId }).populate('userId', 'name');
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get feedback.' });
    }
});

module.exports = router;