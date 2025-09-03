import express from 'express'
import auth from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import User from '../models/User.js'
import RedZone from '../models/RedZone.js'
import RedZoneImage from '../models/RedZoneImage.js'
import UserContact from '../models/UserContact.js'
import { sendRedZoneNotification, sendSMS, testTwilioAccount } from '../utils/twilio.js'

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'server/uploads/redzones'
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'redzone-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

const router = express.Router()

// Test route for Twilio - No auth required for testing
router.get('/test-twilio-open', async (req, res) => {
  try {

    // Test Twilio account status
    const accountActive = await testTwilioAccount()
    
    if (!accountActive) {
      return res.status(500).json({
        success: false,
        message: 'Twilio account is not active or credentials are invalid'
      })
    }
    
    // Use phone number from query parameter or default test number
    const phoneNumber = req.query.phone || '9999999999' // Replace with a valid test number
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number provided'
      })
    }
    
    // Send test SMS
    const testMessage = 'This is a test message from RedZone Cursor app. If you received this, SMS notifications are working.'
    const result = await sendSMS(phoneNumber, testMessage)
    
    if (result) {
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        details: {
          to: phoneNumber,
          sid: result.sid,
          status: result.status
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test SMS'
      })
    }
  } catch (error) {
    console.error('Error testing Twilio:', error)
    res.status(500).json({
      success: false,
      message: 'Error testing Twilio integration',
      error: error.message
    })
  }
})

// Mock RedZone data for now - in a real app, this would come from a database
const mockRedZones = [
  {
    _id: '1',
    title: 'Construction Zone - Heavy Machinery',
    description: 'Active construction site with heavy machinery operating. Exercise extreme caution.',
    location: 'Downtown Business District',
    severity: 'high',
    createdAt: new Date('2024-01-15'),
    status: 'approved'
  },
  {
    _id: '2',
    title: 'Flooded Street - Deep Water',
    description: 'Street completely flooded after heavy rainfall. Avoid driving through this area.',
    location: 'Riverside Avenue',
    severity: 'medium',
    createdAt: new Date('2024-01-14'),
    status: 'approved'
  },
  {
    _id: '3',
    title: 'Broken Traffic Light',
    description: 'Traffic light malfunctioning at major intersection. Use extra caution.',
    location: 'Main Street & Oak Avenue',
    severity: 'medium',
    createdAt: new Date('2024-01-13'),
    status: 'approved'
  },
  {
    _id: '4',
    title: 'Icy Road Conditions',
    description: 'Road surface covered in ice. Dangerous driving conditions.',
    location: 'Mountain View Drive',
    severity: 'high',
    createdAt: new Date('2024-01-12'),
    status: 'approved'
  },
  {
    _id: '5',
    title: 'Downed Power Lines',
    description: 'Power lines down across the road. Do not approach, call emergency services.',
    location: 'Electric Avenue',
    severity: 'high',
    createdAt: new Date('2024-01-11'),
    status: 'approved'
  }
]

// GET /api/redzones/recent - Get recent approved RedZones
router.get('/recent', auth, async (req, res) => {
  try {
    const recentRedZones = await RedZone.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reportedBy', 'name')

    res.json({
      success: true,
      redZones: recentRedZones
    })
  } catch (error) {
    console.error('Error fetching recent RedZones:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent RedZones'
    })
  }
})

// POST /api/redzones - Create a new RedZone report
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, location, landmark, severity, status } = req.body
    
    // Parse coordinates if they were sent as a string (from FormData)
    let coordinates = null
    if (req.body.coordinates) {
      try {
        coordinates = JSON.parse(req.body.coordinates)
      } catch (e) {
        console.error('Error parsing coordinates:', e)
      }
    }

    // Validate required fields
    if (!title || !description || !location || !severity) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high']
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severity must be low, medium, or high'
      })
    }

    // Get image URL if an image was uploaded
    const imageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null

    // Create new RedZone document
    const newRedZone = new RedZone({
      title,
      description,
      location,
      landmark,
      coordinates,
      severity,
      reportedBy: req.user.id
    })

    // If the user is an admin and status is provided as 'approved', set it directly
    if (req.user.role === 'admin' && status === 'approved') {
      newRedZone.status = 'approved'
      newRedZone.reviewedBy = req.user.id
      newRedZone.reviewedAt = Date.now()
    }

    // If an image was uploaded, add it to the RedZone document
    if (imageUrl) {
      newRedZone.imageUrl = imageUrl;
    }
    
    // Save to database
    await newRedZone.save()
    
    // If an image was uploaded, save it to the RedZoneImage collection
    if (imageUrl) {
      const newRedZoneImage = new RedZoneImage({
        title: title,
        location: location,
        date: new Date(),
        imageUrl: imageUrl,
        redZoneId: newRedZone._id,
        uploadedBy: req.user.id
      })
      
      await newRedZoneImage.save()
    }

    // If created by admin and approved, send SMS notifications
    if (req.user.role === 'admin' && newRedZone.status === 'approved') {
      try {
        // Get all user contacts with phone numbers
        const userContacts = await UserContact.find({}, 'phone')
        
        if (userContacts && userContacts.length > 0) {
          // Extract phone numbers from contacts
          const phoneNumbers = userContacts.map(contact => contact.phone)
          
          // Send notifications asynchronously (don't await to avoid delaying response)
          sendRedZoneNotification(phoneNumbers, newRedZone)
            .then(results => {
              console.log(`SMS notifications sent for new RedZone: ${newRedZone.title}`)
            })
            .catch(err => {
              console.error('Error sending SMS notifications:', err)
            })
        }
      } catch (notificationError) {
        // Log error but don't fail the creation process
        console.error('Error preparing SMS notifications:', notificationError)
      }
    }

    const message = newRedZone.status === 'approved' 
      ? 'RedZone created and approved successfully.'
      : 'RedZone report submitted successfully. It will be reviewed by an admin.'

    res.status(201).json({
      success: true,
      message,
      redZone: newRedZone
    })
  } catch (error) {
    console.error('Error creating RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create RedZone report'
    })
  }
})

// GET /api/redzones - Get all RedZones (for admin)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    // Query the database for all RedZones
    const redZones = await RedZone.find()
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name')
      .populate('reviewedBy', 'name')
    
    res.json({
      success: true,
      redZones
    })
  } catch (error) {
    console.error('Error fetching RedZones:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RedZones'
    })
  }
})

// REMOVE THIS PLACEHOLDER IMPLEMENTATION
// PUT /api/redzones/:id/approve - Approve a RedZone (admin only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    const { id } = req.params

    // Find the RedZone by ID and update its status to 'approved'
    const redZone = await RedZone.findById(id)
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone not found'
      })
    }
    
    // Update the RedZone status and add reviewer information
    redZone.status = 'approved'
    redZone.reviewedBy = req.user.id
    redZone.reviewedAt = new Date()
    redZone.updatedAt = new Date()
    
    await redZone.save()
    
    res.json({
      success: true,
      message: 'RedZone approved successfully',
      redZone
    })
  } catch (error) {
    console.error('Error approving RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve RedZone'
    })
  }
})

// PUT /api/redzones/:id/reject - Reject a RedZone (admin only)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    const { id } = req.params

    // Find the RedZone by ID and update its status to 'rejected'
    const redZone = await RedZone.findById(id)
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone not found'
      })
    }
    
    // Update the RedZone status and add reviewer information
    redZone.status = 'rejected'
    redZone.reviewedBy = req.user.id
    redZone.reviewedAt = new Date()
    redZone.updatedAt = new Date()
    
    await redZone.save()
    
    res.json({
      success: true,
      message: 'RedZone rejected successfully',
      redZone
    })
  } catch (error) {
    console.error('Error rejecting RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject RedZone'
    })
  }
})

// KEEP THIS ACTUAL IMPLEMENTATION
// PUT /api/redzones/:id/approve - Approve a RedZone report (admin only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    // Find the redzone and populate the reportedBy field to get user details
    const redZone = await RedZone.findById(req.params.id).populate('reportedBy')
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone report not found'
      })
    }
    
    console.log('RedZone found:', { 
      id: redZone._id,
      title: redZone.title,
      reportedBy: redZone.reportedBy,
      reportedById: redZone.reportedBy ? redZone.reportedBy._id : 'Not available'
    })

    // Update status to approved
    redZone.status = 'approved'
    redZone.reviewedBy = req.user.id
    redZone.reviewedAt = Date.now()
    redZone.updatedAt = Date.now()
    
    await redZone.save()

    // Send SMS notifications to all users with registered phone numbers
    try {
      // Verify redZone has all required properties
      if (!redZone.title || !redZone.location) {
        console.error('Cannot send notifications: RedZone missing required properties', {
          hasTitle: Boolean(redZone.title),
          hasLocation: Boolean(redZone.location),
          redZoneId: redZone._id
        });
        throw new Error('RedZone missing required properties for notification');
      }
      
      // Get all user contacts with phone numbers
      const userContacts = await UserContact.find({}, 'phone')
      
      if (userContacts && userContacts.length > 0) {
        // Extract phone numbers from contacts
        const phoneNumbers = userContacts.map(contact => contact.phone).filter(phone => phone);
        
        if (phoneNumbers.length === 0) {
          console.log('No valid phone numbers found for notification');
          return;
        }
        
        // Log before sending notifications
        console.log(`Attempting to send SMS notifications for approved RedZone: ${redZone.title} to ${phoneNumbers.length} recipients`);
        console.log('RedZone data being sent:', {
          id: redZone._id,
          title: redZone.title,
          location: redZone.location,
          severity: redZone.severity,
          status: redZone.status
        });
        
        // Send notifications asynchronously (don't await to avoid delaying response)
        sendRedZoneNotification(phoneNumbers, redZone)
          .then(results => {
            console.log(`SMS notifications sent for approved RedZone: ${redZone.title}. Results:`, results.length)
          })
          .catch(err => {
            console.error('Error sending SMS notifications:', err)
          })
      } else {
        console.log('No user contacts found with phone numbers for notification');
      }

      // Send notification to the user who reported the RedZone
      try {
        // Extract the user ID from reportedBy (handles both populated and unpopulated cases)
        let reporterId;
        
        if (redZone.reportedBy) {
          // If reportedBy is populated, it might be an object with _id
          if (typeof redZone.reportedBy === 'object' && redZone.reportedBy._id) {
            reporterId = redZone.reportedBy._id.toString();
          } 
          // If reportedBy is an ObjectId
          else if (redZone.reportedBy.toString) {
            reporterId = redZone.reportedBy.toString();
          }
          // If reportedBy is already a string
          else {
            reporterId = redZone.reportedBy;
          }
        }
        
        console.log(`Looking for contact with userId: ${reporterId}`);
        
        if (!reporterId) {
          console.log('No reporter ID found for this RedZone');
          return;
        }
        
        const reporterContact = await UserContact.findOne({ userId: reporterId })
        
        if (reporterContact && reporterContact.phone) {
          console.log(`Found reporter contact: ${reporterContact.name}, phone: ${reporterContact.phone}`);
          
          // Verify we have all required data for the message
          if (!redZone.title || !redZone.location) {
            console.error('Cannot send reporter notification: RedZone missing required properties', {
              hasTitle: Boolean(redZone.title),
              hasLocation: Boolean(redZone.location),
              redZoneId: redZone._id
            });
            return;
          }
          
          // Create a personalized message for the reporter
          const reporterMessage = `Good news! Your RedZone report "${redZone.title}" at ${redZone.location} has been approved by an admin. Thank you for helping keep our community safe.`
          
          console.log('Sending personalized message to reporter:', {
            phone: reporterContact.phone,
            message: reporterMessage
          });
          
          // Use sendSMS directly from the imported twilio.js
          // Send the personalized notification
          sendSMS(reporterContact.phone, reporterMessage)
            .then(result => {
              if (result) {
                console.log(`Notification sent to reporter (${reporterId}) for approved RedZone: ${redZone.title}`)
              } else {
                console.log(`Failed to send notification to reporter (${reporterId}) - no result returned`)
              }
            })
            .catch(err => {
              console.error('Error sending notification to reporter:', err)
            })
        } else {
          console.log(`No contact found for reporter with userId: ${reporterId}`);
        }
      } catch (reporterNotificationError) {
        console.error('Error sending notification to reporter:', reporterNotificationError)
      }
    } catch (notificationError) {
      // Log error but don't fail the approval process
      console.error('Error preparing SMS notifications:', notificationError)
    }

    res.json({
      success: true,
      message: 'RedZone report approved successfully',
      redZone
    })
  } catch (error) {
    console.error('Error approving RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve RedZone report'
    })
  }
})

// PUT /api/redzones/:id/reject - Reject a RedZone report (admin only)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    const redZone = await RedZone.findById(req.params.id)
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone report not found'
      })
    }

    // Update status to rejected
    redZone.status = 'rejected'
    redZone.reviewedBy = req.user.id
    redZone.reviewedAt = Date.now()
    redZone.updatedAt = Date.now()
    
    await redZone.save()

    res.json({
      success: true,
      message: 'RedZone report rejected successfully',
      redZone
    })
  } catch (error) {
    console.error('Error rejecting RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject RedZone report'
    })
  }
})

// GET /api/redzones/:id - Get a specific RedZone by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const redZone = await RedZone.findById(req.params.id)
      .populate('reportedBy', 'name')
      .populate('reviewedBy', 'name')
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone report not found'
      })
    }

    res.json({
      success: true,
      redZone
    })
  } catch (error) {
    console.error('Error fetching RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RedZone report'
    })
  }
})

// PUT /api/redzones/:id/safe-now - Mark a RedZone as safe (admin only)
router.put('/:id/safe-now', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    const redZone = await RedZone.findById(req.params.id)
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone report not found'
      })
    }

    // Update status to safe
    redZone.status = 'safe'
    redZone.updatedAt = Date.now()
    
    await redZone.save()

    // Send SMS notifications to all users with registered phone numbers
    try {
      // Get all user contacts with phone numbers
      const userContacts = await UserContact.find({}, 'phone')
      
      if (userContacts && userContacts.length > 0) {
        // Extract phone numbers from contacts
        const phoneNumbers = userContacts.map(contact => contact.phone).filter(phone => phone)
        
        if (phoneNumbers.length === 0) {
          console.log('No valid phone numbers found for notification')
          return
        }
        
        // Create a message for the safe notification
        const safeMessage = `SAFETY UPDATE: The area "${redZone.title}" at ${redZone.location} is now marked as SAFE by authorities. You can resume normal activities in this area.`
        
        // Send notifications asynchronously
        Promise.all(phoneNumbers.map(phone => sendSMS(phone, safeMessage)))
          .then(results => {
            console.log(`SMS notifications sent for safe RedZone: ${redZone.title}. Results:`, results.length)
          })
          .catch(err => {
            console.error('Error sending SMS notifications:', err)
          })
      } else {
        console.log('No user contacts found with phone numbers for notification')
      }
    } catch (notificationError) {
      // Log error but don't fail the process
      console.error('Error preparing SMS notifications:', notificationError)
    }

    res.json({
      success: true,
      message: 'RedZone marked as safe successfully',
      redZone
    })
  } catch (error) {
    console.error('Error marking RedZone as safe:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to mark RedZone as safe'
    })
  }
})

export default router
