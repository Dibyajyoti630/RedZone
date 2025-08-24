import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CONFIG } from '../config/maps.js'

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">!</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background-color: #4285F4;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

// Component to handle map center updates
function MapUpdater({ center, zoom, shouldCenterOnUser }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && shouldCenterOnUser) {
      map.setView([center.lat, center.lng], zoom, {
        animate: true,
        duration: 1
      })
    }
  }, [center, zoom, map, shouldCenterOnUser])
  
  return null
}

function Map() {
  const [userLocation, setUserLocation] = useState(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [redZones, setRedZones] = useState([])
  const [currentStatus, setCurrentStatus] = useState('safe')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(false)
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobilePermissionStatus, setMobilePermissionStatus] = useState(null)
  const mapRef = useRef(null)
  const watchIdRef = useRef(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice)
      console.log('Device detected:', isMobileDevice ? 'Mobile' : 'Desktop')
      return isMobileDevice
    }
    
    checkMobile()
  }, [])

  // Handle map loading state
  useEffect(() => {
    // Set initial loading state
    setMapLoading(true);
    
    // Create a timeout to ensure map loading state is reset even if map fails to load
    const loadingTimeout = setTimeout(() => {
      console.log('Map loading timeout reached, forcing loading state to false');
      setMapLoading(false);
    }, 10000); // 10 seconds timeout
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Check mobile geolocation permissions
  const checkMobilePermissions = useCallback(async () => {
    if (!isMobile) return
    
    try {
      // Check if we can query permissions
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        setMobilePermissionStatus(result.state)
        console.log('📱 Mobile permission status:', result.state)
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setMobilePermissionStatus(result.state)
          console.log('📱 Permission status changed to:', result.state)
        })
      }
    } catch (error) {
      console.log('⚠️ Could not check mobile permissions:', error)
    }
  }, [isMobile])

  // Mobile-specific permission request
  const requestMobilePermission = useCallback(() => {
    if (!isMobile) return
    
    console.log('📱 Requesting mobile location permission...')
    
    // Try to get a quick position to trigger permission request
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Mobile permission granted!')
        setMobilePermissionStatus('granted')
        // Don't set location yet, let the main enableLocation function handle it
      },
      (error) => {
        console.log('Mobile permission request failed:', error.code)
        if (error.code === error.PERMISSION_DENIED) {
          setMobilePermissionStatus('denied')
          setError('Mobile Location Permission Denied\\n\\n Please follow these steps:\\n\\n1. **Close this browser tab**\\n2. **Go to Phone Settings** → Apps → Browser → Permissions → Location → **Allow**\\n3. **Reopen the website** and try again\\n\\n💡 Alternative: Use the "Manual Location" button below')
        }
      },
      {
        enableHighAccuracy: false,  // Use low accuracy for permission request
        timeout: 10000,            // Short timeout
        maximumAge: 60000          // Allow cached location for permission check
      }
    )
  }, [isMobile])

  // Mock RedZone data - in real app, this would come from API
  const mockRedZones = [
    {
      id: 1,
      name: "Gunpur Market Area",
      position: { lat: 19.0769, lng: 83.7603 },
      severity: "high",
      description: "High crime area reported near market",
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 2,
      name: "GIET Campus",
      position: { lat: 19.0789, lng: 83.7623 },
      severity: "medium",
      description: "Suspicious activity reported near campus",
      timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 3,
      name: "Railway Station",
      position: { lat: 19.0749, lng: 83.7583 },
      severity: "low",
      description: "Minor incident reported near station",
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

  // Check browser geolocation support
  const checkGeolocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      console.error(' Geolocation not supported')
      return false
    }
    
    // Check if we have permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('🔐 Geolocation permission status:', result.state)
        if (result.state === 'denied') {
          console.error('Geolocation permission denied')
        }
      })
    }
    
    // Check GPS availability
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(' GPS test successful:', {
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          })
        },
        (error) => {
          console.log(' GPS test failed:', {
            code: error.code,
            message: error.message,
            suggestion: error.code === 2 ? 'Try going outside or enabling GPS on your device' : 'Check browser permissions'
          })
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    }
    
    return true
  }, [])

  // Load RedZones and notifications
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check geolocation support first
        checkGeolocationSupport()
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800))
    setRedZones(mockRedZones)
    setNotifications(mockNotifications)
        setLoading(false)
      } catch (error) {
        console.error('Error loading initial data:', error)
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [checkGeolocationSupport])

  // Cleanup location watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const enableLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLocationLoading(true)
      setError(null)
      
      // Add a safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        if (locationLoading) {
          console.warn('⚠️ Location request taking too long, showing timeout message')
          setError('⚠️ Location request is taking longer than expected. This might mean:\n\n• GPS signal is weak\n• You are indoors\n• Device GPS is slow\n\nTry moving to an open area or refreshing the page.')
          setLocationLoading(false)
        }
      }, 35000) // 35 seconds (5 seconds more than the geolocation timeout)
      
      // Check permission status first
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('🔐 Current permission status:', result.state)
          if (result.state === 'denied') {
            clearTimeout(safetyTimeout)
            setError('❌ Location permission denied. Please follow these steps:\n\n1. Click the lock/info icon in your browser address bar\n2. Change "Location" from "Block" to "Allow"\n3. Refresh the page and try again\n\nIf you still see "Block", try using a different browser.')
            setLocationLoading(false)
            return
          }
        }).catch((permError) => {
          console.log('⚠️ Could not check permission status:', permError)
        })
      }
      
      // Mobile-specific location options
      const locationOptions = isMobile ? {
        enableHighAccuracy: true,
        timeout: 45000,        // Longer timeout for mobile GPS
        maximumAge: 0,         // Always get fresh location
        forceRequest: true     // Force new request
      } : {
        enableHighAccuracy: true,
        timeout: 30000,        // Standard timeout for desktop
        maximumAge: 0,         // Always get fresh location
        forceRequest: true     // Force new request
      }
      
      console.log('🔍 Requesting location with options:', locationOptions)
      console.log('📍 Browser geolocation available:', !!navigator.geolocation)
      console.log('🌐 HTTPS required for geolocation:', window.location.protocol === 'https:')
      console.log('📱 Mobile device:', isMobile)
      console.log('📱 Mobile permission status:', mobilePermissionStatus)
      
      // For mobile devices, show specific instructions
      if (isMobile && !mobilePermissionStatus) {
        console.log('📱 Mobile device detected - checking permissions...')
        checkMobilePermissions()
      }
      
      // First get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(safetyTimeout) // Clear the safety timeout
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords
          const timestamp = position.timestamp
          
          console.log('✅ Location received successfully:', {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            altitude: altitude,
            heading: heading,
            speed: speed,
            timestamp: new Date(timestamp).toLocaleString(),
            device: isMobile ? 'Mobile' : 'Desktop'
          })
          
          const newLocation = { lat: latitude, lng: longitude }
          setUserLocation(newLocation)
          setLocationAccuracy(accuracy)
          setLocationEnabled(true)
          setShouldCenterOnUser(true)
          checkCurrentStatus(latitude, longitude)
          setLocationLoading(false)
          
          // Start watching for location changes with better options
          startLocationWatching()
        },
        (error) => {
          clearTimeout(safetyTimeout) // Clear the safety timeout
          console.error('❌ Geolocation error occurred:', error)
          console.error('❌ Error code:', error.code)
          console.error('❌ Error message:', error.message)
          console.error('📱 Device type:', isMobile ? 'Mobile' : 'Desktop')
          
          let errorMessage = 'Unable to get your location. Please check your browser settings.'
          
          if (isMobile) {
            // Mobile-specific error messages
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '❌ Mobile Location Access Denied\\n\\n📱 On your phone, you need to:\\n\\n1. **Allow location access** when prompted\\n2. **Enable GPS** in your phone settings\\n3. **Check browser permissions** in phone settings\\n\\n🔧 Try these steps:\\n• Go to Phone Settings → Apps → Browser → Permissions → Location → Allow\\n• Make sure GPS is turned ON in Quick Settings\\n• Try using Chrome or Safari browser\\n• Go outside for better GPS signal'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = '❌ Mobile GPS Unavailable (Error Code 2)\\n\\n📱 This usually means:\\n\\n• GPS is OFF in your phone settings\\n• You are indoors (GPS signals weak)\\n• Phone GPS hardware issue\\n• Network location failed\\n\\n🔧 Mobile fixes:\\n• Pull down Quick Settings → Turn ON GPS/Location\\n• Go to Settings → Location → Turn ON\\n• Go outside or near a window\\n• Check if GPS works in Google Maps app\\n• Use "Manual Location" button below'
                break
              case error.TIMEOUT:
                errorMessage = '❌ Mobile GPS Timeout\\n\\n📱 GPS is taking too long. Try:\\n\\n• Going outside for better GPS signal\\n• Turning GPS OFF and ON again\\n• Restarting your phone\\n• Using "Manual Location" button below'
                break
              default:
                errorMessage = '❌ Mobile Location Error\\n\\n📱 Unknown error. Try:\\n\\n• Refreshing the page\\n• Using a different browser\\n• Checking phone GPS settings\\n• Using "Manual Location" button below'
            }
          } else {
            // Desktop error messages (existing code)
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '❌ Location access denied. Please follow these steps:\n\n1. Click the lock/info icon in your browser address bar\n2. Change "Location" from "Block" to "Allow"\n3. Refresh the page and try again\n\nIf you still see "Block", try using a different browser.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = '❌ GPS Location Unavailable (Error Code 2). This means:\n\n• GPS is disabled on your device\n• You are indoors (GPS signals are weak)\n• Device GPS hardware is not working\n• Network-based location failed\n\n🔧 Try these fixes:\n• Go outside or near a window\n• Enable GPS in device settings\n• Check if GPS works in Google Maps\n• Use "Manual Location" button below'
                break
              case error.TIMEOUT:
                errorMessage = '❌ Location request timed out. This might happen if:\n\n• GPS signal is weak\n• You are indoors\n• Device GPS is slow to respond\n\nTry moving to an open area and refreshing location.'
                break
              default:
                errorMessage = `❌ Unknown location error (Code: ${error.code}). Please try:\n\n• Refreshing the page\n• Using a different browser\n• Checking if GPS works in other apps`
            }
          }
          
          setError(errorMessage)
          setLocationLoading(false)
        },
        locationOptions
      )
    } else {
      const errorMsg = '❌ Geolocation is not supported by this browser. Please use a modern browser like Chrome, Firefox, or Edge.'
      console.error(errorMsg)
      setError(errorMsg)
      setLocationLoading(false)
    }
  }, [locationLoading, isMobile, mobilePermissionStatus, checkMobilePermissions])

  const startLocationWatching = useCallback(() => {
    if (navigator.geolocation) {
      const watchOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,    // Update every 10 seconds for better accuracy
        forceRequest: true     // Force new requests
      }
      
      console.log('👀 Starting location watching with options:', watchOptions)
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords
          const timestamp = position.timestamp
          
          console.log('🔄 Location updated:', {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            altitude: altitude,
            heading: heading,
            speed: speed,
            timestamp: new Date(timestamp).toLocaleString()
          })
          
          const newLocation = { lat: latitude, lng: longitude }
          setUserLocation(newLocation)
          setLocationAccuracy(accuracy)
          checkCurrentStatus(latitude, longitude)
        },
        (error) => {
          console.error('❌ Error watching location:', error)
        },
        watchOptions
      )
    }
  }, [])

  const centerOnMyLocation = useCallback(() => {
    if (userLocation) {
      setShouldCenterOnUser(true)
    } else {
      enableLocation()
    }
  }, [userLocation, enableLocation])

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

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
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

  const mapCenter = useMemo(() => {
    return userLocation || MAP_CONFIG.defaultCenter
  }, [userLocation])

  const mapZoom = useMemo(() => {
    return userLocation ? MAP_CONFIG.userLocationZoom : MAP_CONFIG.defaultZoom
  }, [userLocation])

  // Show initial loading text
  if (loading) {
    return (
      <div className="map-page">
        <div className="map-container">
          <div className="loading-spinner">
            <p>Loading...</p>
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
              {!locationEnabled && (
                <div className="location-controls">
                  <h3>📍 Enable Location Services</h3>
                  <p>To see your current location and nearby RedZones, please enable location access.</p>
                  
                  {isMobile && (
                    <div className="mobile-location-help">
                      <h4>📱 Mobile Device Detected</h4>
                      <div className="mobile-instructions">
                        <p><strong>Before clicking "Enable Location":</strong></p>
                        <ol>
                          <li>Make sure <strong>GPS is ON</strong> in your phone settings</li>
                          <li>Pull down Quick Settings → Turn ON <strong>Location/GPS</strong></li>
                          <li>Go to <strong>Settings → Location → Turn ON</strong></li>
                          <li>Go <strong>outside or near a window</strong> for better GPS signal</li>
                        </ol>
                        <p><small>💡 Tip: If GPS doesn't work, try using the "Manual Location" button below</small></p>
                        
                        {mobilePermissionStatus === 'denied' && (
                          <div className="permission-denied-help">
                            <p><strong>🚫 Location Permission Denied</strong></p>
                            <button 
                              onClick={requestMobilePermission} 
                              className="btn btn-warning"
                            >
                              🔐 Request Permission Again
                            </button>
                          </div>
                        )}
                        
                        {mobilePermissionStatus === 'prompt' && (
                          <div className="permission-prompt-help">
                            <p><strong>❓ Location Permission Not Set</strong></p>
                            <button 
                              onClick={requestMobilePermission} 
                              className="btn btn-info"
                            >
                              🔐 Grant Location Permission
                </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={enableLocation} 
                    className={`btn btn-primary ${locationLoading ? 'loading' : ''}`}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        📍 {isMobile ? 'Enable Mobile GPS' : 'Enable Location Services'}
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => {
                      const lat = prompt('Enter your latitude (e.g., 19.0769):')
                      const lng = prompt('Enter your longitude (e.g., 83.7603):')
                      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                        const manualLocation = { lat: parseFloat(lat), lng: parseFloat(lng) }
                        setUserLocation(manualLocation)
                        setLocationEnabled(true)
                        setShouldCenterOnUser(true)
                        checkCurrentStatus(parseFloat(lat), parseFloat(lng))
                        setError(null)
                      }
                    }} 
                    className="btn btn-secondary"
                  >
                    🎯 Manual Location
                  </button>
                </div>
              )}

              {locationEnabled && (
                <div className="location-controls">
                <div className="location-status">
                  <span className="location-indicator">📍</span>
                    <span>Location Active</span>
                    {locationAccuracy && (
                      <span className="accuracy-info">
                        (Accuracy: ±{Math.round(locationAccuracy)}m)
                      </span>
                    )}
                  </div>
                  <button onClick={centerOnMyLocation} className="btn btn-secondary">
                    🎯 Center on My Location
                  </button>
                  
                  <button 
                    onClick={() => {
                      console.log('🔄 Manually refreshing location...')
                      setLocationLoading(true)
                      // Force a completely fresh location reading
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude, accuracy } = position.coords
                          const newLocation = { lat: latitude, lng: longitude }
                          setUserLocation(newLocation)
                          setLocationAccuracy(accuracy)
                          setShouldCenterOnUser(true)
                          checkCurrentStatus(latitude, longitude)
                          setLocationLoading(false)
                          console.log('✅ Location refreshed manually:', newLocation)
                        },
                        (error) => {
                          console.error('❌ Manual refresh failed:', error)
                          setLocationLoading(false)
                        },
                        {
                          enableHighAccuracy: true,
                          timeout: 60000,        // 1 minute timeout
                          maximumAge: 0,         // No caching at all
                          forceRequest: true     // Force new request
                        }
                      )
                    }} 
                    className="btn btn-secondary"
                    disabled={locationLoading}
                  >
                    {locationLoading ? '🔄 Refreshing...' : '🔄 Refresh Location'}
                  </button>
                </div>
              )}
            </div>

            <div className="map-area">
              {error ? (
                <div className="map-error">
                  <div className="error-content">
                    {error.split('\n').map((line, index) => (
                      <p key={index} className={line.startsWith('•') ? 'error-bullet' : 'error-text'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="error-actions">
                    <button onClick={enableLocation} className="btn btn-primary">
                      🔄 Try Again
                    </button>
                    <button onClick={() => setError(null)} className="btn btn-secondary">
                      ❌ Dismiss
                    </button>
                    <button 
                      onClick={() => {
                        const lat = prompt('Enter your latitude (e.g., 19.0769):')
                        const lng = prompt('Enter your longitude (e.g., 83.7603):')
                        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                          const manualLocation = { lat: parseFloat(lat), lng: parseFloat(lng) }
                          setUserLocation(manualLocation)
                          setLocationEnabled(true)
                          setShouldCenterOnUser(true)
                          setError(null)
                          setLocationAccuracy(100) // Assume manual input has ~100m accuracy
                          checkCurrentStatus(parseFloat(lat), parseFloat(lng))
                          console.log('📍 Manual location set:', manualLocation)
                        } else if (lat !== null && lng !== null) {
                          alert('Please enter valid coordinates (numbers only)')
                        }
                      }} 
                      className="btn btn-secondary"
                    >
                      📍 Manual Location
                  </button>
                  </div>
                </div>
              ) : (
                <>
                  {mapLoading && (
                    <div className="map-loading-overlay" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      zIndex: 1000,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div className="map-loading-text" style={{
                        textAlign: 'center',
                        padding: '20px'
                      }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>Loading...</p>
                      </div>
                    </div>
                  )}
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={mapZoom}
                    style={MAP_CONFIG.mapContainerStyle}
                    {...MAP_CONFIG.leafletOptions}
                    ref={mapRef}
                    whenReady={() => {
                      console.log('Map is ready');
                      setMapLoading(false);
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      eventHandlers={{
                        loading: () => {
                          console.log('Tiles loading');
                          setMapLoading(true);
                        },
                        load: () => {
                          console.log('Tiles loaded');
                          setMapLoading(false);
                        },
                        error: (e) => {
                          console.error('Tile loading error:', e);
                          setMapLoading(false);
                        }
                      }}
                    />
                    
                    <MapUpdater 
                      center={mapCenter} 
                      zoom={mapZoom} 
                      shouldCenterOnUser={shouldCenterOnUser}
                    />

                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userLocationIcon}
                      >
                        <Popup>
                          <div>
                            <h4>📍 Your Exact Location</h4>
                            <p><strong>Latitude:</strong> {userLocation.lat.toFixed(8)}</p>
                            <p><strong>Longitude:</strong> {userLocation.lng.toFixed(8)}</p>
                            {locationAccuracy && (
                              <p><strong>Accuracy:</strong> ±{Math.round(locationAccuracy)} meters</p>
                            )}
                            <p><small>Last updated: {new Date().toLocaleTimeString()}</small></p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* RedZone Markers */}
                    {redZones.map(zone => (
                      <Marker
                        key={zone.id}
                        position={[zone.position.lat, zone.position.lng]}
                        icon={createCustomIcon(getMarkerColor(zone.severity))}
                      >
                        <Popup>
                          <div className="info-window">
                            <h3>{zone.name}</h3>
                            <p><strong>Severity:</strong> {zone.severity.toUpperCase()}</p>
                            <p>{zone.description}</p>
                            <p><small>Reported: {formatTimestamp(zone.timestamp)}</small></p>
                            {userLocation && (
                              <p><small>Distance: {calculateDistance(
                                userLocation.lat, 
                                userLocation.lng, 
                                zone.position.lat, 
                                zone.position.lng
                              ).toFixed(2)} km away</small></p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </>
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
              {userLocation && (
                <div className="location-info">
                  <p><small>📍 Your exact coordinates:</small></p>
                  <p><small>{userLocation.lat.toFixed(8)}, {userLocation.lng.toFixed(8)}</small></p>
                  {locationAccuracy && (
                    <p><small>📍 Accuracy: ±{Math.round(locationAccuracy)} meters</small></p>
                  )}
                  {locationAccuracy && locationAccuracy > 100 && (
                    <p className="accuracy-warning">
                      ⚠️ <small>Low accuracy location detected. This might be why your position appears incorrect. Try moving to an open area or refreshing location.</small>
                    </p>
                  )}
                  <p><small>🕒 Last updated: {new Date().toLocaleTimeString()}</small></p>
                  
                  {/* Location Debug Panel */}
                  <div className="location-debug">
                    <details>
                      <summary>🔍 Location Debug Info</summary>
                      <div className="debug-details">
                        <p><small><strong>Expected Location:</strong> 19.0769°N, 83.7603°E</small></p>
                        <p><small><strong>Your Location:</strong> {userLocation.lat.toFixed(8)}°N, {userLocation.lng.toFixed(8)}°E</small></p>
                        <p><small><strong>Difference:</strong> {Math.abs(userLocation.lat - 19.0769).toFixed(6)}° lat, {Math.abs(userLocation.lng - 83.7603).toFixed(6)}° lng</small></p>
                        <p><small><strong>Distance from Expected:</strong> {calculateDistance(userLocation.lat, userLocation.lng, 19.0769, 83.7603).toFixed(2)} km</small></p>
                        {locationAccuracy && (
                          <p><small><strong>GPS Accuracy:</strong> ±{Math.round(locationAccuracy)}m ({locationAccuracy < 10 ? 'Excellent' : locationAccuracy < 50 ? 'Good' : locationAccuracy < 100 ? 'Fair' : 'Poor'})</small></p>
                        )}
                        <p><small><strong>Location Source:</strong> {locationAccuracy && locationAccuracy < 50 ? 'GPS (High Accuracy)' : 'Network/Approximate'}</small></p>
                      </div>
                    </details>
                  </div>
                </div>
              )}
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
