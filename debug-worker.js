// Debug version to see exactly what's being sent to Webflow
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // OAuth Callback - handle Webflow redirect
    if (url.pathname === '/api/auth/callback') {
      return handleOAuthCallback(request, env);
    }
    
    // Default response
    return new Response('Debug Worker', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

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
  
  try {
    // Always use your main worker's redirect URI
    const redirectUri = "https://accessibility-widget.web-8fb.workers.dev/api/auth/callback";
    
    // Debug: Log what we're sending
    const requestBody = {
      client_id: env.WEBFLOW_CLIENT_ID,
      client_secret: env.WEBFLOW_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    };
    
    console.log('=== DEBUG INFO ===');
    console.log('Request URL:', request.url);
    console.log('Redirect URI being sent:', redirectUri);
    console.log('Client ID:', env.WEBFLOW_CLIENT_ID);
    console.log('Client Secret (first 10 chars):', env.WEBFLOW_CLIENT_SECRET?.substring(0, 10) + '...');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const tokenResponse = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await tokenResponse.text();
    console.log('Webflow response status:', tokenResponse.status);
    console.log('Webflow response body:', responseText);
    
    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ 
        error: 'Token exchange failed',
        status: tokenResponse.status,
        response: responseText,
        debug: {
          redirectUri,
          clientId: env.WEBFLOW_CLIENT_ID,
          clientSecretLength: env.WEBFLOW_CLIENT_SECRET?.length,
          code: code,
          state: state
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Token exchange successful',
      debug: {
        redirectUri,
        clientId: env.WEBFLOW_CLIENT_ID,
        code: code,
        state: state
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authorization failed', 
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


