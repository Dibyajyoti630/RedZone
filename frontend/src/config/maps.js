// Leaflet with OpenStreetMap Configuration
// OpenStreetMap provides free mapping tiles
// No API key required!

export const MAP_CONFIG = {
  defaultCenter: {
    lat: 19.0755,  // User's specific latitude
    lng: 83.8128   // User's specific longitude
  },
  defaultZoom: 12,
  userLocationZoom: 15,
  mapContainerStyle: {
    width: '100%',
    height: '500px'
  },
  // Leaflet specific configuration
  leafletOptions: {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    dragging: true,
    touchZoom: true
  }
}
