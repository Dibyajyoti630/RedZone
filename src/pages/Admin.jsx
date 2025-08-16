import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminIcon from '../components/icons/AdminIcon.jsx'
import DashboardIcon from '../components/icons/DashboardIcon.jsx'
import HistoryIcon from '../components/icons/HistoryIcon.jsx'
import BellIcon from '../components/icons/BellIcon.jsx'
import ShieldIcon from '../components/icons/ShieldIcon.jsx'

export default function Admin({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState([
    { title: 'Total Users', value: 'Loading...', change: '0%', color: 'blue' },
    { title: 'Active Users', value: 'Loading...', change: '0%', color: 'green' },
    { title: 'Admin Users', value: 'Loading...', change: '0%', color: 'red' },
    { title: 'Recent Users (7d)', value: 'Loading...', change: '0%', color: 'purple' }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  // Fetch admin statistics from API
  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch('http://localhost:5001/api/admin/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Update stats with real data from database
      setStats([
        { title: 'Total Users', value: data.stats.totalUsers.toString(), change: 'Live', color: 'blue' },
        { title: 'Active Users', value: data.stats.activeUsers.toString(), change: 'Live', color: 'green' },
        { title: 'Admin Users', value: data.stats.adminUsers.toString(), change: 'Live', color: 'red' },
        { title: 'Recent Users (7d)', value: data.stats.recentUsers.toString(), change: 'Live', color: 'purple' }
      ])
      
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load statistics')
      // Set fallback values
      setStats([
        { title: 'Total Users', value: 'Error', change: '0%', color: 'blue' },
        { title: 'Active Users', value: 'Error', change: '0%', color: 'green' },
        { title: 'Admin Users', value: 'Error', change: '0%', color: 'red' },
        { title: 'Recent Users (7d)', value: 'Error', change: '0%', color: 'purple' }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const recentActivity = [
    { action: 'New user registered', time: '2 minutes ago', type: 'user' },
    { action: 'Alert triggered in Zone A', time: '5 minutes ago', type: 'alert' },
    { action: 'System backup completed', time: '1 hour ago', type: 'system' },
    { action: 'Admin login from IP 192.168.1.100', time: '2 hours ago', type: 'security' }
  ]

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <AdminIcon />
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-header-right">
          <button 
            className="btn btn-secondary" 
            onClick={fetchStats}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <span style={{ fontSize: '14px' }}>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-secondary">
            <BellIcon />
          </button>
          <button className="btn btn-primary">Settings</button>
          <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <AdminIcon />
          <span>Users</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HistoryIcon />
          <span>History</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldIcon />
          <span>Security</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Stats Cards */}
            {error && (
              <div className="error-message" style={{ 
                background: '#fee', 
                color: '#c33', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                border: '1px solid #fcc'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className={`stat-card stat-${stat.color}`}>
                  <div className="stat-header">
                    <h3>{stat.title}</h3>
                    <span className={`stat-change ${stat.change === 'Live' ? 'positive' : stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      {loading ? 'Loading...' : stat.change}
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? (
                      <div>Loading...</div>
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className={`activity-item activity-${activity.type}`}>
                    <div className="activity-icon">
                      {activity.type === 'user' && <AdminIcon />}
                      {activity.type === 'alert' && <BellIcon />}
                      {activity.type === 'system' && <DashboardIcon />}
                      {activity.type === 'security' && <ShieldIcon />}
                    </div>
                    <div className="activity-content">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-content">
            <h2>User Management</h2>
            <p>User management interface will be implemented here.</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-content">
            <h2>System History</h2>
            <p>System history and logs will be displayed here.</p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-content">
            <h2>Security Settings</h2>
            <p>Security configuration and monitoring will be available here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
