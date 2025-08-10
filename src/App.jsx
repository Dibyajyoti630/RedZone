import { useState, useEffect } from 'react'
import NavBar from './components/NavBar.jsx'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import About from './components/About.jsx'
import Footer from './components/Footer.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Admin from './pages/Admin.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <About />
      <Footer />
    </>
  )
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const isAdminPage = location.pathname === '/admin'

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          // Verify token with backend
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setIsAuthenticated(true)
            setIsAdmin(data.user.role === 'admin')
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (error) {
          console.error('Auth check error:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Function to handle login
  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    setIsAdmin(userData.role === 'admin')
  }

  // Function to handle logout
  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--text-900)'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Only show NavBar on non-admin pages */}
      {!isAdminPage && (
        <NavBar isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={handleLogout} />
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated && isAdmin}>
                <Admin onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <AppContent />
}


