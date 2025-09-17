// Complete Accessibility Widget Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    // OAuth Authorization - redirect to Webflow
    if (url.pathname === '/api/auth/authorize') {
      return handleOAuthAuthorize(request, env);
    }
    
    // OAuth Callback - handle Webflow redirect
    if (url.pathname === '/api/auth/callback') {
      return handleOAuthCallback(request, env);
    }
    
    // Token Authentication
    if (url.pathname === '/api/auth/token' && request.method === 'POST') {
      return handleTokenAuth(request, env);
    }
    
    // Get accessibility settings
    if (url.pathname === '/api/accessibility/settings' && request.method === 'GET') {
      return handleGetSettings(request, env);
    }
    
    // Update accessibility settings
    if (url.pathname === '/api/accessibility/settings' && (request.method === 'POST' || request.method === 'PUT')) {
      return handleUpdateSettings(request, env);
    }
    
    // Verify authentication
    if (url.pathname === '/api/auth/verify') {
      return handleVerifyAuth(request, env);
    }
    
    // Publish accessibility settings
    if (url.pathname === '/api/accessibility/publish' && request.method === 'POST') {
      return handlePublishSettings(request, env);
    }
    
    // Register accessibility script
    if (url.pathname === '/api/accessibility/register-script') {
      return handleRegisterScript(request, env);
    }
    
    // Apply accessibility script
    if (url.pathname === '/api/accessibility/apply-script') {
      return handleApplyScript(request, env);
    }
    
// Get accessibility configuration for hosted script
if (url.pathname === '/api/accessibility/config' && request.method === 'GET') {
  return handleGetConfig(request, env);
}

// Domain lookup endpoint
if (url.pathname === '/api/accessibility/domain-lookup' && request.method === 'GET') {
  return handleDomainLookup(request, env);
}
    
    // Default response
    return new Response('Accessibility Widget API', { 
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle CORS preflight requests
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Handle OAuth Authorization
async function handleOAuthAuthorize(request, env) {
  const url = new URL(request.url);
  const incomingState = url.searchParams.get("state");
  const siteId = url.searchParams.get("siteId");
  
  // Determine flow type and extract site ID
  const isDesigner = incomingState && incomingState.startsWith("webflow_designer");
  
  const scopes = [
    "sites:read",
    "sites:write", 
    "custom_code:read",
    "custom_code:write",
    "authorized_user:read"
  ];
  
  // Use your worker's redirect URI for both flows
  const redirectUri = "https://accessibility-widget.web-8fb.workers.dev/api/auth/callback";
  
  const authUrl = new URL('https://webflow.com/oauth/authorize');
  authUrl.searchParams.set('client_id', env.WEBFLOW_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(' '));
  
  // Set state parameter with site ID for App Interface
  if (isDesigner) {
    const currentSiteId = siteId || (incomingState.includes('_') ? incomingState.split('_')[1] : null);
    if (currentSiteId) {
      authUrl.searchParams.set('state', `webflow_designer_${currentSiteId}`);
    } else {
      authUrl.searchParams.set('state', 'webflow_designer');
    }
  } else {
    // For Apps & Integrations flow, try to get site info from referrer
    const referrer = request.headers.get('referer') || '';
    let siteInfo = '';
    
    if (referrer.includes('.design.webflow.com')) {
      const match = referrer.match(/([^.]+)\.design\.webflow\.com/);
      if (match) {
        siteInfo = `_${match[1]}`;
        console.log('Apps & Integrations: Including site info in state:', siteInfo);
      }
    }
    
    authUrl.searchParams.set('state', `accessibility_widget${siteInfo}`);
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString()
    }
  });
}

// Handle OAuth Callback
async function handleOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle missing state parameter - assume Apps & Integrations flow
  if (!state) {
    // Continue with Apps & Integrations flow instead of throwing error
  }
  
  try {
    const isDesigner = state && state.startsWith('webflow_designer');
    const isAppsIntegrations = state && state.startsWith('accessibility_widget');
    const redirectUri = "https://accessibility-widget.web-8fb.workers.dev/api/auth/callback";
    
    // Extract site info from Apps & Integrations state
    let appsIntegrationsSiteInfo = null;
    if (isAppsIntegrations && state.includes('_')) {
      const parts = state.split('_');
      if (parts.length >= 3) {
        appsIntegrationsSiteInfo = parts.slice(2).join('_'); // Get everything after accessibility_widget_
        console.log('Apps & Integrations: Extracted site info from state:', appsIntegrationsSiteInfo);
      }
    }
    
    console.log('=== OAUTH CALLBACK DEBUG ===');
    console.log('Request URL:', request.url);
    console.log('Code received:', code);
    console.log('State:', state);
    console.log('Using redirect URI:', redirectUri);
    console.log('Client ID:', env.WEBFLOW_CLIENT_ID);
    console.log('Flow type:', isDesigner ? 'App Interface' : 'Apps & Integrations');
    
    // Build token exchange request body conditionally
    const tokenRequestBody = {
      client_id: env.WEBFLOW_CLIENT_ID,
      client_secret: env.WEBFLOW_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    };
    
    // Only include redirect_uri for App Interface flow
    if (isDesigner) {
      tokenRequestBody.redirect_uri = redirectUri;
    }
    
    console.log('Token request body:', JSON.stringify(tokenRequestBody, null, 2));
    
    const tokenResponse = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody)
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    
    // Get user info
    const userResponse = await fetch('https://api.webflow.com/v2/token/authorized_by', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'accept-version': '2.0.0'
      }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User fetch failed: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
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
    
    // Generate JWT session token FIRST
    const userId = userData.id || userData.email || `user_${Date.now()}`;
    const sessionToken = await createSessionToken({...userData, id: userId}, env);
    
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
      
      // Store user authentication data in KV (REQUIRED for verifyAuth)
      const userId = userData.id || userData.email || `user_${Date.now()}`;
      await env.ACCESSIBILITY_AUTH.put(`user-auth:${userId}`, JSON.stringify({
        accessToken: tokenData.access_token,
        userData: {
          id: userId,
          email: userData.email,
          firstName: userData.firstName
        },
        siteId: currentSite.id,
        createdAt: new Date().toISOString()
      }), { expirationTtl: 86400 });
      
      // Store site data with correct key structure
      await env.ACCESSIBILITY_AUTH.put(`Accessibility-Settings:${currentSite.id}`, JSON.stringify({
        accessToken: tokenData.access_token,
        siteName: currentSite.name || currentSite.shortName || 'Unknown Site',
        siteId: currentSite.id,
        user: userData,
        installedAt: new Date().toISOString(),
        customization: {},
        accessibilityProfiles: {},
        widgetVersion: '1.0.0',
        lastUsed: new Date().toISOString()
      }), { expirationTtl: 86400 });
      
      // App Interface flow - send data to parent window with siteId parameter
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
              
              // Store siteId in sessionStorage for the widget to use
              sessionStorage.setItem('accessibility_site_id', '${currentSite.id}');
              console.log('Stored siteId in sessionStorage:', '${currentSite.id}');
              
              window.opener.postMessage(sessionData, '*');
              window.close();
            </script>
          </body>
        </html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Apps & Integrations flow - store data for the correct site only
    console.log('Apps & Integrations: Determining correct site for data storage...');
    
    let targetSite = sites[0]; // Default to first site
    
    // First, try to use site info from state parameter (most reliable)
    if (appsIntegrationsSiteInfo) {
      console.log('Apps & Integrations: Using site info from state parameter:', appsIntegrationsSiteInfo);
      
      // Find the site with matching shortName
      const foundSite = sites.find(site => site.shortName === appsIntegrationsSiteInfo);
      if (foundSite) {
        targetSite = foundSite;
        console.log('Apps & Integrations: Found matching site from state:', foundSite.id, foundSite.name || foundSite.shortName);
      } else {
        console.log('Apps & Integrations: No matching site found for state shortName:', appsIntegrationsSiteInfo);
      }
    } else {
      // Fallback: try to get site info from referrer
      const referrer = request.headers.get('referer') || '';
      console.log('Apps & Integrations: No state site info, trying referrer:', referrer);
      
      if (referrer.includes('.design.webflow.com')) {
        const match = referrer.match(/([^.]+)\.design\.webflow\.com/);
        if (match) {
          const shortName = match[1];
          console.log('Apps & Integrations: Found shortName from referrer:', shortName);
          
          const foundSite = sites.find(site => site.shortName === shortName);
          if (foundSite) {
            targetSite = foundSite;
            console.log('Apps & Integrations: Found matching site from referrer:', foundSite.id, foundSite.name || foundSite.shortName);
          }
        }
      }
    }
    
    console.log('Apps & Integrations: Storing data for site:', targetSite.id, targetSite.name || targetSite.shortName);
    
    // Store data only for the target site with correct key structure
    await env.ACCESSIBILITY_AUTH.put(`Accessibility-Settings:${targetSite.id}`, JSON.stringify({
      accessToken: tokenData.access_token,
      siteName: targetSite.name || targetSite.shortName || 'Unknown Site',
      siteId: targetSite.id,
      user: userData,
      installedAt: new Date().toISOString(),
      customization: {},
      accessibilityProfiles: {},
      widgetVersion: '1.0.0',
      lastUsed: new Date().toISOString()
    }), { expirationTtl: 86400 });
    
    // Also store the Webflow subdomain mapping for this site
    try {
      if (targetSite.shortName) {
        const webflowSubdomain = `${targetSite.shortName}.webflow.io`;
        const domainKey = `domain:${webflowSubdomain}`;
        
        await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
          siteId: targetSite.id,
          domain: webflowSubdomain,
          isPrimary: true,
          isWebflowSubdomain: true,
          connectedAt: new Date().toISOString()
        }), { expirationTtl: 86400 * 30 }); // 30 days
        
        console.log('Apps & Integrations: Stored Webflow subdomain mapping:', webflowSubdomain, '->', targetSite.id);
      }
    } catch (domainError) {
      console.warn('Apps & Integrations: Failed to store subdomain mapping:', domainError);
    }
    
    // Apps & Integrations flow - redirect to site with success message
    return new Response(`<!DOCTYPE html>
      <html>
        <head>
          <title>Accessibility Widget Installed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; }
            .redirect { color: #007bff; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1 class="success">✅Accessibility Widget Installed Successfully!</h1>
          <p>Your accessibility widget is now active on this site.</p>
          <p class="redirect">Redirecting to your site...</p>
          <script>
            // Store site info in session storage for the correct site
            sessionStorage.setItem('wf_hybrid_user', JSON.stringify({
              sessionToken: '${sessionToken.token}',
              firstName: '${userData.firstName || 'User'}',
              email: '${userData.email}',
              exp: Date.now() + (24 * 60 * 60 * 1000),
              siteInfo: {
                siteId: '${targetSite.id}',
                siteName: '${targetSite.name || targetSite.shortName || 'Unknown Site'}',
                shortName: '${targetSite.shortName}',
                url: '${targetSite.url || `https://${targetSite.shortName}.webflow.io`}'
              }
            }));
            
            // Also store siteId directly for easy access by the widget
            sessionStorage.setItem('accessibility_site_id', '${targetSite.id}');
            console.log('Apps & Integrations: Stored siteId in sessionStorage:', '${targetSite.id}');
            
            // Redirect to the correct site after a short delay
            setTimeout(() => {
              window.location.href = 'https://${targetSite.shortName}.design.webflow.com?app=${env.WEBFLOW_CLIENT_ID}';
            }, 2000);
          </script>
        </body>
      </html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authorization failed', 
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle publish accessibility settings
async function handlePublishSettings(request, env) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[PUBLISH] ${requestId} Starting publish request`);
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request, env);
    if (!authResult) {
      console.log(`[PUBLISH] ${requestId} Authentication failed`);
      return new Response(JSON.stringify({ 
        error: "Unauthorized", 
        requestId 
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Get siteId from URL parameter (preferred) or from auth result
    const url = new URL(request.url);
    const urlSiteId = url.searchParams.get('siteId');
    const siteId = urlSiteId || authResult.siteId;
    
    console.log(`[PUBLISH] ${requestId} Using siteId: ${siteId} (from ${urlSiteId ? 'URL parameter' : 'auth result'})`);
    
    if (!siteId) {
      console.log(`[PUBLISH] ${requestId} No siteId available`);
      return new Response(JSON.stringify({ 
        error: "No siteId provided", 
        requestId 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Parse the request body
    const body = await request.json();
    console.log(`[PUBLISH] ${requestId} Received body:`, body);
    console.log(`[PUBLISH] ${requestId} Body keys:`, Object.keys(body));
    console.log(`[PUBLISH] ${requestId} Customization keys:`, body.customization ? Object.keys(body.customization) : 'No customization');
    
        // Extract data from frontend
    const { 
      customization, 
      accessibilityProfiles, 
      customDomain, 
      publishedAt
    } = body;
    
        // Debug authResult
    console.log(`[PUBLISH] ${requestId} Auth result:`, JSON.stringify(authResult, null, 2));
    console.log(`[PUBLISH] ${requestId} User data from auth:`, authResult.userData);
    console.log(`[PUBLISH] ${requestId} Site name from auth:`, authResult.siteName);
    
    // Create the data to store in KV
    const dataToStore = {
      // Authorization data
      accessToken: authResult.accessToken,
      user: {
        email: authResult.userData?.email || 'unknown@example.com',
        firstName: authResult.userData?.firstName || 'Unknown',
        id: authResult.userData?.id || 'unknown'
      },
      
      // Site info
      siteId: siteId,
      siteName: authResult.siteName || 'Unknown Site',
      
      // Customization data from frontend
      customization: customization || {},
      accessibilityProfiles: accessibilityProfiles || [],
      customDomain: customDomain || null,
   
      
      // Metadata
      publishedAt: publishedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      widgetVersion: '1.0.0'
    };
    
    // Store the data in KV
    const kvKey = `Accessibility-Settings:${siteId}`;
    console.log(`[PUBLISH] ${requestId} Storing data with key: ${kvKey}`);
    console.log(`[PUBLISH] ${requestId} Data to store:`, JSON.stringify(dataToStore, null, 2));
    
    await env.ACCESSIBILITY_AUTH.put(kvKey, JSON.stringify(dataToStore));
    
    // Also store domain mappings for easy lookup
    // Get the site's domains from Webflow API
    try {
      const domainsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${authResult.accessToken}`,
          'accept-version': '1.0.0'
        }
      });
      
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        console.log(`[PUBLISH] ${requestId} Found domains:`, domainsData);
        
        // Store mapping for each domain
        for (const domain of domainsData.domains || []) {
          const domainKey = `domain:${domain.name}`;
          await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
            siteId: siteId,
            domain: domain.name,
            isPrimary: domain.isPrimary || false,
            connectedAt: new Date().toISOString()
          }), { expirationTtl: 86400 * 30 }); // 30 days
          
          console.log(`[PUBLISH] ${requestId} Stored domain mapping: ${domain.name} -> ${siteId}`);
        }
      }
    } catch (domainError) {
      console.warn(`[PUBLISH] ${requestId} Failed to get domains:`, domainError);
    }
    
    // IMPORTANT: Also store the Webflow subdomain mapping
    // This is crucial for sites that only have Webflow subdomains (like test-dbae38.webflow.io)
    try {
      // Get site info to get the shortName for Webflow subdomain
      const siteResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${authResult.accessToken}`,
          'accept-version': '2.0.0'
        }
      });
      
      if (siteResponse.ok) {
        const siteData = await siteResponse.json();
        console.log(`[PUBLISH] ${requestId} Site data:`, siteData);
        
        if (siteData.shortName) {
          const webflowSubdomain = `${siteData.shortName}.webflow.io`;
          const domainKey = `domain:${webflowSubdomain}`;
          
          await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
            siteId: siteId,
            domain: webflowSubdomain,
            isPrimary: true, // Webflow subdomain is always primary
            isWebflowSubdomain: true,
            connectedAt: new Date().toISOString()
          }), { expirationTtl: 86400 * 30 }); // 30 days
          
          console.log(`[PUBLISH] ${requestId} Stored Webflow subdomain mapping: ${webflowSubdomain} -> ${siteId}`);
        }
      }
    } catch (siteError) {
      console.warn(`[PUBLISH] ${requestId} Failed to get site info for subdomain mapping:`, siteError);
    }
    
    // If custom domain is provided, create a domain mapping
    if (customDomain) {
      const domainKey = `domain:${customDomain}`;
      await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
        siteId: siteId,
        customDomain: customDomain,
        connectedAt: new Date().toISOString()
      }), { expirationTtl: 86400 });
    }
    
    console.log(`[PUBLISH] ${requestId} Settings published successfully`);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Accessibility settings published successfully",
      data: {
        customization: dataToStore.customization,
        accessibilityProfiles: dataToStore.accessibilityProfiles,
        customDomain: dataToStore.customDomain,
        publishedAt: dataToStore.publishedAt
      },
      requestId
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error(`[PUBLISH] ${requestId} Error in publish handler:`, error);
    return new Response(JSON.stringify({
      error: "Failed to publish accessibility settings",
      details: String(error),
      requestId
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Get accessibility settings - UPDATED TO USE ONLY PUBLISHED SETTINGS
async function handleGetSettings(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // Get siteId from URL parameter (preferred) or from auth result
  const url = new URL(request.url);
  const urlSiteId = url.searchParams.get('siteId');
  const siteId = urlSiteId || authResult.siteId;
  
  if (!siteId) {
    return new Response(JSON.stringify({ error: 'No siteId provided' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  const publishedData = await env.ACCESSIBILITY_AUTH.get(`Accessibility-Settings:${siteId}`);
  if (!publishedData) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  const published = JSON.parse(publishedData);
  return new Response(JSON.stringify({
    settings: published.accessibilitySettings,
    customization: published.customization,
    accessibilityProfiles: published.accessibilityProfiles,
    customDomain: published.customDomain,
    siteId: siteId,
    siteName: published.siteName,
    installedAt: published.installedAt,
    lastUsed: published.lastUsed,
    widgetVersion: published.widgetVersion,
    publishedAt: published.publishedAt
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Handle Token Authentication - UPDATED TO USE PUBLISHED SETTINGS
async function handleTokenAuth(request, env) {
  try {
    console.log('=== TOKEN AUTH DEBUG START ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const { siteId, idToken } = await request.json();
    console.log('Parsed request body:', { siteId: !!siteId, idToken: !!idToken });
    
    if (!siteId || !idToken) {
      console.error('Missing required parameters');
      return new Response(JSON.stringify({ error: 'Missing siteId or idToken' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Get access token from published settings
    console.log('Looking up published settings for siteId:', siteId);
    const publishedData = await env.ACCESSIBILITY_AUTH.get(`Accessibility-Settings:${siteId}`);
    if (!publishedData) {
      console.error('Published settings not found in KV store');
      return new Response(JSON.stringify({ error: 'Site not found or not authorized' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const { accessToken } = JSON.parse(publishedData);
    console.log('Found access token for site');
    
    // Verify user with Webflow - UPDATED TO V2
    console.log('Verifying user with Webflow...');
    const resolveResponse = await fetch('https://api.webflow.com/v2/token/resolve', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'accept-version': '2.0.0'
      },
      body: JSON.stringify({ idToken })
    });
    
    console.log('Webflow resolve response status:', resolveResponse.status);
    
    if (!resolveResponse.ok) {
      const errorText = await resolveResponse.text();
      console.error('Token resolve failed:', resolveResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to verify user' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const userData = await resolveResponse.json();
    console.log('Resolved user data:', JSON.stringify(userData, null, 2));
    
    if (!userData.id || !userData.email) {
      console.error('Invalid user data received');
      return new Response(JSON.stringify({ error: 'Invalid user data received' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Create session token
    console.log('Creating session token...');
    const sessionToken = await createSessionToken(userData, env);
    console.log('Session token created successfully');
    
    // Store user authentication
    await env.ACCESSIBILITY_AUTH.put(`user-auth:${userData.id}`, JSON.stringify({
      accessToken,
      userData: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName
      },
      siteId,
      widgetType: 'accessibility'
    }), { expirationTtl: 86400 });
    
    console.log('User authentication stored');
    console.log('=== TOKEN AUTH DEBUG END ===');
    
    return new Response(JSON.stringify({
      sessionToken: sessionToken.token,
      email: userData.email,
      firstName: userData.firstName,
      exp: sessionToken.exp,
      widgetType: 'accessibility'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Token auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authentication failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Update accessibility settings - UPDATED TO USE PUBLISHED SETTINGS
async function handleUpdateSettings(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  const { siteId } = authResult;
  const newSettings = await request.json();
  
  const publishedData = await env.ACCESSIBILITY_AUTH.get(`Accessibility-Settings:${siteId}`);
  if (!publishedData) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  const siteInfo = JSON.parse(publishedData);
  siteInfo.accessibilitySettings = { ...siteInfo.accessibilitySettings, ...newSettings };
  siteInfo.lastUpdated = new Date().toISOString();
  siteInfo.lastUsed = new Date().toISOString();
  
  await env.ACCESSIBILITY_AUTH.put(`Accessibility-Settings:${siteId}`, JSON.stringify(siteInfo));
  
  return new Response(JSON.stringify({
    success: true,
    settings: siteInfo.accessibilitySettings,
    lastUpdated: siteInfo.lastUpdated
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Verify authentication
async function handleVerifyAuth(request, env) {
  const authResult = await verifyAuth(request, env);
  
  return new Response(JSON.stringify({
    authenticated: !!authResult,
    user: authResult?.userData || null
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}


// Register Script - Using actual Webflow API
async function handleRegisterScript(request, env) {
  try {
    console.log('=== REGISTER SCRIPT DEBUG START ===');
    
    const authResult = await verifyAuth(request, env);
    if (!authResult) {
      console.log('Authentication failed in register script');
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get siteId from URL parameter (preferred) or from auth result
    const url = new URL(request.url);
    const urlSiteId = url.searchParams.get('siteId');
    const siteId = urlSiteId || authResult.siteId;
    
    console.log('Authentication successful, using siteId:', siteId, `(from ${urlSiteId ? 'URL parameter' : 'auth result'})`);
    
    if (!siteId) {
      console.log('No siteId available for script registration');
      return new Response(JSON.stringify({ error: 'No siteId provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const scriptUrl = 'https://cdn.jsdelivr.net/gh/snm62/accessibility-test@9a686db/accessibility-widget.js';
    // Check if script is already registered - CORRECTED: Use exact match
    const existingScriptsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/registered_scripts`, {
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        'accept-version': '2.0.0'
      }
    });
    if (existingScriptsResponse.ok) {
      const existingScripts = await existingScriptsResponse.json();
      // CORRECTED: Use exact match instead of includes
      const existingScript = existingScripts.registeredScripts?.find(script =>
        script.hostedLocation === scriptUrl  // Exact match
      );
      if (existingScript) {
        console.log('Script already registered:', existingScript.id);
        return new Response(JSON.stringify({
          success: true,
          message: "Script already registered",
          result: existingScript,
          skipApplyScript: true  // ADDED: Flag to skip apply script in frontend
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
   
    const scriptResponse = await fetch(scriptUrl);
    const scriptContent = await scriptResponse.text();
    const scriptBuffer = new TextEncoder().encode(scriptContent);
    const hashBuffer = await crypto.subtle.digest('SHA-384', scriptBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    const integrityHash = `sha384-${hashBase64}`;
    
    console.log('Generated SRI hash:', integrityHash);
    
    // Register the script with Webflow
    const registerResponse = await fetch(`https://api.webflow.com/v2/sites/${authResult.siteId}/registered_scripts/hosted`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0'
      },
        body: JSON.stringify({
          displayName: `ContrastKit${Date.now()}`,
          scriptUrl: scriptUrl,
          version: '1.0.0',
          hostedLocation: scriptUrl,
          integrityHash: integrityHash,
          canCopy: false,
          isRequired: false
        })
    });
    
    console.log('Webflow API response status:', registerResponse.status);
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('Script registration failed:', registerResponse.status, errorText);
      throw new Error(`Script registration failed: ${registerResponse.status} - ${errorText}`);
    }
    
    const scriptResult = await registerResponse.json();
    console.log('Script registered successfully:', JSON.stringify(scriptResult, null, 2));
    console.log('=== REGISTER SCRIPT DEBUG END ===');
    
    return new Response(JSON.stringify({
      success: true,
      result: scriptResult
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Register script error:', error);
    console.error('Error details:', error.message, error.stack);
    return new Response(JSON.stringify({ 
      error: 'Failed to register script',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Apply Script
async function handleApplyScript(request, env) {
  try {
    const authResult = await verifyAuth(request, env);
    if (!authResult) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get siteId from URL parameter (preferred) or from auth result
    const url = new URL(request.url);
    const urlSiteId = url.searchParams.get('siteId');
    const siteId = urlSiteId || authResult.siteId;
    
    if (!siteId) {
      return new Response(JSON.stringify({ error: 'No siteId provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const requestBody = await request.json();
    const { targetType, scriptId, location, version } = requestBody;
    console.log("script request body:", requestBody);
    
    // Get existing custom code
    const existingResponse = await fetch(`https://api.webflow.com/v2/sites/${authResult.siteId}/custom_code`, {
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        'accept-version': '2.0.0'
      }
    });
    console.log("existing response status:", existingResponse.status);

    const already_registered_scripts = await fetch(`https://api.webflow.com/v2/sites/${authResult.siteId}/registered_scripts`, {
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        
      }
    });
    console.log(already_registered_scripts.registeredScripts,"already registered script");
    let existingScripts = [];
    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      existingScripts = existingData.scripts || [];
    }
    
        // Filter out duplicates - remove any existing accessibility widget scripts
    // Filter out duplicates - remove ALL accessibility widget scripts and any with same ID
    const scriptUrl = 'https://cdn.jsdelivr.net/gh/snm62/accessibility-test@9a686db/accessibility-widget.js';

    const existingAccessibilityScript = existingScripts.find(script => 
      script.scriptUrl === scriptUrl
      
    );
    console.log(existingAccessibilityScript);
    
    if (existingAccessibilityScript) {
      console.log("Exact same script already exists, not adding duplicate");
      return new Response(JSON.stringify({
        success: true,
        message: "Script already exists",
        result: existingAccessibilityScript
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const isAccessibilityScript = (url) => {
      return (
        url &&
        (url === scriptUrl ||                // exact match
         url.includes('snm-accessibility-widget') || // any version of this widget
         url.includes('accessibility-widget'))
      );
    };
     
    const filteredScripts = existingScripts.filter(script =>
      !isAccessibilityScript(script.scriptUrl)
    );
    
    // Add new script
    const newScript = {
      id: scriptId,
      version: version,
      location: 'header',
      
    };
    
    filteredScripts.push(newScript);
    
    console.log("Scripts to send to custom_code API:", JSON.stringify(filteredScripts, null, 2));
    
    // Update custom code
    const updateResponse = await fetch(`https://api.webflow.com/v2/sites/${authResult.siteId}/custom_code`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        'Content-Type': 'application/json',
        'accept-version': '2.0.0'
      },
      body: JSON.stringify({
        scripts: filteredScripts
      })
    });
    console.log("update response status:", updateResponse.status);
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Script application failed:', updateResponse.status, errorText);
      throw new Error(`Script application failed: ${updateResponse.status} - ${errorText}`);
    }
    
    const result = await updateResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      result: {
        ...result,
        scriptUrl: newScript.scriptUrl
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Apply script error:', error);
    return new Response(JSON.stringify({ error: 'Failed to apply script' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Helper function to verify authentication
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  try {
    // Verify JWT token
    const payload = await verifyJWT(token, env.WEBFLOW_CLIENT_SECRET);
    const userId = payload.user.id;
    
    // Get user data from KV
    const userData = await env.ACCESSIBILITY_AUTH.get(`user-auth:${userId}`);
    if (!userData) return null;
    
    const { accessToken, userData: user, siteId } = JSON.parse(userData);
    
    // Get site name from the site-specific data
    let siteName = 'Unknown Site';
    try {
      const siteData = await env.ACCESSIBILITY_AUTH.get(`Accessibility-Settings:${siteId}`);
      if (siteData) {
        const parsedSiteData = JSON.parse(siteData);
        siteName = parsedSiteData.siteName || 'Unknown Site';
      }
    } catch (error) {
      console.warn('Failed to get site name:', error);
    }
    
    return {
      accessToken,
      userData: user,
      siteId,
      siteName
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Create JWT session token
async function createSessionToken(user, env) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    user: user,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = await signJWT(
    `${encodedHeader}.${encodedPayload}`,
    env.WEBFLOW_CLIENT_SECRET
  );
  
  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    exp: payload.exp
  };
}

// Verify JWT token
async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const [header, payload, signature] = parts;
  
  // Verify signature
  const expectedSignature = await signJWT(`${header}.${payload}`, secret);
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }
  
  // Check expiration
  const decodedPayload = JSON.parse(base64UrlDecode(payload));
  if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return decodedPayload;
}

// Sign JWT
async function signJWT(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

// Base64 URL encoding helpers
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str += '='.repeat((4 - str.length % 4) % 4);
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

// Get accessibility configuration for hosted script
async function handleGetConfig(request, env) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return new Response(JSON.stringify({ 
        error: 'Missing siteId parameter' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Get customization data from KV store
    const kvKey = `Accessibility-Settings:${siteId}`;
    const storedData = await env.ACCESSIBILITY_AUTH.get(kvKey);
    
    if (!storedData) {
      return new Response(JSON.stringify({ 
        error: 'Site configuration not found' 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    const siteData = JSON.parse(storedData);
    
    // Return only the customization data needed by the widget
    const config = {
      customization: siteData.customization || {},
      accessibilityProfiles: siteData.accessibilityProfiles || [],
      siteId: siteId,
      publishedAt: siteData.publishedAt,
      widgetVersion: siteData.widgetVersion || '1.0.0'
    };
    
    return new Response(JSON.stringify(config), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Get config error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get configuration',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

// Domain lookup function
async function handleDomainLookup(request, env) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    
    console.log('Domain lookup request for:', domain);
    
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Missing domain parameter' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Check if there's a domain mapping
    const domainKey = `domain:${domain}`;
    const domainData = await env.ACCESSIBILITY_AUTH.get(domainKey);
    
    if (domainData) {
      const data = JSON.parse(domainData);
      console.log('Found domain mapping:', data);
      return new Response(JSON.stringify({ 
        siteId: data.siteId,
        domain: data.domain,
        isPrimary: data.isPrimary
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    console.log('No domain mapping found for:', domain);
    return new Response(JSON.stringify({ error: 'Domain not found' }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Domain lookup error:', error);
    return new Response(JSON.stringify({ error: 'Lookup failed' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}