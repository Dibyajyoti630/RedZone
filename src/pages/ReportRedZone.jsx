import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api.js'
import './ReportRedZone.css'

function ReportRedZone() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    landmark: '',
    severity: 'medium',
    coordinates: {
      lat: null,
      lng: null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Try to get user's current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
        },
        (error) => {
          console.warn('Error getting location:', error.message)
        }
      )
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('You must be logged in to report a RedZone')
        setLoading(false)
        return
      }

      // Prepare data for submission
      const dataToSubmit = {...formData}
      
      // Only include coordinates if both lat and lng are available
      if (!dataToSubmit.coordinates.lat || !dataToSubmit.coordinates.lng) {
        delete dataToSubmit.coordinates
      }

      const response = await fetch(API_ENDPOINTS.REDZONES_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit RedZone report')
      }

      const result = await response.json()

      // Success - redirect to dashboard
      alert('RedZone report submitted successfully! It will be reviewed by an admin.')
      navigate('/dashboard')
    } catch (err) {
      console.error('Error submitting RedZone report:', err)
      setError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-redzone-container">
      <div className="report-redzone-header">
        <h1>Report a RedZone</h1>
        <p>Help keep your community safe by reporting dangerous areas</p>
      </div>

      <div className="report-redzone-content">
        <div className="report-form-container">
          <form onSubmit={handleSubmit} className="report-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="E.g., Dangerous Intersection"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the danger in detail"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Address/Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="E.g., Gunupur Market Area"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="landmark">Nearby Landmark</label>
              <input
                type="text"
                id="landmark"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="E.g., Near GIET UNIVERSITY"
              />
            </div>

            <div className="form-group">
              <label htmlFor="severity">Severity Level</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="low">Low - Caution advised</option>
                <option value="medium">Medium - Potential danger</option>
                <option value="high">High - Immediate danger</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        <div className="map-card">
          <div className="map-card-header">
            <h2>Find on Map</h2>
            <p>Locate and mark the exact position</p>
          </div>
          <div className="map-placeholder">
            <div className="map-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            {formData.coordinates.lat && formData.coordinates.lng ? (
              <div className="location-info">
                <p>Location detected:</p>
                <p className="coordinates">
                  Lat: {formData.coordinates.lat.toFixed(6)}<br />
                  Lng: {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p>Attempting to detect your location...</p>
            )}
          </div>
        </div>
      </div>

      <div className="report-actions">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn btn-ghost"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ReportRedZone