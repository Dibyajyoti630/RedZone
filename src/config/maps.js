// Google Maps Configuration
// Get your API key from: https://console.cloud.google.com/
// Enable Maps JavaScript API and Places API

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: {
    lat: 40.7128,
    lng: -74.0060
  },
  defaultZoom: 12,
  userLocationZoom: 15,
  mapContainerStyle: {
    width: '100%',
    height: '500px'
  }
}
