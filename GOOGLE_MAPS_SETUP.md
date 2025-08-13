# Google Maps Integration Setup

This guide will help you set up Google Maps integration for the RedZone application.

## Prerequisites

1. A Google Cloud Platform account
2. A billing account (Google Maps API requires billing to be enabled)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (for future features)

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

## Step 4: Restrict API Key (Recommended)

1. Click on the created API key to edit it
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s):
   - For development: `http://localhost:5173/*`
   - For production: `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select the APIs you enabled (Maps JavaScript API, Places API)
6. Click "Save"

## Step 5: Configure Environment Variables

1. Create a `.env` file in the root directory of your project
2. Add your API key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important:** Never commit your API key to version control. The `.env` file should be in your `.gitignore`.

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the map page
3. Click "Enable Location Services"
4. Allow location access when prompted
5. You should see the Google Map with your location and RedZone markers

## Features

- **Real-time Location Tracking**: Shows your exact location on the map
- **RedZone Markers**: Displays dangerous areas with severity indicators
- **Interactive Info Windows**: Click markers to see details
- **Status Calculation**: Automatically calculates your safety status based on proximity to RedZones
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

### Map Not Loading
- Check if your API key is correct
- Verify that Maps JavaScript API is enabled
- Check browser console for error messages
- Ensure billing is enabled on your Google Cloud project

### Location Not Working
- Check if HTTPS is enabled (required for geolocation)
- Verify browser permissions for location access
- Try refreshing the page and allowing location again

### API Quota Exceeded
- Check your Google Cloud Console for usage limits
- Consider upgrading your billing plan if needed

## Security Notes

- Always restrict your API key to specific domains
- Monitor your API usage in Google Cloud Console
- Never expose your API key in client-side code (use environment variables)
- Consider implementing rate limiting for production use

## Cost Considerations

- Google Maps API has usage-based pricing
- First $200 of usage per month is free
- Monitor your usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
