# MapTiler Setup Guide

This project now uses MapTiler for mapping services instead of Google Maps. MapTiler provides high-quality vector tiles and mapping services.

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in your project root with the following content:

```env
# MapTiler API Configuration
VITE_MAPTILER_API_KEY=bVHolrvE2iZ25qh9Nacp

# Backend Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/redzone
JWT_SECRET=your_jwt_secret_here
```

### 2. Install Dependencies

The MapLibre GL JS library has been installed. If you need to reinstall:

```bash
npm install maplibre-gl
```

### 3. Start the Development Server

```bash
npm run dev
```

## Features

- **Interactive Map**: High-quality vector tiles from MapTiler
- **RedZone Markers**: Color-coded markers for different severity levels
- **User Location**: GPS-based location tracking
- **Popups**: Detailed information for each RedZone
- **Navigation Controls**: Zoom, pan, and geolocation controls
- **Responsive Design**: Works on desktop and mobile devices

## MapTiler API Key

The API key `bVHolrvE2iZ25qh9Nacp` has been configured in the project. This key provides access to:
- Street maps
- Satellite imagery
- Terrain data
- Custom styling options

## Customization

You can customize the map by modifying the `MAP_CONFIG` object in `src/config/maps.js`:

- Change default center coordinates
- Adjust zoom levels
- Modify map styles
- Update attribution text

## Troubleshooting

If the map doesn't load:
1. Check that the `.env` file exists with the correct API key
2. Ensure you have an internet connection
3. Verify that the MapLibre GL JS library is installed
4. Check the browser console for any error messages

## MapTiler vs Google Maps

**Advantages of MapTiler:**
- More generous free tier
- Better performance with vector tiles
- More customization options
- Open-source MapLibre GL JS library
- No usage limits for basic features

For more information, visit: https://cloud.maptiler.com/
