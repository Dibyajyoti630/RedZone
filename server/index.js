import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import User from './models/User.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database connection and auto-setup
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/redzoneadmin')
    console.log('[SUCCESS] Connected to MongoDB - Database: redzoneadmin')
    console.log('[INFO] To connect with mongosh: mongosh redzoneadmin')
    
    // Check if database is empty and create demo users
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      console.log('[INFO] Database is empty, creating demo users...')
      
      const demoUsers = [
        {
          name: 'Admin User',
          email: 'admin@redzone.com',
          password: 'admin123',
          role: 'admin',
          isActive: true
        },
        {
          name: 'Regular User',
          email: 'user@redzone.com',
          password: 'user123',
          role: 'user',
          isActive: true
        }
      ]

      for (const userData of demoUsers) {
        const user = new User(userData)
        await user.save()
        console.log(`[SUCCESS] Created user: ${userData.email} (${userData.role})`)
      }
      
      // console.log('[SUCCESS] Demo users created successfully!')
      // console.log('[INFO] Login with:')
      // console.log('   Admin: admin@redzone.com / admin123')
      // console.log('   User: user@redzone.com / user123')
    } else {
      console.log(`[INFO] Database has ${userCount} existing users`)
    }
    
    console.log('\n[INFO] To view data with mongosh:')
    console.log('   mongosh redzoneadmin')
    console.log('   db.users.find().pretty()')
    
  } catch (error) {
    console.error('[ERROR] MongoDB connection error:', error)
    console.log('\n[INFO] Make sure MongoDB is running:')
    console.log('   mongod')
    process.exit(1)
  }
}

// Connect to database
connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RedZone API is running',
    database: 'redzoneadmin',
    mongosh: 'mongosh redzoneadmin',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`[SUCCESS] Server running on port ${PORT}`)
  console.log(`[INFO] Health check: http://localhost:${PORT}/api/health`)
  console.log(`[INFO] Database: redzoneadmin`)
  console.log(`[INFO] Connect with: mongosh redzoneadmin`)
})
