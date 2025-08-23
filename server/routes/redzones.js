import express from 'express'
import auth from '../middleware/auth.js'
import User from '../models/User.js'
import RedZone from '../models/RedZone.js'

const router = express.Router()

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
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, location, landmark, severity, coordinates, status } = req.body

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

    // Save to database
    await newRedZone.save()

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

    const redZone = await RedZone.findById(req.params.id)
    
    if (!redZone) {
      return res.status(404).json({
        success: false,
        message: 'RedZone report not found'
      })
    }

    // Update status to approved
    redZone.status = 'approved'
    redZone.reviewedBy = req.user.id
    redZone.reviewedAt = Date.now()
    redZone.updatedAt = Date.now()
    
    await redZone.save()

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

export default router
