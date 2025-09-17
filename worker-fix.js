// Fix for the OAuth callback to handle undefined siteName and url
// Replace the relevant section in your worker with this:

// In the handleOAuthCallback function, around line 200-250, replace the site data handling:

// Get sites
const sitesResponse = await fetch('https://api.webflow.com/v2/sites', {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`,
    'accept-version': '2.0.0'
  }
});

if (!sitesResponse.ok) {
  throw new Error(`Sites fetch failed: ${sitesResponse.status}`);
}

const sitesData = await sitesResponse.json();
console.log('Raw sites data from Webflow:', JSON.stringify(sitesData, null, 2));

let sites = [];
if (sitesData.sites) {
  sites = sitesData.sites;
} else if (sitesData.items) {
  sites = sitesData.items;
} else if (Array.isArray(sitesData)) {
  sites = sitesData;
}

if (sites.length === 0) {
  throw new Error('No Webflow sites found');
}

// Log the first site to see its structure
console.log('First site structure:', JSON.stringify(sites[0], null, 2));

// Generate JWT session token FIRST
const sessionToken = await createSessionToken(userData, env);

// Handle different redirect scenarios
if (isDesigner) {
  // App Interface flow - only store data for the current site
  const siteIdFromState = state.includes('_') ? state.split('_')[1] : null;
  
  // Find the specific site or use the first one
  let currentSite;
  if (siteIdFromState) {
    currentSite = sites.find(site => site.id === siteIdFromState) || sites[0];
  } else {
    currentSite = sites[0];
  }
  
  console.log('Selected site for App Interface:', JSON.stringify(currentSite, null, 2));
  
  // Store data only for the current site
  await env.ACCESSIBILITY_AUTH.put(currentSite.id, JSON.stringify({
    accessToken: tokenData.access_token,
    siteName: currentSite.name || currentSite.shortName || 'Unknown Site',
    siteId: currentSite.id,
    user: userData,
    installedAt: new Date().toISOString(),
    accessibilitySettings: {
      fontSize: 'medium',
      contrast: 'normal',
      animations: true,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      highContrast: false,
      reducedMotion: false,
      textSpacing: 'normal',
      cursorSize: 'normal'
    },
    widgetVersion: '1.0.0',
    lastUsed: new Date().toISOString()
  }), { expirationTtl: 86400 });
  
  // App Interface flow - send data to parent window
  return new Response(`<!DOCTYPE html>
    <html>
      <head>
        <title>Accessibility Widget Installed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; }
        </style>
      </head>
      <body>
        <h1 class="success">✅ Accessibility Widget Installed Successfully!</h1>
        <p>Your accessibility widget is now active on this site.</p>
        <script>
          const sessionData = {
            type: 'AUTH_SUCCESS',
            sessionToken: '${sessionToken.token}',
            user: {
              firstName: '${userData.firstName || 'User'}',
              email: '${userData.email}',
              siteId: '${currentSite.id}'
            },
            siteInfo: {
              siteId: '${currentSite.id}',
              siteName: '${currentSite.name || currentSite.shortName || 'Unknown Site'}',
              shortName: '${currentSite.shortName}',
              url: '${currentSite.url || `https://${currentSite.shortName}.webflow.io`}'
            }
          };
          
          window.opener.postMessage(sessionData, '*');
          window.close();
        </script>
      </body>
    </html>`, {
    headers: { 'Content-Type': 'text/html' }
  });
}
