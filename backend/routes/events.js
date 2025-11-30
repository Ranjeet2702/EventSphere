// backend/routes/events.js
const express = require('express');
const crypto = require('crypto');
const Event = require('../models/Event');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const { uploadPoster, uploadCertTemplate } = require('../middleware/upload');
const { sendRegistrationConfirmationEmail, sendCancellationNotificationEmail } = require('../utils/emailService');
const NotificationService = require('../utils/notificationService');
const router = express.Router();




// Get all events route (enriched with averageRating and creator info)
router.get('/', async (req, res) => {
    try {
        const eventsWithDetails = await Event.aggregate([
            { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'eventId', as: 'reviews' } },
            { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'creatorInfo' } },
            { $addFields: {
                averageRating: { $avg: '$reviews.rating' },
                createdBy: { $arrayElemAt: ['$creatorInfo', 0] }
            }},
            { $project: {
                reviews: 0,
                creatorInfo: 0,
                'createdBy.password': 0, 'createdBy.googleId': 0, 'createdBy.resetPasswordToken': 0, 'createdBy.resetPasswordExpires': 0
            }},
            { $sort: { date: -1 } }
        ]);
        await Event.populate(eventsWithDetails, { path: 'attendees.userId', select: 'name email' });
        res.json(eventsWithDetails);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
// Create a new event (Club role)
router.post('/create', verifyToken, uploadPoster.single('poster'), async (req, res) => {
    if (req.user.role !== 'club') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { title, description, date, time, type, competitionType, venue, eventMode, meetingLink, registrationLimit, registrationFee, attendanceQuestion } = req.body;
    
    try {
        let parsedQuestion = null;
        if (attendanceQuestion) {
            try {
                parsedQuestion = JSON.parse(attendanceQuestion);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid format for attendance question data.' });
            }
        }

        const event = await Event.create({
            title, description, date, time, type, venue, eventMode, competitionType,
            meetingLink: eventMode === 'Online' ? meetingLink : undefined,
            registrationLimit: Number(registrationLimit) || 0,
            registrationFee: Number(registrationFee) || 0,
            createdBy: req.user.id,
            posterUrl: req.file ? `/uploads/posters/${req.file.filename}` : '',
            attendanceQuestion: parsedQuestion
        });
        res.status(201).json(event);
    } catch (err) {
        console.error('Event creation failed:', err);
        res.status(500).json({ error: 'Event creation failed', details: err.message });
    }
});

// NOTE: Removed duplicate GET '/' route to ensure enriched events response above is used

// Student registers for an event
router.post('/:id/register', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const studentId = req.user.id;
    const { collegeName } = req.body;
    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.status !== 'approved') return res.status(400).json({ error: 'Cannot register for this event.' });
         // --- START OF FIX: Prevent registration for past events ---
        const now = new Date();
        const eventDateTime = new Date(event.date);
        if (event.time) {
            const [hours, minutes] = event.time.split(':');
            eventDateTime.setHours(hours, minutes, 0, 0);
        }
        if (eventDateTime < now) {
            return res.status(400).json({ error: 'This event has already passed and registration is closed.' });
        }
        // --- END OF FIX ---
        if (event.attendees.some(a => a.userId.equals(studentId))) return res.status(400).json({ error: 'You are already registered.' });
        if (event.registrationLimit > 0 && event.attendees.length >= event.registrationLimit) return res.status(400).json({ error: 'Sorry, this event is full.' });

        let paymentId = null;
        if (event.registrationFee > 0) {
            console.log(`Simulating payment of ${event.registrationFee} for event ${event.title}`);
            paymentId = `mock_payment_${crypto.randomBytes(8).toString('hex')}`;
        }
        
        event.attendees.push({ userId: studentId, registeredCollege: collegeName, paymentId });
        await event.save();
        const student = await User.findById(studentId);
        await sendRegistrationConfirmationEmail(student.email, event);
        
        // Create notification for successful registration
        try {
            await NotificationService.createEventNotification(
                studentId,
                event,
                'Registration',
                `You have successfully registered for "${event.title}" on ${new Date(event.date).toLocaleDateString()}.`
            );
        } catch (notifError) {
            console.error('Error creating registration notification:', notifError);
            // Don't fail the registration if notification creation fails
        }
        
        res.json({ message: 'Registered successfully!', event });
    } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// QR Attendance Submission
router.post('/:qrCodeId/qr-attendance', async (req, res) => {
    const { qrCodeId } = req.params;
    const { email, name, answer } = req.body;
    try {
        const event = await Event.findOne({ qrCodeId }).populate('attendees.userId');
        if (!event || event.status !== 'approved') return res.status(404).json({ error: 'Event not found or not active.' });
        
        const attendeeRecord = event.attendees.find(a => a.userId && a.userId.email.toLowerCase() === email.toLowerCase());
        if (!attendeeRecord) return res.status(400).json({ error: 'You are not registered for this event.' });
        if (attendeeRecord.isAttended) return res.status(400).json({ error: 'Attendance already marked.' });

        if (event.attendanceQuestion && event.attendanceQuestion.question) {
            if (!answer || event.attendanceQuestion.correctAnswer.toLowerCase() !== answer.toLowerCase()) {
                return res.status(401).json({ error: 'Incorrect answer to the verification question.' });
            }
        }

        attendeeRecord.isAttended = true;
        await event.save();
        res.json({ message: 'Attendance marked successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error marking attendance.' });
    }
});

// Manual Attendance Marking (Club/Admin)
router.post('/:eventId/manual-attendance', verifyToken, async (req, res) => {
    if (!['club', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found.' });
        if (req.user.role === 'club' && !event.createdBy.equals(req.user.id)) {
            return res.status(403).json({ error: 'You can only manage your own events.' });
        }
        const attendee = event.attendees.find(a => a.userId.equals(req.body.studentId));
        if (!attendee) return res.status(400).json({ error: 'Student not registered.' });
        attendee.isAttended = true;
        await event.save();
        res.json({ message: 'Attendance marked successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// Update Event Status (Admin)
router.patch('/:id/status', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can approve/reject events' });
    }
    try {
      const event = await Event.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
      if (!event) return res.status(404).json({ error: 'Event not found' });
      
      // Create notification for event creator about status change
      try {
        await NotificationService.createEventNotification(
          event.createdBy,
          event,
          'Status Update',
          `Your event "${event.title}" has been ${req.body.status}.`
        );
      } catch (notifError) {
        console.error('Error creating status update notification:', notifError);
        // Don't fail the status update if notification creation fails
      }
      
      res.json(event);
    } catch (err) {
      res.status(400).json({ error: 'Event status update failed' });
    }
});

// Certificate Template Upload (Club)
router.post('/:id/upload-certificate-template', verifyToken, uploadCertTemplate.single('certificate'), async (req, res) => {
    if (req.user.role !== 'club') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.createdBy.equals(req.user.id)) {
            return res.status(404).json({ error: 'Event not found or you are not the owner.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file was uploaded.' });
        }
        event.certificateTemplateUrl = `/uploads/cert_templates/${req.file.filename}`;
        await event.save();
        res.json({ message: 'Certificate template uploaded successfully!', event });
    } catch (err) {
        console.error("Certificate template upload error:", err);
        res.status(500).json({ error: 'Server error while uploading template.' });
    }
});

// Event Recommendation System (Student)

// GET recommended events
router.get('/recommended', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    try {
        const studentId = req.user.id;

        // Find all events the student is registered for
        const registeredEvents = await Event.find({ "attendees.userId": studentId, status: 'approved' });
        const registeredEventIds = registeredEvents.map(e => e._id);

        let topTypes = [];
        if (registeredEvents.length > 0) {
            // Find the mode (most frequent) of the event types the student registered for
            const typeCounts = registeredEvents.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {});
            topTypes = Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2) // Get the top 2 most frequent types
                .map(entry => entry[0]);
        }

        // If the user has no registration history, fall back to the most popular event types overall
        if (topTypes.length === 0) {
            const popularTypes = await Event.aggregate([
                { $match: { status: 'approved' } },
                { $unwind: '$attendees' },
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 2 }
            ]);
            topTypes = popularTypes.map(pt => pt._id);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find upcoming events that match the top types and the user has not registered for
        const recommendedEvents = await Event.find({
            _id: { $nin: registeredEventIds }, // Exclude already registered events
            status: 'approved',
            date: { $gte: today }, // Exclude past events
            type: { $in: topTypes }
        }).limit(3).populate('createdBy', 'name');
        
        res.json(recommendedEvents);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// NEW: GET financial summary for all paid events
router.get('/financials', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    try {
        const paidEvents = await Event.find({ registrationFee: { $gt: 0 }, status: 'approved' }).populate('createdBy', 'name');
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
        res.status(500).json({ error: 'Failed to fetch financial data.' });
    }
});

// NEW: PATCH cancel an approved event (Admin only)

router.patch('/:id/cancel', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    try {
        const event = await Event.findById(req.params.id).populate('attendees.userId', 'name email');
        if (!event) return res.status(404).json({ error: 'Event not found.' });

        const eventDateTime = new Date(event.date);
        if (event.time) {
            const [hours, minutes] = event.time.split(':');
            eventDateTime.setHours(hours, minutes, 0, 0);
        }
        if (eventDateTime < new Date()) {
            return res.status(400).json({ error: 'Cannot cancel an event that has already passed.' });
        }
        
        if (event.status !== 'approved') return res.status(400).json({ error: 'Only approved events can be cancelled.' });

        const reason = req.body.reason || 'Cancelled by Administrator';
        event.status = 'cancelled';
        event.cancellationReason = reason;

        // --- START OF NEW FEATURE: Notify attendees and simulate refunds ---
        if (event.attendees && event.attendees.length > 0) {
            console.log(`Notifying ${event.attendees.length} registered students...`);
            for (const attendee of event.attendees) {
                if (attendee.userId) {
                    // Send cancellation email
                    await sendCancellationNotificationEmail(attendee.userId.email, attendee.userId.name, event.title, reason);

                    // Simulate refund for paid events
                    if (event.registrationFee > 0) {
                        console.log(`Simulating refund of ₹${event.registrationFee} to user ${attendee.userId.email} for cancelled event "${event.title}"...`);
                    }
                }
            }
        }
        // --- END OF NEW FEATURE ---

        await event.save();
        res.json({ message: 'Event cancelled successfully and notifications sent.', event });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel event.' });
    }
});

// --- END OF FIX ---

// --- END OF FIX ---

module.exports = router;