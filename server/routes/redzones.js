import express from 'express'
import auth from '../middleware/auth.js'
import User from '../models/User.js'

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
    // In a real application, you would query the database for approved RedZones
    // For now, we'll return mock data
    const recentRedZones = mockRedZones
      .filter(redZone => redZone.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10) // Limit to 10 most recent

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
    const { title, description, location, severity } = req.body

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

    // In a real application, you would save this to a database
    // For now, we'll just return a success response
    const newRedZone = {
      _id: Date.now().toString(),
      title,
      description,
      location,
      severity,
      createdAt: new Date(),
      status: 'pending', // New reports start as pending
      reportedBy: req.user.id
    }

    res.status(201).json({
      success: true,
      message: 'RedZone report submitted successfully. It will be reviewed by an admin.',
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

    // In a real application, you would query the database
    // For now, we'll return mock data
    res.json({
      success: true,
      redZones: mockRedZones
    })
  } catch (error) {
    console.error('Error fetching RedZones:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RedZones'
    })
  }
})

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

    // In a real application, you would update the database
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'RedZone approved successfully'
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

    // In a real application, you would update the database
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'RedZone rejected successfully'
    })
  } catch (error) {
    console.error('Error rejecting RedZone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject RedZone'
    })
  }
})

export default router
