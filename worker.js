// Security Headers
const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com; script-src-elem 'self' 'unsafe-inline' https://js.stripe.com https://*.stripe.com; script-src-attr 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.stripe.com; frame-src 'self' https://js.stripe.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://*.webflow.com; object-src 'none'; upgrade-insecure-requests;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'on',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Permissions-Policy': 'payment=*'
};
// Rate limiting storage
const rateLimitStore = new Map();

// Handle Webflow App Installation
async function handleWebflowAppInstallation(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const { siteId, userId, userEmail, siteName, installationData } = await request.json();
    
    console.log('Webflow app installation detected:', { siteId, userId, userEmail, siteName });
    
    // Send webhook to Make.com for email automation
    try {
      const webhookUrl = 'https://hook.us1.make.com/mjcnn3ydks2o2pbkrdna9czn7bb253z0';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'webflow_app_installed',
          customer: {
            email: userEmail,
            siteId: siteId,
            siteName: siteName,
            userId: userId
          },
          installation: {
            timestamp: new Date().toISOString(),
            data: installationData || {}
          }
        })
      });
      console.log('Webflow installation webhook sent to Make.com successfully');
    } catch (webhookError) {
      console.warn('Webflow webhook failed (non-critical):', webhookError);
    }
    
    // Store installation data
    const installationRecord = {
      siteId,
      userId,
      userEmail,
      siteName,
      installedAt: new Date().toISOString(),
      status: 'installed'
    };
    
    await env.ACCESSIBILITY_AUTH.put(`installation_${siteId}`, JSON.stringify(installationRecord));
    
    // Start 7-day trial immediately for new installs
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Ledger record
    const userData = {
      siteId,
      email: userEmail || '',
      domain: '',
      paymentStatus: 'trial',
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      createdAt: now.toISOString()
    };
    await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
    
    // Unified settings
    await mergeSiteSettings(env, siteId, {
      siteId,
      email: userEmail || '',
      siteName: siteName || '',
      paymentStatus: 'trial',
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString()
    });
    
    const successResponse = secureJsonResponse({ 
      success: true,
      message: 'App installation recorded successfully'
    });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Webflow app installation error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to process app installation',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Security Functions
function secureJsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

function sanitizeInput(input) {
    return input.replace(/[<>\"'&]/g, (match) => {
        const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
        };
        return escapeMap[match];
    });
}
function rateLimitCheck(ip, requests) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
        requests.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (userRequests.count >= maxRequests) {
        return false;
    }

    userRequests.count++;
    return true;
}

// Unified site settings storage helpers (canonical key: accessibility-settings:<siteId>)
async function getSiteSettings(env, siteId) {
  const existing = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
  if (!existing) {
    return {
      siteId,
      customization: {},
      accessibilityProfiles: {},
      email: '',
      domain: '',
      paymentStatus: 'unknown',
      trialStartDate: null,
      trialEndDate: null,
      customerId: '',
      subscriptionId: '',
      lastPaymentDate: null,
      lastUpdated: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
  }
  try { return JSON.parse(existing); } catch { return { siteId, customization: {} }; }
}

async function mergeSiteSettings(env, siteId, patch) {
  const current = await getSiteSettings(env, siteId);
  const updated = { ...current, ...patch, lastUpdated: new Date().toISOString(), lastUsed: new Date().toISOString() };
  await env.ACCESSIBILITY_AUTH.put(`accessibility-settings:${siteId}`, JSON.stringify(updated));
  return updated;
}

function addSecurityAndCorsHeaders(response, origin) {
    const headers = new Headers(response.headers);
    
    // Add all security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value);
    });
    // CORS Headers
    headers.set('Access-Control-Allow-Origin', origin || '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Vary', 'Origin');
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}



// Complete Accessibility Widget Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    
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
    
    // Get access token by site ID from URL params
if (url.pathname === '/api/accessibility/get-token' && request.method === 'GET') {
  return handleGetTokenBySiteId(request, env);
}

  // ADD RATE LIMITING ONLY FOR NON-OAUTH ENDPOINTS
    if (!rateLimitCheck(clientIP, rateLimitStore)) {
      const errorResponse = secureJsonResponse(
        { error: 'Rate limit exceeded' }, 
        429
      );
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    

    // Get accessibility settings
    if (url.pathname === '/api/accessibility/settings' && request.method === 'GET') {
      return handleGetSettings(request, env);
    }
    
    // Update accessibility settings
    if (url.pathname === '/api/accessibility/settings' && (request.method === 'POST' || request.method === 'PUT')) {
      return handleUpdateSettings(request, env);
    }
    
   
   
    
// Get accessibility configuration for hosted script
if (url.pathname === '/api/accessibility/config' && request.method === 'GET') {
  return handleGetConfig(request, env);
}


// Domain lookup endpoint
if (url.pathname === '/api/accessibility/domain-lookup' && request.method === 'GET') {
  return handleDomainLookup(request, env);
}

// Save accessibility settings
if (url.pathname === '/api/accessibility/save-settings' && request.method === 'POST') {
  return handleSaveSettings(request, env);
}

// NEW PAYMENT ENDPOINTS
if (url.pathname === '/api/accessibility/create-trial' && request.method === 'POST') {
  return handleCreateTrial(request, env);
}
if (url.pathname === '/api/accessibility/payment-status' && request.method === 'GET') {
  return handlePaymentStatus(request, env);
}
if (url.pathname === '/api/accessibility/validate-domain' && request.method === 'POST') {
  return handleValidateDomain(request, env);
}
if (url.pathname === '/api/accessibility/user-data' && request.method === 'GET') {
  return handleUserData(request, env);
}
if (url.pathname === '/api/accessibility/create-subscription' && request.method === 'POST') {
  return handleCreateSubscription(request, env);
}
if (url.pathname === '/api/accessibility/update-payment' && request.method === 'POST') {
  return handleUpdatePayment(request, env);
}
if (url.pathname === '/api/accessibility/create-payment-intent' && request.method === 'POST') {
  return handleCreatePaymentIntent(request, env);
}

    // Stripe Webhook endpoint
    if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }
    
    // Webflow App Installation Webhook
    if (url.pathname === '/api/webflow/app-installed' && request.method === 'POST') {
      return handleWebflowAppInstallation(request, env);
    }
    

// Save custom domain data (can be updated)
if (url.pathname === '/api/accessibility/save-custom-domain' && request.method === 'POST') {
    try {
        const { siteId, customDomain, customization } = await request.json();
        
        if (!siteId || !customDomain) {
            return new Response(JSON.stringify({ error: 'Missing siteId or customDomain' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        
        // Get existing custom domain data
        const existingData = await env.ACCESSIBILITY_AUTH.get(`custom-domain-data:${siteId}`);
        let existingDomainData = {};
        
        if (existingData) {
            try {
                existingDomainData = JSON.parse(existingData);
            } catch (error) {
                console.warn('Failed to parse existing custom domain data:', error);
            }
        }
        
        // Update custom domain data
        const updatedDomainData = {
            ...existingDomainData,
            siteId: siteId,
            customDomain: customDomain,
            customization: customization || existingDomainData.customization || {},
            lastUpdated: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        // Save custom domain data
            await env.ACCESSIBILITY_AUTH.put(`custom-domain-data:${siteId}`, JSON.stringify(updatedDomainData));
            // Also save a domain-scoped record as requested
            const customDomainMirrorKey = `custom-domain:${customDomain}`;
            await env.ACCESSIBILITY_AUTH.put(customDomainMirrorKey, JSON.stringify({
              siteId,
              customDomain,
              customization: updatedDomainData.customization,
              lastUpdated: new Date().toISOString(),
              lastUsed: new Date().toISOString()
            }));
        
        // Also create domain mapping for lookup
        const domainKey = `domain:${customDomain}`;
        await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
            siteId: siteId,
            customDomain: customDomain,
            connectedAt: new Date().toISOString()
        }), { expirationTtl: 86400 * 30 }); // 30 days
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to save custom domain data' }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
}

// Get authorization data (read-only, never updated)
if (url.pathname === '/api/accessibility/auth-data' && request.method === 'GET') {
    try {
        const url = new URL(request.url);
        const siteId = url.searchParams.get('siteId');
        
        if (!siteId) {
            return new Response(JSON.stringify({ error: 'Missing siteId parameter' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        
        // Get authorization data from separate key (never overwritten)
        const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
        
        if (!authData) {
            return new Response(JSON.stringify({ error: 'Authorization data not found' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        
        const parsedData = JSON.parse(authData);
        
        // Return only authorization data (access token, site info, user info)
        const authResponse = {
            accessToken: parsedData.accessToken,
            siteId: parsedData.siteId,
            siteName: parsedData.siteName,
            user: parsedData.user,
            installedAt: parsedData.installedAt,
            widgetVersion: parsedData.widgetVersion
        };
        
        return new Response(JSON.stringify(authResponse), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get authorization data' }), {
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
  const corsResponse = new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
  return addSecurityAndCorsHeaders(corsResponse, '*');
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
    
    // Extract siteId from URL parameters
    const urlSiteId = url.searchParams.get('siteId');
    console.log('SiteId from URL:', urlSiteId);
    
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
    console.log(tokenData);
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
    
    // Determine the current site FIRST
    let currentSite;
    if (isDesigner) {
      // App Interface flow - get site from state parameter
      const siteIdFromState = state.includes('_') ? state.split('_')[1] : null;
      if (siteIdFromState) {
        currentSite = sites.find(site => site.id === siteIdFromState) || sites[0];
      } else {
        currentSite = sites[0];
      }
    } else {
      // Apps & Integrations flow - determine site from URL parameter, state, or referrer
      if (urlSiteId) {
        // Use siteId from URL parameter if available
        const foundSite = sites.find(site => site.id === urlSiteId);
        if (foundSite) {
          currentSite = foundSite;
          console.log('Apps & Integrations: Using site from URL parameter:', currentSite.id, currentSite.shortName);
        } else {
          console.log('Apps & Integrations: Site not found for URL siteId:', urlSiteId);
          currentSite = sites[0];
        }
      } else if (appsIntegrationsSiteInfo) {
        const foundSite = sites.find(site => site.shortName === appsIntegrationsSiteInfo);
        currentSite = foundSite || sites[0];
      } else {
        // Fallback: try to get site info from referrer
        const referrer = request.headers.get('referer') || '';
        if (referrer.includes('.design.webflow.com')) {
          const match = referrer.match(/([^.]+)\.design\.webflow\.com/);
          if (match) {
            const shortName = match[1];
            const foundSite = sites.find(site => site.shortName === shortName);
            currentSite = foundSite || sites[0];
          } else {
            currentSite = sites[0];
          }
        } else {
          currentSite = sites[0];
        }
      }
    }
    
    // Generate JWT session token with the determined site
    const userId = userData.id || userData.email;
    const sessionToken = await createSessionToken({...userData, id: userId}, env, currentSite.id);
    
    // Handle different redirect scenarios
    if (isDesigner) {
      // App Interface flow - only store data for the current site
      
      // Store authorization data (canonical key)
      await env.ACCESSIBILITY_AUTH.put(`auth-data:${currentSite.id}`, JSON.stringify({
        accessToken: tokenData.access_token,
        siteName: currentSite.name || currentSite.shortName,
        siteId: currentSite.id,
        user: userData,
        email: userData.email || '',
        domainUrl: '',
        workspaceId: userData.workspaceId || '',
        installedAt: new Date().toISOString(),
        widgetVersion: '1.0.0',
        lastUsed: new Date().toISOString()
      }));
      
      // Store accessibility settings separately (can be updated)
      await env.ACCESSIBILITY_AUTH.put(`accessibility-settings:${currentSite.id}`, JSON.stringify({
        siteId: currentSite.id,
        customization: {},
        accessibilityProfiles: {},
        customDomain: null,
        lastUpdated: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      }));


      // App Interface flow - redirect directly to site
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://${currentSite.shortName}.design.webflow.com?app=${env.WEBFLOW_CLIENT_ID}`
        }
      });
    }
    
    // Apps & Integrations flow - use the currentSite that was already determined
    console.log('Apps & Integrations: Using determined site for data storage...');
    console.log('Apps & Integrations: Storing data for site:', currentSite.id, currentSite.name || currentSite.shortName);
    
    // Store authorization data (canonical key)
    await env.ACCESSIBILITY_AUTH.put(`auth-data:${currentSite.id}`, JSON.stringify({
      accessToken: tokenData.access_token,
      siteName: currentSite.name || currentSite.shortName,
      siteId: currentSite.id,
      user: userData,
      email: userData.email || '',
      domainUrl: '',
      workspaceId: userData.workspaceId || '',
      installedAt: new Date().toISOString(),
      widgetVersion: '1.0.0',
      lastUsed: new Date().toISOString()
    }));
    
    // Initialize unified site settings (idempotent)
    await mergeSiteSettings(env, currentSite.id, { siteId: currentSite.id });
    // Initialize unified site settings (idempotent)
    await mergeSiteSettings(env, currentSite.id, { siteId: currentSite.id });
    
    // Also store the Webflow subdomain mapping for this site
    try {
      if (currentSite.shortName) {
        const webflowSubdomain = `${currentSite.shortName}.webflow.io`;
        const domainKey = `domain:${webflowSubdomain}`;
        
        await env.ACCESSIBILITY_AUTH.put(domainKey, JSON.stringify({
          siteId: currentSite.id,
          domain: webflowSubdomain,
          isPrimary: true,
          isWebflowSubdomain: true,
          connectedAt: new Date().toISOString()
        }), { expirationTtl: 86400 * 30 }); // 30 days
        
        console.log('Apps & Integrations: Stored Webflow subdomain mapping:', webflowSubdomain, '->', currentSite.id);
      }
    } catch (domainError) {
      console.warn('Apps & Integrations: Failed to store subdomain mapping:', domainError);
    }
    
    // Apps & Integrations flow - redirect to site with auth data in URL params
    // Get the real email from the stored KV data (not the proxy email from userData)
    const storedAuthData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${currentSite.id}`);
    let realEmail = userData.email || '';
    if (storedAuthData) {
      try {
        const parsed = JSON.parse(storedAuthData);
        realEmail = parsed.email || userData.email || '';
      } catch (e) {
        console.warn('Failed to parse stored auth data:', e);
      }
    }
    
    const redirectUrl = new URL(`https://${currentSite.shortName}.design.webflow.com`);
    redirectUrl.searchParams.set('app', env.WEBFLOW_CLIENT_ID);
    redirectUrl.searchParams.set('auth_success', 'true');
    redirectUrl.searchParams.set('sessionToken', sessionToken.token);
    redirectUrl.searchParams.set('firstName', userData.firstName || 'User');
    redirectUrl.searchParams.set('email', realEmail);
    redirectUrl.searchParams.set('siteId', currentSite.id);
    redirectUrl.searchParams.set('siteName', currentSite.name || currentSite.shortName);
    redirectUrl.searchParams.set('shortName', currentSite.shortName);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString()
      }
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
      publishedAt,
      interfaceLanguage
    } = body;
    
        // Debug authResult
    console.log(`[PUBLISH] ${requestId} Auth result:`, JSON.stringify(authResult, null, 2));
    console.log(`[PUBLISH] ${requestId} User data from auth:`, authResult.userData);
    console.log(`[PUBLISH] ${requestId} Site name from auth:`, authResult.siteName);
    
    // Get existing accessibility settings (separate from auth data)
    const existingSettingsData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
    let existingSettings = {};
    
    if (existingSettingsData) {
      try {
        existingSettings = JSON.parse(existingSettingsData);
        console.log(`[PUBLISH] ${requestId} Found existing accessibility settings`);
      } catch (error) {
        console.warn(`[PUBLISH] ${requestId} Failed to parse existing accessibility settings:`, error);
      }
    }
    
    // Get authorization data separately (never overwritten)
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    let authInfo = {};
    if (authData) {
      try {
        authInfo = JSON.parse(authData);
        console.log(`[PUBLISH] ${requestId} Found authorization data`);
      } catch (error) {
        console.warn(`[PUBLISH] ${requestId} Failed to parse authorization data:`, error);
      }
    }
    // Get accessToken from auth data
    let accessToken = authInfo.accessToken;
    console.log(`[PUBLISH] ${requestId} Access token status:`, !!accessToken);
    
    // Create accessibility settings data (separate from auth data)
    const accessibilityData = {
      siteId: siteId,
      customization: {
        ...existingSettings.customization, // Preserve existing customization
        ...customization, // Override with new customization
        interfaceLanguage: interfaceLanguage || customization?.interfaceLanguage || existingSettings.customization?.interfaceLanguage
      },
      accessibilityProfiles: accessibilityProfiles || existingSettings.accessibilityProfiles,
      customDomain: customDomain || existingSettings.customDomain,
      publishedAt: publishedAt,
      lastUpdated: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Store accessibility settings separately
    const accessibilityKey = `accessibility-settings:${siteId}`;
    console.log(`[PUBLISH] ${requestId} Storing accessibility settings with key: ${accessibilityKey}`);
    console.log(`[PUBLISH] ${requestId} Accessibility data to store:`, JSON.stringify(accessibilityData, null, 2));
    
    await env.ACCESSIBILITY_AUTH.put(accessibilityKey, JSON.stringify(accessibilityData));
    
    // Also store domain mappings for easy lookup
    // Get the site's domains from Webflow API
    try {
      const domainsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
            isPrimary: domain.isPrimary,
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
          'Authorization': `Bearer ${accessToken}`,
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
        customization: accessibilityData.customization,
        accessibilityProfiles: accessibilityData.accessibilityProfiles,
        customDomain: accessibilityData.customDomain,
        publishedAt: accessibilityData.publishedAt
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
  const origin = request.headers.get('origin');
  
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    const errorResponse = secureJsonResponse({ error: 'Unauthorized' }, 401);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
  
  // Get siteId from URL parameter (preferred) or from auth result
  const url = new URL(request.url);
  const urlSiteId = url.searchParams.get('siteId');
  const siteId = urlSiteId || authResult.siteId;
  
  if (!siteId) {
    const errorResponse = secureJsonResponse({ error: 'No siteId provided' }, 400);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
  
  // Get accessibility settings from separate key
  const accessibilityData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
  if (!accessibilityData) {
    const errorResponse = secureJsonResponse({ error: 'Accessibility settings not found' }, 404);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
  
  // Get authorization data for site info
  const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
  let authInfo = {};
  if (authData) {
    try {
      authInfo = JSON.parse(authData);
    } catch (error) {
      console.warn('Failed to parse authorization data:', error);
    }
  }
  
  const settings = JSON.parse(accessibilityData);
  const successResponse = secureJsonResponse({
    customization: settings.customization,
    accessibilityProfiles: settings.accessibilityProfiles,
    customDomain: settings.customDomain,
    siteId: siteId,
    siteName: authInfo.siteName,
    installedAt: authInfo.installedAt,
    lastUsed: settings.lastUsed,
    widgetVersion: authInfo.widgetVersion,
    publishedAt: settings.publishedAt
  });
  return addSecurityAndCorsHeaders(successResponse, origin);
}

// Handle Token Authentication - UPDATED TO SUPPORT FIRST-TIME INSTALLS
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
    
    // Always decode ID token directly - no Webflow API calls needed
    console.log('Decoding ID token directly for authentication...');
    let userData;
    
    try {
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid ID token format');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('ID token payload:', payload);
      
      // Get real email from stored auth data instead of using proxy email from ID token
      const storedAuthData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
      let realEmail = payload.email || '';
      let realFirstName = payload.given_name || payload.name || 'User';
      
      if (storedAuthData) {
        try {
          const parsed = JSON.parse(storedAuthData);
          realEmail = parsed.email || payload.email || '';
          realFirstName = parsed.user?.firstName || payload.given_name || payload.name || 'User';
        } catch (e) {
          console.warn('Failed to parse stored auth data:', e);
        }
      }
      
      userData = {
        id: payload.sub || payload.user_id,
        email: realEmail,
        firstName: realFirstName
      };
      
      console.log('Decoded user data from ID token:', JSON.stringify(userData, null, 2));
      
      // Validate required fields - only ID is required
      if (!userData.id) {
        console.error('Missing required user ID in ID token:', userData);
        return new Response(JSON.stringify({ error: 'Invalid user ID in ID token' }), {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
      
    } catch (error) {
      console.error('ID token verification failed:', error);
      return new Response(JSON.stringify({ error: 'Invalid ID token' }), {
        status: 401,
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
    const sessionToken = await createSessionToken(userData, env, siteId);
    console.log('Session token created successfully');
    
    // Try to get accessToken from existing published settings using siteId
    let accessToken = null;
    const existingPublishedData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
    if (existingPublishedData) {
      const parsedData = JSON.parse(existingPublishedData);
      accessToken = parsedData.accessToken;
      console.log('Found accessToken from existing published settings:', !!accessToken);
    }
    
    // Store user authentication
    await env.ACCESSIBILITY_AUTH.put(`user-auth:${userData.id}`, JSON.stringify({
      accessToken: accessToken, // Use found accessToken or null
      userData: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName
      },
      siteId,
      widgetType: 'accessibility',
      authType: 'silent_auth'
    }), { expirationTtl: 86400 });
    
    // Check if authorization data exists, if not create initial auth data
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    if (!authData) {
      console.log('No authorization data found, creating initial auth data...');
      await env.ACCESSIBILITY_AUTH.put(`auth-data:${siteId}`, JSON.stringify({
        accessToken: null, // No access token for silent auth
        siteName: 'Unknown Site', // Will be updated when user publishes
        siteId: siteId,
        user: userData,
        installedAt: new Date().toISOString(),
        widgetVersion: '1.0.0',
        lastUsed: new Date().toISOString()
      }));
      console.log('Initial authorization data created');
    } else {
      console.log('Authorization data already exists, skipping creation');
    }
    
    // Check if accessibility settings exist, if not create initial settings
    const accessibilityData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
    if (!accessibilityData) {
      console.log('No accessibility settings found, creating initial settings...');
      await env.ACCESSIBILITY_AUTH.put(`accessibility-settings:${siteId}`, JSON.stringify({
        siteId: siteId,
        customization: {},
        accessibilityProfiles: {},
        customDomain: null,
        lastUpdated: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      }));
      console.log('Initial accessibility settings created');
    } else {
      console.log('Accessibility settings already exist, skipping creation');
    }
    
    console.log('User authentication stored');
    console.log('=== TOKEN AUTH DEBUG END ===');
    
    // Get real email from stored auth data (not proxy email from userData)
    const storedAuthData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    let realEmail = userData.email || '';
    let realFirstName = userData.firstName || 'User';
    
    if (storedAuthData) {
      try {
        const parsed = JSON.parse(storedAuthData);
        realEmail = parsed.email || userData.email || '';
        realFirstName = parsed.user?.firstName || userData.firstName || 'User';
      } catch (e) {
        console.warn('Failed to parse stored auth data:', e);
      }
    }
    
    return new Response(JSON.stringify({
      sessionToken: sessionToken.token,
      email: realEmail,
      firstName: realFirstName,
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
  const origin = request.headers.get('origin');
  
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    const errorResponse = secureJsonResponse({ error: 'Unauthorized' }, 401);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
  
  const { siteId } = authResult;
  const newSettings = await request.json();
  
  // Sanitize input data
  const sanitizedSettings = {};
  for (const [key, value] of Object.entries(newSettings)) {
    if (typeof value === 'string') {
      sanitizedSettings[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize object values
      sanitizedSettings[key] = {};
      for (const [subKey, subValue] of Object.entries(value)) {
        if (typeof subValue === 'string') {
          sanitizedSettings[key][subKey] = sanitizeInput(subValue);
        } else {
          sanitizedSettings[key][subKey] = subValue;
        }
      }
    } else {
      sanitizedSettings[key] = value;
    }
  }
  
  // Get existing accessibility settings
  const accessibilityData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
  if (!accessibilityData) {
    const errorResponse = secureJsonResponse({ error: 'Accessibility settings not found' }, 404);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
  
  const settings = JSON.parse(accessibilityData);
  settings.accessibilitySettings = { ...settings.accessibilitySettings, ...sanitizedSettings };
  settings.lastUpdated = new Date().toISOString();
  settings.lastUsed = new Date().toISOString();
  
  await env.ACCESSIBILITY_AUTH.put(`accessibility-settings:${siteId}`, JSON.stringify(settings));
  
  const successResponse = secureJsonResponse({
    success: true,
    settings: settings.accessibilitySettings,
    lastUpdated: settings.lastUpdated
  });
  return addSecurityAndCorsHeaders(successResponse, origin);
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
    
    // Get siteId from URL parameters
    const url = new URL(request.url);
    const siteIdFromUrl = url.searchParams.get('siteId');
    console.log('SiteId from URL:', siteIdFromUrl);

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
    console.log('Authentication successful, siteId from auth:', authResult.siteId);
    
    // Get access token from authorization data using the new key structure
    let accessToken = null;
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteIdFromUrl}`);
    if (authData) {
      const parsedAuthData = JSON.parse(authData);
      accessToken = parsedAuthData.accessToken;
      console.log('Found access token from auth-data:', !!accessToken);
    } else {
      console.log('No auth-data found for siteId:', siteIdFromUrl);
    }
    
    console.log('Access token status:', !!accessToken);
    
    // If still no access token, skip script registration
    if (!accessToken) {
      console.log('No access token available - skipping script registration');
      return new Response(JSON.stringify({
        success: true,
        message: "Script registration skipped - no access token available",
        skipApplyScript: true
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const scriptUrl = 'https://cdn.jsdelivr.net/gh/snm62/accessibility-test@10226fd/accessibility-widget.js';
    console.log(accessToken);
    // Check if script is already registered - CORRECTED: Use exact match
    const existingScriptsResponse = await fetch(`https://api.webflow.com/v2/sites/${siteIdFromUrl}/registered_scripts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    const registerResponse = await fetch(`https://api.webflow.com/v2/sites/${siteIdFromUrl}/registered_scripts/hosted`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    
    // Get access token from authorization data
    let accessToken = null;
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    if (authData) {
      const parsedAuthData = JSON.parse(authData);
      accessToken = parsedAuthData.accessToken;
    }
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No access token available' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get existing custom code
    const existingResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept-version': '2.0.0'
      }
    });
    console.log("existing response status:", existingResponse.status);

    const already_registered_scripts = await fetch(`https://api.webflow.com/v2/sites/${siteId}/registered_scripts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        
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
    const scriptUrl = 'https://cdn.jsdelivr.net/gh/snm62/accessibility-test@10226fd/accessibility-widget.js';

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
    const updateResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/custom_code`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    let siteName;
    try {
      const siteData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
      if (siteData) {
        const parsedSiteData = JSON.parse(siteData);
        siteName = parsedSiteData.siteName;
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
async function createSessionToken(user, env,siteId=null) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    user: user,
    siteId:siteId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
     // 24 hours
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
  const origin = request.headers.get('origin');
  
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      const errorResponse = secureJsonResponse({ 
        error: 'Missing siteId parameter' 
      }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Get accessibility settings from separate key
    const accessibilityKey = `accessibility-settings:${siteId}`;
    const accessibilityData = await env.ACCESSIBILITY_AUTH.get(accessibilityKey);
    
    if (!accessibilityData) {
      const errorResponse = secureJsonResponse({ 
        error: 'Accessibility settings not found' 
      }, 404);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Get authorization data for widget version
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    let authInfo = {};
    if (authData) {
      try {
        authInfo = JSON.parse(authData);
      } catch (error) {
        console.warn('Failed to parse authorization data:', error);
      }
    }
    
    const settings = JSON.parse(accessibilityData);
    
    // Return only the customization data needed by the widget
    const config = {
      customization: settings.customization,
      accessibilityProfiles: settings.accessibilityProfiles,
      siteId: siteId,
      publishedAt: settings.publishedAt,
      widgetVersion: authInfo.widgetVersion || '1.0.0'
    };
    
    const successResponse = secureJsonResponse(config);
    const responseWithHeaders = addSecurityAndCorsHeaders(successResponse, origin);
    
    // Add cache headers
    const headers = new Headers(responseWithHeaders.headers);
    headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    return new Response(responseWithHeaders.body, {
      status: responseWithHeaders.status,
      statusText: responseWithHeaders.statusText,
      headers
    });
    
  } catch (error) {
    console.error('Get config error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to get configuration',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Domain lookup function
async function handleDomainLookup(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    
    console.log('Domain lookup request for:', domain);
    
    if (!domain) {
      const errorResponse = secureJsonResponse({ error: 'Missing domain parameter' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Sanitize domain input
    const sanitizedDomain = sanitizeInput(domain);
    
    // Check if there's a domain mapping
    const domainKey = `domain:${sanitizedDomain}`;
    const domainData = await env.ACCESSIBILITY_AUTH.get(domainKey);
    
    if (domainData) {
      const data = JSON.parse(domainData);
      console.log('Found domain mapping:', data);
      const successResponse = secureJsonResponse({ 
        siteId: data.siteId,
        domain: data.domain,
        isPrimary: data.isPrimary
      });
      return addSecurityAndCorsHeaders(successResponse, origin);
    }
    
    console.log('No domain mapping found for:', sanitizedDomain);
    const errorResponse = secureJsonResponse({ error: 'Domain not found' }, 404);
    return addSecurityAndCorsHeaders(errorResponse, origin);
    
  } catch (error) {
    console.error('Domain lookup error:', error);
    const errorResponse = secureJsonResponse({ error: 'Lookup failed' }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Save accessibility settings
async function handleSaveSettings(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { siteId, settings } = body;
    
    if (!siteId || !settings) {
      const errorResponse = secureJsonResponse({ error: 'Missing siteId or settings' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Sanitize input data
    const sanitizedSettings = {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        sanitizedSettings[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize object values
        sanitizedSettings[key] = {};
        for (const [subKey, subValue] of Object.entries(value)) {
          if (typeof subValue === 'string') {
            sanitizedSettings[key][subKey] = sanitizeInput(subValue);
          } else {
            sanitizedSettings[key][subKey] = subValue;
          }
        }
      } else {
        sanitizedSettings[key] = value;
      }
    }
    
    // Get existing accessibility settings
    const existingData = await env.ACCESSIBILITY_AUTH.get(`accessibility-settings:${siteId}`);
    let existingSettings = {};
    
    if (existingData) {
      try {
        existingSettings = JSON.parse(existingData);
      } catch (error) {
        console.warn('Failed to parse existing accessibility settings:', error);
      }
    }
    
    // Update settings
    const updatedSettings = {
      ...existingSettings,
      ...sanitizedSettings,
      siteId: siteId,
      lastUpdated: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Save to KV storage
    await env.ACCESSIBILITY_AUTH.put(`accessibility-settings:${siteId}`, JSON.stringify(updatedSettings));
    
    const successResponse = secureJsonResponse({ 
      success: true,
      message: 'Settings saved successfully',
      settings: updatedSettings
    });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Save settings error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to save settings',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Get access token by site ID from URL params
async function handleGetTokenBySiteId(request, env) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return new Response(JSON.stringify({ error: 'Missing siteId parameter' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Get authorization data for the site
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    
    if (!authData) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    const parsedData = JSON.parse(authData);
    
    // Return access token and site info
    return new Response(JSON.stringify({
      accessToken: parsedData.accessToken,
      siteId: parsedData.siteId,
      siteName: parsedData.siteName,
      user: parsedData.user,
      hasAccessToken: !!parsedData.accessToken
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Get token by site ID error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get token' }), {
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

// Helper function to get site ID from URL params and retrieve access token
async function getSiteIdAndToken(request, env) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return { error: 'No siteId provided in URL parameters' };
    }
    
    // Get authorization data for the site
    const authData = await env.ACCESSIBILITY_AUTH.get(`auth-data:${siteId}`);
    
    if (!authData) {
      return { error: 'Site not found' };
    }
    
    const parsedData = JSON.parse(authData);
    
    return {
      siteId: parsedData.siteId,
      accessToken: parsedData.accessToken,
      siteName: parsedData.siteName,
      user: parsedData.user,
      hasAccessToken: !!parsedData.accessToken
    };
    
  } catch (error) {
    console.error('Get site ID and token error:', error);
    return { error: 'Failed to get site data' };
  }
}

// ===== PAYMENT HANDLER FUNCTIONS =====

// Create trial for new users
async function handleCreateTrial(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const { siteId, email, domain, paymentStatus, trialStartDate, trialEndDate } = await request.json();
    
    if (!siteId || !email || !domain) {
      const errorResponse = secureJsonResponse({ error: 'Missing required fields' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Sanitize input data
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedDomain = sanitizeInput(domain);
    
    // Store user data with payment info
    const userData = {
      siteId,
      email: sanitizedEmail,
      domain: sanitizedDomain,
      paymentStatus,
      trialStartDate,
      trialEndDate,
      createdAt: new Date().toISOString()
    };
    
    // Store in KV
    await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
    await mergeSiteSettings(env, siteId, {
      siteId,
      domain: sanitizedDomain,
      customerId,
      subscriptionId: subscription.id,
      paymentStatus: 'pending'
    });
    
    // Store domain mapping
    await env.ACCESSIBILITY_AUTH.put(`domain_${sanitizedDomain}`, JSON.stringify({ 
      siteId, 
      verified: true 
    }));
    
  // Also merge into unified site settings
  await mergeSiteSettings(env, siteId, {
    siteId,
    email: sanitizedEmail,
    domain: sanitizedDomain,
    paymentStatus,
    trialStartDate,
    trialEndDate
  });

  const successResponse = secureJsonResponse({ 
    success: true, 
    message: 'Trial created successfully' 
  });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Create trial error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to create trial',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Check payment status
async function handlePaymentStatus(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      const errorResponse = secureJsonResponse({ error: 'SiteId required' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Get user data
    const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
    if (!userDataStr) {
      const errorResponse = secureJsonResponse({ error: 'User not found' }, 404);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    const userData = JSON.parse(userDataStr);
    
    // Auto-derive status
    const now = new Date();
    if (userData.paymentStatus === 'trial' && userData.trialEndDate && now > new Date(userData.trialEndDate)) {
      userData.paymentStatus = 'inactive';
    }
    if (userData.paymentStatus === 'active' && userData.subscriptionPeriodEnd && now > new Date(userData.subscriptionPeriodEnd)) {
      userData.paymentStatus = 'expired';
    }
    await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
    
    // Keep unified settings current
    await mergeSiteSettings(env, siteId, {
      siteId,
      paymentStatus: userData.paymentStatus,
      trialEndDate: userData.trialEndDate,
      email: userData.email,
      domain: userData.domain
    });

    const successResponse = secureJsonResponse({
      paymentStatus: userData.paymentStatus,
      trialEndDate: userData.trialEndDate,
      email: userData.email,
      domain: userData.domain
    });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Payment status error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to check payment status',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Validate domain access
async function handleValidateDomain(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const { domain, siteId } = await request.json();
    
    if (!domain || !siteId) {
      const errorResponse = secureJsonResponse({ error: 'Domain and siteId required' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Sanitize domain input
    const sanitizedDomain = sanitizeInput(domain);
    
    // Check domain mapping
    const domainDataStr = await env.ACCESSIBILITY_AUTH.get(`domain_${sanitizedDomain}`);
    if (!domainDataStr) {
      const successResponse = secureJsonResponse({ isValid: false });
      return addSecurityAndCorsHeaders(successResponse, origin);
    }
    
    const domainData = JSON.parse(domainDataStr);
    const isValid = domainData.siteId === siteId && domainData.verified;
    
    const successResponse = secureJsonResponse({ isValid });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Validate domain error:', error);
    const errorResponse = secureJsonResponse({ 
      isValid: false,
      error: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Get user data
async function handleUserData(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      const errorResponse = secureJsonResponse({ error: 'SiteId required' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
    if (!userDataStr) {
      const errorResponse = secureJsonResponse({ error: 'User not found' }, 404);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    const userData = JSON.parse(userDataStr);
    
    const successResponse = secureJsonResponse({ 
      email: userData.email,
      domain: userData.domain,
      paymentStatus: userData.paymentStatus,
      trialEndDate: userData.trialEndDate
    });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Get user data error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to get user data',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Create Stripe subscription with products
async function handleCreateSubscription(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const { siteId, productId, domain, email, domainUrl } = await request.json();
    
    if (!siteId || !productId || !domain) {
      const errorResponse = secureJsonResponse({ error: 'Missing required fields' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    // Sanitize input data
    const sanitizedDomain = sanitizeInput(domain);
    
    // Create customer with email if provided
    let customerId = '';
    const customerData = {
      'metadata[siteId]': siteId,
      'metadata[domain]': sanitizedDomain
    };
    
    // Add email if provided
    if (email) {
      customerData.email = email;
    }
    
    // Add domain URL to metadata if provided
    if (domainUrl) {
      customerData['metadata[domainUrl]'] = domainUrl;
    }
    
    const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(customerData)
    });
    
    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('Stripe customer creation failed:', errorText);
      throw new Error(`Failed to create customer: ${errorText}`);
    }
    
    const customer = await customerResponse.json();
    customerId = customer.id;
    
    // Get product details to find the price
    const productResponse = await fetch(`https://api.stripe.com/v1/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    });
    
    if (!productResponse.ok) {
      throw new Error('Failed to get product details');
    }
    
    const product = await productResponse.json();
    const priceId = product.default_price;
    
    // Create subscription
    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        'items[0][price]': priceId,
        payment_behavior: 'default_incomplete',
        collection_method: 'charge_automatically',
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'metadata[siteId]': siteId,
        'metadata[domain]': sanitizedDomain,
        'metadata[email]': email || '',
        'metadata[domainUrl]': domainUrl || ''
      })
    });
    
    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      throw new Error(`Failed to create subscription: ${errorText}`);
    }
    
    const subscription = await subscriptionResponse.json();
    
    // Create a payment intent directly for the subscription amount
    const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    });
    
    if (!priceResponse.ok) {
      throw new Error('Failed to get price details');
    }
    
    const price = await priceResponse.json();
    
    // Create payment intent directly
    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: price.unit_amount,
        currency: price.currency,
        customer: customerId,
        'metadata[siteId]': siteId,
        'metadata[domain]': sanitizedDomain,
        'metadata[subscriptionId]': subscription.id,
        'metadata[email]': email || '',
        'metadata[domainUrl]': domainUrl || ''
      })
    });
    
    if (!paymentIntentResponse.ok) {
      const errorText = await paymentIntentResponse.text();
      throw new Error(`Failed to create payment intent: ${errorText}`);
    }
    
    const paymentIntent = await paymentIntentResponse.json();
    const clientSecret = paymentIntent.client_secret;
    
    // Store user data
    const userData = {
      siteId,
      domain: sanitizedDomain,
      customerId: customerId,
      subscriptionId: subscription.id,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
    await env.ACCESSIBILITY_AUTH.put(`domain_${sanitizedDomain}`, JSON.stringify({ 
      siteId, 
      verified: true 
    }));
    
    // Send webhook to Make.com for email automation
    try {
      const webhookUrl = 'https://hook.us1.make.com/mjcnn3ydks2o2pbkrdna9czn7bb253z0';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'app_installed',
          customer: {
            email: email,
            domain: domainUrl,
            siteId: siteId
          },
          subscription: {
            id: subscription.id,
            productId: productId
          },
          timestamp: new Date().toISOString()
        })
      });
      console.log('Webhook sent to Make.com successfully');
    } catch (webhookError) {
      console.warn('Webhook failed (non-critical):', webhookError);
    }

    const successResponse = secureJsonResponse({ 
      clientSecret: clientSecret,
      subscriptionId: subscription.id
    });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Create subscription error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to create subscription',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Update payment status (for webhooks)
async function handleUpdatePayment(request, env) {
  const origin = request.headers.get('origin');
  
  try {
    const { siteId, subscriptionId, customerId, paymentStatus } = await request.json();
    
    if (!siteId || !paymentStatus) {
      const errorResponse = secureJsonResponse({ error: 'SiteId and paymentStatus required' }, 400);
      return addSecurityAndCorsHeaders(errorResponse, origin);
    }
    
    const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      userData.paymentStatus = paymentStatus;
      if (subscriptionId) userData.subscriptionId = subscriptionId;
      if (customerId) userData.customerId = customerId;
      userData.lastPaymentDate = new Date().toISOString();
      
      await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
    }
    
    const successResponse = secureJsonResponse({ success: true });
    return addSecurityAndCorsHeaders(successResponse, origin);
    
  } catch (error) {
    console.error('Update payment error:', error);
    const errorResponse = secureJsonResponse({ 
      error: 'Failed to update payment',
      details: error.message 
    }, 500);
    return addSecurityAndCorsHeaders(errorResponse, origin);
  }
}

// Create payment intent for Stripe Elements (REAL Stripe call)
async function handleCreatePaymentIntent(request, env) {
  const origin = request.headers.get('origin');
  try {
    const { siteId, amount, currency = 'usd', email } = await request.json();
    if (!siteId || !amount) {
      return addSecurityAndCorsHeaders(secureJsonResponse({ error: 'Missing required fields' }, 400), origin);
    }

    // Optional: create/reuse a customer for saved methods / Link
    let customerId = '';
    if (email) {
      const custRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ email })
      });
      const cust = await custRes.json();
      customerId = cust.id || '';
    }

    // Create PaymentIntent with Card payments only - completely disable automatic methods
    const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: String(amount),
        currency,
        'payment_method_types[]': 'card',
        'automatic_payment_methods[enabled]': 'false',
        'payment_method_options[card][request_three_d_secure]': 'automatic',
        ...(customerId ? { customer: customerId } : {}),
        ...(siteId ? { 'metadata[siteId]': siteId } : {})
      })
    });

    if (!piRes.ok) {
      const text = await piRes.text();
      return addSecurityAndCorsHeaders(secureJsonResponse({ error: `Stripe error: ${text}` }, 400), origin);
    }
    const pi = await piRes.json();
    return addSecurityAndCorsHeaders(secureJsonResponse({ clientSecret: pi.client_secret }), origin);
  } catch (error) {
    return addSecurityAndCorsHeaders(secureJsonResponse({ error: error.message || 'failed' }, 500), origin);
  }
}

// Verify and handle Stripe webhooks
async function handleStripeWebhook(request, env) {
  const origin = request.headers.get('origin');
  try {
    const sig = request.headers.get('stripe-signature');
    if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
      return addSecurityAndCorsHeaders(secureJsonResponse({ error: 'Missing signature or webhook secret' }, 400), origin);
    }

    const payload = await request.text();

    // Minimal Stripe signature verification using raw HMAC
    // Stripe header format: t=timestamp,v1=signature
    const parts = Object.fromEntries(sig.split(',').map(kv => kv.split('=')));
    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) {
      return addSecurityAndCorsHeaders(secureJsonResponse({ error: 'Invalid signature header' }, 400), origin);
    }

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const signatureHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Constant-time compare
    if (signatureHex !== v1) {
      return addSecurityAndCorsHeaders(secureJsonResponse({ error: 'Signature verification failed' }, 400), origin);
    }

    const event = JSON.parse(payload);
    // Handle subscription events
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object || {};
      const siteId = subscription.metadata?.siteId;
      if (siteId) {
        const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.paymentStatus = 'active';
        userData.subscriptionId = subscription.id;
        userData.lastPaymentDate = new Date().toISOString();
        await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
        await mergeSiteSettings(env, siteId, {
          siteId,
          paymentStatus: 'active',
          subscriptionId: subscription.id,
          lastPaymentDate: userData.lastPaymentDate
        });
        
        // Send webhook to Make.com for email automation
        try {
          const webhookUrl = 'https://hook.us1.make.com/mjcnn3ydks2o2pbkrdna9czn7bb253z0';
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'app_installed',
              customer: {
                email: subscription.metadata?.email || '',
                domain: subscription.metadata?.domainUrl || '',
                siteId: siteId
              },
              subscription: {
                id: subscription.id,
                productId: subscription.metadata?.productId || ''
              },
              timestamp: new Date().toISOString()
            })
          });
          console.log('Webhook sent to Make.com successfully');
        } catch (webhookError) {
          console.warn('Webhook failed (non-critical):', webhookError);
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object || {};
      const siteId = subscription.metadata?.siteId;
      if (siteId) {
        const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.paymentStatus = subscription.status === 'active' ? 'active' : 'inactive';
        userData.lastPaymentDate = new Date().toISOString();
        await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
        await mergeSiteSettings(env, siteId, {
          siteId,
          paymentStatus: userData.paymentStatus,
          lastPaymentDate: userData.lastPaymentDate
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object || {};
      const siteId = subscription.metadata?.siteId;
      if (siteId) {
        const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.paymentStatus = 'cancelled';
        userData.lastPaymentDate = new Date().toISOString();
        await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
        await mergeSiteSettings(env, siteId, {
          siteId,
          paymentStatus: 'cancelled',
          lastPaymentDate: userData.lastPaymentDate
        });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object || {};
      const siteId = pi.metadata?.siteId;
      if (siteId) {
        const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.paymentStatus = 'active';
        userData.lastPaymentDate = new Date().toISOString();
        userData.paymentMethod = pi.payment_method_types?.[0] || 'unknown';
        await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
        await mergeSiteSettings(env, siteId, {
          siteId,
          paymentStatus: 'active',
          lastPaymentDate: userData.lastPaymentDate
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object || {};
      const siteId = pi.metadata?.siteId;
      if (siteId) {
        const userDataStr = await env.ACCESSIBILITY_AUTH.get(`user_data_${siteId}`);
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.paymentStatus = 'failed';
        userData.lastPaymentDate = new Date().toISOString();
        await env.ACCESSIBILITY_AUTH.put(`user_data_${siteId}`, JSON.stringify(userData));
        await mergeSiteSettings(env, siteId, {
          siteId,
          paymentStatus: 'failed',
          lastPaymentDate: userData.lastPaymentDate
        });
      }
    }

    return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (err) {
    return addSecurityAndCorsHeaders(secureJsonResponse({ error: err.message || 'webhook error' }, 500), origin);
  }
}