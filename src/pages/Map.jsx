import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../config/maps.js'

function Map() {
  const [userLocation, setUserLocation] = useState(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [redZones, setRedZones] = useState([])
  const [currentStatus, setCurrentStatus] = useState('safe')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [map, setMap] = useState(null)
  const [showFallbackMap, setShowFallbackMap] = useState(false)

  // Mock RedZone data - in real app, this would come from API
  const mockRedZones = [
    {
      id: 1,
      name: "Gunpur Area",
      position: { lat: 40.7128, lng: -74.0060 },
      severity: "high",
      description: "High crime area reported",
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 2,
      name: "GIET",
      position: { lat: 40.7589, lng: -73.9851 },
      severity: "medium",
      description: "Suspicious activity reported",
      timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 3,
      name: "Railway Station",
      position: { lat: 40.7505, lng: -73.9934 },
      severity: "low",
      description: "Minor incident reported",
      timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    }
  ]

  // Mock notifications
  const mockNotifications = [
    {
      id: 1,
      type: "warning",
      message: "You are approaching a high-risk area",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: "info",
      message: "New RedZone reported in your area",
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
  ]

  // Check if Google Maps API key is properly configured
  const isApiKeyValid = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE'

  // Load Google Maps API only if API key is valid
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: isApiKeyValid ? GOOGLE_MAPS_API_KEY : '',
    libraries: ['places']
  })

  useEffect(() => {
    // Load RedZones and notifications immediately
    setRedZones(mockRedZones)
    setNotifications(mockNotifications)
    
    // If API key is invalid, show fallback map immediately
    if (!isApiKeyValid) {
      setShowFallbackMap(true)
      setLoading(false)
    } else {
      // Wait for Google Maps to load
      if (isLoaded) {
        setLoading(false)
      }
    }
  }, [isLoaded, isApiKeyValid])

  // Handle Google Maps load error
  useEffect(() => {
    if (loadError && isApiKeyValid) {
      console.error('Google Maps load error:', loadError)
      setError('Failed to load Google Maps. Please check your internet connection.')
      setShowFallbackMap(true)
      setLoading(false)
    }
  }, [loadError, isApiKeyValid])

  const enableLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newLocation = { lat: latitude, lng: longitude }
          setUserLocation(newLocation)
          setLocationEnabled(true)
          checkCurrentStatus(latitude, longitude)
          
          // Center map on user location
          if (map) {
            map.panTo(newLocation)
            map.setZoom(MAP_CONFIG.userLocationZoom)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get your location. Please check your browser settings.')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
    }
  }, [map])

  const checkCurrentStatus = (lat, lng) => {
    // Calculate distance to nearest RedZone
    let nearestDistance = Infinity
    let nearestSeverity = 'safe'

    redZones.forEach(zone => {
      const distance = calculateDistance(lat, lng, zone.position.lat, zone.position.lng)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestSeverity = zone.severity
      }
    })

    // Set status based on distance and severity
    if (nearestDistance < 0.5) { // Within 0.5 km
      setCurrentStatus(nearestSeverity === 'high' ? 'danger' : 'warning')
    } else if (nearestDistance < 2) { // Within 2 km
      setCurrentStatus('warning')
    } else {
      setCurrentStatus('safe')
    }
  }

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return '#10B981'
      case 'warning': return '#F59E0B'
      case 'danger': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return '🟢'
      case 'warning': return '🟡'
      case 'danger': return '🔴'
      default: return '⚪'
    }
  }

  const getMarkerIcon = (severity) => {
    switch (severity) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const onMapLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const onMapUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Show API key configuration error
  if (!isApiKeyValid) {
    return (
      <div className="map-page">
        <div className="map-container">
          <div className="map-header">
            <h1>RedZone Map</h1>
            <p>Interactive map showing dangerous areas and RedZones</p>
          </div>
          
          <div className="map-error">
            <h2>Google Maps API Key Required</h2>
            <p>To use the interactive map, you need to configure a Google Maps API key.</p>
            <div className="api-key-instructions">
              <h3>Setup Instructions:</h3>
              <ol>
                {/* <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li> */}
                <li>Enable Maps JavaScript API and Places API</li>
                {/* <li>Create a <code>.env</code> file in your project root</li> */}
                <li>Add: <code>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</code></li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <p>For detailed instructions, see <code>GOOGLE_MAPS_SETUP.md</code></p>
          </div>

          <div className="map-footer">
            <Link to="/dashboard" className="btn btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show loading spinner only when actually loading Google Maps
  if (loading && isApiKeyValid) {
    return (
      <div className="map-page">
        <div className="map-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Google Maps...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="map-page">
      <div className="map-container">
        <div className="map-header">
          <h1>RedZone Map</h1>
          <p>Interactive map showing dangerous areas and RedZones</p>
        </div>

        <div className="map-layout">
          {/* Main Map Area */}
          <div className="map-main">
            <div className="map-controls">
              {!locationEnabled ? (
                <button onClick={enableLocation} className="btn btn-primary">
                  📍 Enable Location Services
                </button>
              ) : (
                <div className="location-status">
                  <span className="location-indicator">📍</span>
                  <span>Location Enabled</span>
                </div>
              )}
            </div>

            <div className="map-area">
              {error ? (
                <div className="map-error">
                  <p>{error}</p>
                  <button onClick={enableLocation} className="btn btn-secondary">
                    Try Again
                  </button>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={MAP_CONFIG.mapContainerStyle}
                  center={userLocation || MAP_CONFIG.defaultCenter}
                  zoom={userLocation ? MAP_CONFIG.userLocationZoom : MAP_CONFIG.defaultZoom}
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  options={{
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                      }
                    ],
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: false
                  }}
                >
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" fill="white"/>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(24, 24),
                        anchor: new window.google.maps.Point(12, 12)
                      }}
                      title="Your Location"
                    />
                  )}

                  {/* RedZone Markers */}
                  {redZones.map(zone => (
                    <Marker
                      key={zone.id}
                      position={zone.position}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="${zone.severity === 'high' ? '#EF4444' : zone.severity === 'medium' ? '#F59E0B' : '#10B981'}" stroke="white" stroke-width="2"/>
                            <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">!</text>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16)
                      }}
                      onClick={() => setSelectedMarker(zone)}
                      title={zone.name}
                    />
                  ))}

                  {/* Info Window for Selected Marker */}
                  {selectedMarker && (
                    <InfoWindow
                      position={selectedMarker.position}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="info-window">
                        <h3>{selectedMarker.name}</h3>
                        <p><strong>Severity:</strong> {selectedMarker.severity.toUpperCase()}</p>
                        <p>{selectedMarker.description}</p>
                        <p><small>Reported: {formatTimestamp(selectedMarker.timestamp)}</small></p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>

          {/* Side Cards */}
          <div className="map-sidebar">
            {/* Current Status Card */}
            <div className="status-card">
              <h3>Current Status</h3>
              <div className="status-indicator" style={{ backgroundColor: getStatusColor(currentStatus) }}>
                <span className="status-icon">{getStatusIcon(currentStatus)}</span>
                <span className="status-text">{currentStatus.toUpperCase()}</span>
              </div>
              <p className="status-description">
                {currentStatus === 'safe' && 'You are in a safe area'}
                {currentStatus === 'warning' && 'Exercise caution in this area'}
                {currentStatus === 'danger' && 'High-risk area detected. Stay alert!'}
              </p>
            </div>

            {/* Notifications Card */}
            <div className="notifications-card">
              <h3>Notifications</h3>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={`notification-item notification-${notification.type}`}>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-notifications">No new notifications</p>
                )}
              </div>
            </div>

            {/* History Card */}
            <div className="history-card">
              <h3>Recent RedZones</h3>
              <div className="history-list">
                {redZones.length > 0 ? (
                  redZones.map(zone => (
                    <div key={zone.id} className="history-item">
                      <div className="history-header">
                        <span className={`severity-badge severity-${zone.severity}`}>
                          {zone.severity.toUpperCase()}
                        </span>
                        <span className="history-time">{formatTimestamp(zone.timestamp)}</span>
                      </div>
                      <h4>{zone.name}</h4>
                      <p>{zone.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-history">No recent RedZones</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="map-footer">
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Map
