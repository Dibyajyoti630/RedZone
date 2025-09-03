import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminIcon from '../components/icons/AdminIcon.jsx'
import DashboardIcon from '../components/icons/DashboardIcon.jsx'
import HistoryIcon from '../components/icons/HistoryIcon.jsx'
import BellIcon from '../components/icons/BellIcon.jsx'
import ShieldIcon from '../components/icons/ShieldIcon.jsx'
import { API_ENDPOINTS, apiCall } from '../config/api.js'
import './Admin.css'

export default function Admin({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef(null)
  
  // Close mobile menu when clicking outside
  const handleOverlayClick = () => {
    setMobileMenuOpen(false)
  }
  
  // Handle hamburger menu toggle with animation
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  
  // Close menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])
  
  const [stats, setStats] = useState([
    { title: 'Total Users', value: 'Loading...', change: '0%', color: 'blue' },
    { title: 'Active Users', value: 'Loading...', change: '0%', color: 'green' },
    { title: 'Admin Users', value: 'Loading...', change: '0%', color: 'red' },
    { title: 'Recent Users (7d)', value: 'Loading...', change: '0%', color: 'purple' }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [redZones, setRedZones] = useState([])
  const [loadingRedZones, setLoadingRedZones] = useState(false)
  const [userContacts, setUserContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  
  // Fetch user contacts for admin
  const fetchUserContacts = async () => {
    try {
      setLoadingContacts(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_USER_CONTACTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }

      const data = await response.json()
      setUserContacts(data.contacts || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching user contacts:', err.message || err)
      setError(`Failed to load user contacts: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingContacts(false)
    }
  }
  
  // Handle contact deletion
  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_CONTACTS}/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }
      
      // Remove the deleted contact from state
      setUserContacts(userContacts.filter(contact => contact._id !== contactId))
      alert('Contact deleted successfully')
    } catch (err) {
      console.error('Error deleting contact:', err.message || err)
      alert('An error occurred while deleting the contact')
    }
  }
  const [newRedZone, setNewRedZone] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'medium'
  })
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

      console.log('Fetching stats from:', API_ENDPOINTS.ADMIN_STATS);
      const response = await fetch(API_ENDPOINTS.ADMIN_STATS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }

      const data = await response.json()
      console.log('Received data:', data);
      
      // Update stats with real data from database
      setStats([
        { title: 'Total Users', value: data.stats.totalUsers.toString(), change: 'Live', color: 'blue' },
        { title: 'Active Users', value: data.stats.activeUsers.toString(), change: 'Live', color: 'green' },
        { title: 'Admin Users', value: data.stats.adminUsers.toString(), change: 'Live', color: 'red' },
        { title: 'Recent Users (7d)', value: data.stats.recentUsers.toString(), change: 'Live', color: 'purple' }
      ])
      
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err.message || err)
      setError(`Failed to load statistics: ${err.message || 'Unknown error'}`)
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

  // Fetch all RedZones for admin
  const fetchRedZones = async () => {
    try {
      setLoadingRedZones(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_ALL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }

      const data = await response.json()
      setRedZones(data.redZones)
      setError(null)
    } catch (err) {
      console.error('Error fetching RedZones:', err.message || err)
      setError(`Failed to load RedZones: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingRedZones(false)
    }
  }

  // Handle RedZone approval
  const handleApproveRedZone = async (id) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_APPROVE(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }
      
      const result = await response.json()

      // Fetch all RedZones again to update the state
      fetchRedZones()

      // Show success message
      alert('RedZone approved successfully')
    } catch (err) {
      console.error('Error approving RedZone:', err.message || err)
      setError(`Failed to approve RedZone: ${err.message || 'Unknown error'}`)
    }
  }

  // Handle RedZone rejection
  const handleRejectRedZone = async (id) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_REJECT(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }
      
      const result = await response.json()

      // Fetch all RedZones again to update the state
      fetchRedZones()

      // Show success message
      alert('RedZone rejected successfully')
    } catch (err) {
      console.error('Error rejecting RedZone:', err.message || err)
      setError(`Failed to reject RedZone: ${err.message || 'Unknown error'}`)
    }
  }
  
  // Handle marking a RedZone as safe
  const handleMarkSafe = async (id) => {
    if (!confirm('Are you sure you want to mark this RedZone as safe? This will send SMS notifications to all users.')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_SAFE_NOW(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }
      
      const result = await response.json()

      // Fetch all RedZones again to update the state
      fetchRedZones()

      // Show success message
      alert('RedZone marked as safe successfully. SMS notifications have been sent to all users.')
    } catch (err) {
      console.error('Error marking RedZone as safe:', err.message || err)
      setError(`Failed to mark RedZone as safe: ${err.message || 'Unknown error'}`)
    }
  }

  // Handle new RedZone submission
  const handleSubmitRedZone = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      // Add status as approved since it's created by admin
      const redZoneData = {
        ...newRedZone,
        status: 'approved'
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(redZoneData)
      })

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`)
      }

      const result = await response.json()

      // Reset form
      setNewRedZone({
        title: '',
        description: '',
        location: '',
        severity: 'medium'
      })

      // Add the new RedZone to the list with approved status
      setRedZones(prevRedZones => [
        {
          ...result.redZone,
          status: 'approved'
        },
        ...prevRedZones
      ])

      // Show success message
      alert('New RedZone created successfully')
    } catch (err) {
      console.error('Error creating RedZone:', err.message || err)
      setError(`Failed to create RedZone: ${err.message || 'Unknown error'}`)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchRedZones()
    fetchUserContacts()
  }, [])

  const recentActivity = [
    { action: 'New user registered', time: '2 minutes ago', type: 'user' },
    { action: 'Alert triggered in Zone A', time: '5 minutes ago', type: 'alert' },
    { action: 'System backup completed', time: '1 hour ago', type: 'system' },
    { action: 'Admin login from IP 192.168.1.100', time: '2 hours ago', type: 'security' }
  ]

  return (
    <div className="admin-container">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={handleOverlayClick}></div>}
      
      {/* Mobile Hamburger Menu */}
      <div className="mobile-header">
        <div className={`hamburger-menu ${mobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>Admin Dashboard</h1>
        <div className="mobile-actions">
          <button className="mobile-refresh" onClick={fetchStats} disabled={loading}>
            <span>🔄</span>
          </button>
        </div>
      </div>

      {/* Admin Header */}
      <header className={`admin-header ${mobileMenuOpen ? 'hidden-mobile' : ''}`}>
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
      <nav ref={navRef} className={`admin-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="mobile-nav-header">
          <h2>Menu</h2>
          <button className="close-mobile-menu" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <button 
          className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard')
            setMobileMenuOpen(false)
          }}
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users')
            setMobileMenuOpen(false)
          }}
        >
          <AdminIcon />
          <span>Manage RedZones</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history')
            setMobileMenuOpen(false)
          }}
        >
          <HistoryIcon />
          <span>History</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('security')
            setMobileMenuOpen(false)
          }}
        >
          <ShieldIcon />
          <span>Users</span>
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
            <h2>RedZone Review History</h2>
            <div className="history-filters">
              <button 
                className={`btn ${historyFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setHistoryFilter('all')}
              >
                All
              </button>
              <button 
                className={`btn ${historyFilter === 'approved' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setHistoryFilter('approved')}
              >
                Approved
              </button>
              <button 
                className={`btn ${historyFilter === 'rejected' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setHistoryFilter('rejected')}
              >
                Rejected
              </button>
              <button 
                className={`btn ${historyFilter === 'safe' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setHistoryFilter('safe')}
              >
                Safe
              </button>
            </div>
            
            <div className="history-list">
              {loadingRedZones ? (
                <p>Loading history...</p>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Reviewed At</th>
                      {historyFilter === 'all' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {redZones
                      .filter(zone => {
                        if (historyFilter === 'all') return zone.status === 'approved' || zone.status === 'rejected' || zone.status === 'safe';
                        if (historyFilter === 'approved') return zone.status === 'approved';
                        if (historyFilter === 'rejected') return zone.status === 'rejected';
                        if (historyFilter === 'safe') return zone.status === 'safe';
                        return false;
                      })
                      .map((zone) => (
                        <tr key={zone._id} className={`severity-${zone.severity}`}>
                          <td>{zone.title}</td>
                          <td>{zone.location}</td>
                          <td>
                            <span className={`severity-badge ${zone.severity}`}>
                              {zone.severity.charAt(0).toUpperCase() + zone.severity.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${zone.status}`}>
                              {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(zone.reviewedAt || zone.updatedAt).toLocaleString()}</td>
                          <td>
                            {historyFilter === 'all' && zone.status !== 'safe' && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleMarkSafe(zone._id)}
                              >
                                Safe Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
              
              {!loadingRedZones && redZones.filter(zone => {
                if (historyFilter === 'all') return zone.status === 'approved' || zone.status === 'rejected' || zone.status === 'safe';
                if (historyFilter === 'approved') return zone.status === 'approved';
                if (historyFilter === 'rejected') return zone.status === 'rejected';
                if (historyFilter === 'safe') return zone.status === 'safe';
                return false;
              }).length === 0 && (
                <div className="empty-state">
                  <p>No {historyFilter === 'safe' ? 'safe zones' : 'review history'} found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-content">
            <h2>User Contacts</h2>
            <div className="user-contacts-section">
              {loadingContacts ? (
                <p>Loading contacts...</p>
              ) : userContacts.length > 0 ? (
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userContacts.map((contact) => (
                      <tr key={contact._id}>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone}</td>
                        <td>{new Date(contact.createdAt).toLocaleString()}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteContact(contact._id)}
                            className="delete-btn"
                            title="Delete Contact"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No user contacts found. Users can add their contact information from the dashboard.</p>
                </div>
              )}
              
              <button 
                onClick={fetchUserContacts} 
                className="btn btn-secondary refresh-btn"
                disabled={loadingContacts}
              >
                {loadingContacts ? 'Refreshing...' : '🔄 Refresh Contacts'}
              </button>
            </div>
          </div>
        )}

        {/* RedZones Management */}
        {activeTab === 'users' && (
          <div className="redzones-management">
            <div className="redzones-grid">
              {/* Manage RedZones Card */}
              <div className="card manage-redzones-card">
                <h2>Manage RedZones</h2>
                <div className="redzones-list">
                  {loadingRedZones ? (
                    <p>Loading RedZones...</p>
                  ) : redZones.filter(zone => zone.status === 'pending').length > 0 ? (
                    <table className="redzones-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Location</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redZones
                          .filter(zone => zone.status === 'pending')
                          .map((zone) => (
                            <tr key={zone._id} className={`severity-${zone.severity}`}>
                              <td>{zone.title}</td>
                              <td>{zone.location}</td>
                              <td>
                                <span className={`severity-badge ${zone.severity}`}>
                                  {zone.severity.charAt(0).toUpperCase() + zone.severity.slice(1)}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${zone.status}`}>
                                  {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                                </span>
                              </td>
                              <td className="action-buttons">
                                <button 
                                  onClick={() => handleApproveRedZone(zone._id)}
                                  className="approve-btn"
                                  title="Approve"
                                >
                                  ✅
                                </button>
                                <button 
                                  onClick={() => handleRejectRedZone(zone._id)}
                                  className="reject-btn"
                                  title="Reject"
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No pending RedZones found.</p>
                  )}
                </div>
              </div>

              {/* Add New RedZone Card */}
              <div className="card add-redzone-card">
                <h2>Add New RedZone</h2>
                <form onSubmit={handleSubmitRedZone} className="redzone-form">
                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      value={newRedZone.title}
                      onChange={(e) => setNewRedZone({...newRedZone, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={newRedZone.description}
                      onChange={(e) => setNewRedZone({...newRedZone, description: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={newRedZone.location}
                      onChange={(e) => setNewRedZone({...newRedZone, location: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="severity">Severity</label>
                    <select
                      id="severity"
                      value={newRedZone.severity}
                      onChange={(e) => setNewRedZone({...newRedZone, severity: e.target.value})}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="btn btn-primary">Create RedZone</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
