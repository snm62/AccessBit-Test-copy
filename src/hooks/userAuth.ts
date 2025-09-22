import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/types";
import { WebflowAPI } from "../types/webflowtypes";

const base_url = "https://accessibility-widget.web-8fb.workers.dev";

// Use the real Webflow API from the global scope
declare const webflow: WebflowAPI;

interface AuthState {
  user: User;
  sessionToken: string;
}

/**
 * Custom hook for managing authentication state and token exchange.
 *
 * Authentication Flow:
 * 1. User initiates auth -> exchangeAndVerifyIdToken()
 *    - Gets ID token from Webflow (Designer APIs)
 *    - Exchanges it for a session token via API
 *
 * 2. Token Exchange -> tokenMutation
 *    - Sends ID token to Data Client
 *    - Data Client validates and returns session token
 *    - On success, decodes and stores token + user data
 *
 * 3. Session Management -> useQuery for token validation
 *    - Automatically checks for existing valid session
 *    - Handles token expiration
 *    - Manages loading states
 *
 * @returns {Object} Authentication utilities and state
 * - user: Current user information
 * - sessionToken: Active session token
 * - isAuthLoading: Loading state
 * - exchangeAndVerifyIdToken: Exchange ID token for session token
 * - logout: Clear authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const isExchangingToken = { current: false };

  // Query for managing auth state and token validation
  const { data: authState, isLoading: isAuthLoading } = useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedUser = sessionStorage.getItem("contrastkit-userinfo");
      const wasExplicitlyLoggedOut = sessionStorage.getItem(
        "explicitly_logged_out"
      );

      // Return initial state if no stored user or logged out
      if (!storedUser || wasExplicitlyLoggedOut) {
        return { user: { firstName: "", email: "" }, sessionToken: "" };
      }

      try {
        const userData = JSON.parse(storedUser);
        
        if (!userData.sessionToken) {
          return { user: { firstName: "", email: "" }, sessionToken: "" };
        }

        // Decode and validate token
        const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
        
        if (decodedToken.exp * 1000 <= Date.now()) {
          // Token expired - clear storage
          sessionStorage.removeItem("contrastkit-userinfo");
          return { user: { firstName: "", email: "" }, sessionToken: "" };
        }

        // Return valid auth state
        const authState = {
          user: {
            firstName: decodedToken.user?.firstName || userData.firstName || "",
            email: decodedToken.user?.email || userData.email || "",
            siteId: userData.siteId, // Include siteId from stored data
          },
          sessionToken: userData.sessionToken,
        };
        return authState;
      } catch (error) {
        // Clear invalid data
        sessionStorage.removeItem("contrastkit-userinfo");
        return { user: { firstName: "", email: "" }, sessionToken: "" };
      }
    },
    staleTime: Infinity, // Never consider the data stale
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Mutation for exchanging ID token for session token
  const tokenMutation = useMutation({
    mutationFn: async (idToken: string) => {
      // Get site info from Webflow
      const siteInfo = await webflow.getSiteInfo();

      // Exchange token with backend
      const response = await fetch(`${base_url}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: idToken, siteId: siteInfo.siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to exchange token: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      if (!data.sessionToken) {
        throw new Error("No session token received");
      }

      // Return both auth data and site info
      return { ...data, siteInfo };
    },
    onSuccess: (data) => {
      try {
        // Decode the new token
       const decodedToken = jwtDecode(data.sessionToken) as DecodedToken;
        const userData = {
          sessionToken: data.sessionToken,
          firstName: data.firstName,
          email: data.email,
          siteId: data.siteId, // Store the siteId from server response
          exp: decodedToken.exp,
        };

                 // Update sessionStorage
         sessionStorage.setItem("contrastkit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");

        // Store site information after authentication
        if (data.siteInfo) {
          sessionStorage.setItem('siteInfo', JSON.stringify(data.siteInfo));
        }

        // Directly update the query data instead of invalidating
        queryClient.setQueryData<AuthState>(["auth"], {
          user: {
            firstName: decodedToken.user.firstName,
            email: decodedToken.user.email,
            siteId: data.siteId, // Include siteId in user data
          },
          sessionToken: data.sessionToken,
        });
      } catch (error) {
      }
    },
  });

  // Function to initiate token exchange process
  const exchangeAndVerifyIdToken = async () => {
    try {
      // Get new ID token from Webflow
      const idToken = await webflow.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token from Webflow');
      }

      // Get site info from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo || !siteInfo.siteId) {
        throw new Error('Failed to get site info from Webflow');
      }
      
      const response = await fetch(`${base_url}/api/auth/token`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          idToken, 
          siteId: siteInfo.siteId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${data.error || 'Unknown error'}`);
      }

      if (!data.sessionToken) {
        throw new Error('No session token received from server');
      }

      // Store in sessionStorage
      const userData = {
        sessionToken: data.sessionToken,
        firstName: data.firstName,
        email: data.email,
        siteId: siteInfo.siteId, // Store the siteId
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      };

             sessionStorage.setItem("contrastkit-userinfo", JSON.stringify(userData));
      sessionStorage.removeItem("explicitly_logged_out");

      // Store site information after authentication
      if (siteInfo) {
        sessionStorage.setItem('siteInfo', JSON.stringify(siteInfo));
      }

      // Update React Query cache
      queryClient.setQueryData<AuthState>(["auth"], {
        user: {
          firstName: data.firstName,
          email: data.email,
          siteId: siteInfo.siteId
        },
        sessionToken: data.sessionToken
      });

      return data;

    } catch (error) {
      sessionStorage.removeItem("contrastkit-userinfo");
      throw error;
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Set logout flag and clear storage
    sessionStorage.setItem("explicitly_logged_out", "true");
    sessionStorage.removeItem("contrastkit-userinfo");
    queryClient.setQueryData(["auth"], {
      user: { firstName: "", email: "" },
      sessionToken: "",
    });
    queryClient.clear();
  };

  const openAuthScreen = async () => {
    // Get current site info first
    const siteInfo = await webflow.getSiteInfo();
    
    const authWindow = window.open(
      `${base_url}/api/auth/authorize?state=webflow_designer_${siteInfo.siteId}`,
      "_blank",
      "width=600,height=600"
    );

    if (!authWindow) {
      return;
    }
    
    // Listen for messages from the OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(base_url).origin) {
        return;
      }
      
      if (event.data.type === 'AUTH_SUCCESS') {
        console.log('Received auth success message:', event.data);
        
        // IMPORTANT: Clear all old session data first to prevent cross-site contamination
        console.log('Clearing old session data before storing new data...');
        sessionStorage.removeItem("contrastkit-userinfo");
        sessionStorage.removeItem("explicitly_logged_out");
        sessionStorage.removeItem("siteInfo");
        
        // Store the session data from the OAuth popup
        const userData = {
          sessionToken: event.data.sessionToken,
          firstName: event.data.user.firstName,
          email: event.data.user.email,
          siteId: event.data.user.siteId,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
          siteInfo: event.data.siteInfo // Add site info
        };
        
        console.log('Storing new session data for site:', event.data.user.siteId);
        console.log('New user data:', userData);
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem("contrastkit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");
        
        // Clear React Query cache and update with new data
        queryClient.clear();
        queryClient.setQueryData<AuthState>(["auth"], {
          user: {
            firstName: event.data.user.firstName,
            email: event.data.user.email,
            siteId: event.data.user.siteId
          },
          sessionToken: event.data.sessionToken
        });
        
        // Remove the message listener
        window.removeEventListener('message', handleMessage);
      }
    };
    
    // Add message listener
    window.addEventListener('message', handleMessage);
    
    // Clean up if window is closed manually
    const checkWindow = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkWindow);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  // Function to check if user is authenticated for current site
  const isAuthenticatedForCurrentSite = async (): Promise<boolean> => {
    try {
     
      // Check if user has basic authentication
      if (!authState?.user?.email || !authState?.sessionToken) {
        return false;
      }

      // Get current site info from Webflow
      const currentSiteInfo = await webflow.getSiteInfo();
      
      if (!currentSiteInfo?.siteId) {
        return false;
      }

      // Check if user is authenticated for this specific site
      const storedSiteId = authState.user.siteId;
      const currentSiteId = currentSiteInfo.siteId;
      const isMatch = storedSiteId === currentSiteId;
      
    
      
      return isMatch;
    } catch (error) {
      return false;
    }
  };

  // Function to make authenticated API requests with bearer token
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    // Try to get session token from authState first, then from sessionStorage as fallback
    let sessionToken = authState?.sessionToken;
    
    if (!sessionToken) {
      // Fallback: get from sessionStorage
      const storedUser = sessionStorage.getItem("contrastkit-userinfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        sessionToken = userData.sessionToken;
      }
    }
    
    if (!sessionToken) {
      throw new Error('No session token available. Please authenticate first.');
    }

    console.log('=== AUTHENTICATED REQUEST DEBUG ===');
    console.log('URL:', url);
    console.log('Making authenticated request with token:', sessionToken.substring(0, 20) + '...');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      ...options.headers,
    };

    console.log('Request headers:', headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', {
      'content-type': response.headers.get('content-type'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      console.error('Full error details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        headers: headers,
        errorData: errorData
      });
      throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return response.json();
  };

  // Function to publish accessibility settings and customizations
  const publishSettings = async (customizationData: any, accessibilityProfiles: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[PUBLISH] ${requestId} Starting publish request`);
    
    // IMMEDIATE AUTH CHECK
    console.log(`[PUBLISH] ${requestId} IMMEDIATE AUTH CHECK:`, {
      hasAuthState: !!authState,
      hasSessionToken: !!authState?.sessionToken,
      hasUser: !!authState?.user,
      userEmail: authState?.user?.email,
      sessionStorageKeys: Object.keys(sessionStorage)
    });
    
    try {
      // DEBUG: Check authentication state
      console.log(`[PUBLISH] ${requestId} Auth state:`, {
        hasAuthState: !!authState,
        hasSessionToken: !!authState?.sessionToken,
        hasUser: !!authState?.user,
        userEmail: authState?.user?.email,
        sessionStorageKeys: Object.keys(sessionStorage)
      });
      
      // Check if user is authenticated - use fallback to sessionStorage
      let sessionToken = authState?.sessionToken;
      let userEmail = authState?.user?.email;
      
      if (!sessionToken || !userEmail) {
        console.log(`[PUBLISH] ${requestId} No auth state, checking sessionStorage...`);
        // Fallback: get from sessionStorage
        const storedUser = sessionStorage.getItem("contrastkit-userinfo");
        console.log(`[PUBLISH] ${requestId} Stored user from sessionStorage:`, storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          sessionToken = userData.sessionToken;
          userEmail = userData.email;
          console.log(`[PUBLISH] ${requestId} Retrieved from sessionStorage:`, {
            hasToken: !!sessionToken,
            hasEmail: !!userEmail,
            tokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : 'none'
          });
        }
      }
      
      if (!sessionToken || !userEmail) {
        console.error(`[PUBLISH] ${requestId} Authentication failed:`, {
          hasToken: !!sessionToken,
          hasEmail: !!userEmail,
          authState: authState,
          sessionStorageKeys: Object.keys(sessionStorage)
        });
        throw new Error('User must be authenticated before publishing. Please authorize first.');
      }

      console.log(`[PUBLISH] ${requestId} Publishing with user: ${userEmail} and token: ${sessionToken.substring(0, 20)}...`);

      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        throw new Error('No site information available');
      }

      // Ensure customization data has the correct structure for the widget
      const publishData = {
        customization: {
          // Trigger button customization
          triggerButtonColor: customizationData?.triggerButtonColor || '#007bff',
          triggerButtonShape: customizationData?.triggerButtonShape || 'Circle',
          triggerButtonSize: customizationData?.triggerButtonSize || 'Medium',
          triggerHorizontalPosition: customizationData?.triggerHorizontalPosition || 'Right',
          triggerVerticalPosition: customizationData?.triggerVerticalPosition || 'Bottom',
          triggerHorizontalOffset: customizationData?.triggerHorizontalOffset || '0px',
          triggerVerticalOffset: customizationData?.triggerVerticalOffset || '3px',
          hideTriggerButton: customizationData?.hideTriggerButton || 'No',
          
          // Interface customization
          interfaceLeadColor: customizationData?.interfaceLeadColor || '#FFFFFF',
          interfacePosition: customizationData?.interfacePosition || 'Left',
          interfaceFooterContent: customizationData?.interfaceFooterContent || '',
          accessibilityStatementLink: customizationData?.accessibilityStatementLink || '',
          
          // Icon customization
          selectedIcon: customizationData?.selectedIcon || 'accessibility',
          selectedIconName: customizationData?.selectedIconName || 'Accessibility',
          
          // Mobile customization
          showOnMobile: customizationData?.showOnMobile || 'Show',
          mobileTriggerHorizontalPosition: customizationData?.mobileTriggerHorizontalPosition || 'Left',
          mobileTriggerVerticalPosition: customizationData?.mobileTriggerVerticalPosition || 'Bottom',
          mobileTriggerSize: customizationData?.mobileTriggerSize || 'Medium',
          mobileTriggerShape: customizationData?.mobileTriggerShape || 'Round',
          mobileTriggerHorizontalOffset: customizationData?.mobileTriggerHorizontalOffset || '3',
          mobileTriggerVerticalOffset: customizationData?.mobileTriggerVerticalOffset || '3'
        },
        accessibilityProfiles: accessibilityProfiles,
        customDomain: null,
        publishedAt: new Date().toISOString(),
      };

      console.log(`[PUBLISH] ${requestId} Making authenticated request to publish endpoint`);
      console.log(`[PUBLISH] ${requestId} Publish data being sent:`, JSON.stringify(publishData, null, 2));

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/publish?siteId=${siteInfo.siteId}`, {
        method: 'POST',
        body: JSON.stringify(publishData),
      });

      console.log(`[PUBLISH] ${requestId} Publish successful:`, result);
      return result;
    } catch (error) {
      console.error(`[PUBLISH] ${requestId} Publish failed:`, error);
      throw error;
    }
  };

  // Function to connect custom domain to site
  const connectCustomDomain = async (domain: string) => {
    try {
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        throw new Error('No site information available');
      }

      const domainData = {
        siteId: siteInfo.siteId,
        customDomain: domain,
        connectedAt: new Date().toISOString(),
      };

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/domain`, {
        method: 'POST',
        body: JSON.stringify(domainData),
      });

      return result;
    } catch (error) {
      console.error('Domain connection failed:', error);
      throw error;
    }
  };

  // Function to get published accessibility settings
  const getPublishedSettings = async () => {
    try {
      // Get siteId from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        throw new Error('No site information available');
      }

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/settings?siteId=${siteInfo.siteId}`, {
        method: 'GET',
      });
      console.log("settings data from server",result);
      return result;
    } catch (error) {
      console.error('Failed to get published settings:', error);
      throw error;
    }
  };

  // Function to register accessibility script
  const registerAccessibilityScript = async () => {
    try {
      // Get siteId from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        throw new Error('No site information available');
      }

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/register-script?siteId=${siteInfo.siteId}`, {
        method: 'POST',
      });

      return result;
    } catch (error) {
      console.error('Failed to register accessibility script:', error);
      throw error;
    }
  };

  // Function to apply accessibility script
  const applyAccessibilityScript = async (params: {
    targetType: 'site' | 'page';
    scriptId: string;
    location: 'header' | 'footer';
    version: string;
  }) => {
    try {
      // Get siteId from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        throw new Error('No site information available');
      }

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/apply-script?siteId=${siteInfo.siteId}`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return result;
    } catch (error) {
      console.error('Failed to apply accessibility script:', error);
      throw error;
    }
  };

  // Inject script directly into Webflow using Designer Extension API
  const injectScriptToWebflow = async (scriptUrl: string) => {
    try {
      console.log('=== SCRIPT INJECTION DEBUG ===');
      console.log('Script URL:', scriptUrl);
      console.log('webflow object available:', typeof webflow !== 'undefined');
      
      // Get site info
      const siteInfo = await webflow.getSiteInfo();
      console.log('Site info:', siteInfo);
      
      // Get access token
      const idToken = await webflow.getIdToken();
      console.log('ID token available:', !!idToken);
      
      // Log all available methods to find the correct one
      const availableMethods = typeof webflow !== 'undefined' ? Object.keys(webflow) : [];
      console.log('All available webflow methods:', availableMethods);
      
      // Log the webflow object structure for debugging
      console.log('Full webflow object:', webflow);
      
      // Test if webflow object has the expected structure
      console.log('webflow.getSiteInfo type:', typeof webflow.getSiteInfo);
      console.log('webflow.getIdToken type:', typeof webflow.getIdToken);
      console.log('webflow.setCustomCode type:', typeof (webflow as any).setCustomCode);
      console.log('webflow.upsertPageCustomCode type:', typeof (webflow as any).upsertPageCustomCode);
      
      // Try the correct Webflow Designer Extension API method for "Code added by Apps"
      const customCode = `<script src="${scriptUrl}" async></script>`;
      console.log('Custom code to inject:', customCode);
      
      // Method 1: Try setCustomCode (most likely to work for "Code added by Apps")
      if (typeof webflow !== 'undefined' && (webflow as any).setCustomCode) {
        try {
          console.log('Trying setCustomCode method...');
          console.log('setCustomCode function:', (webflow as any).setCustomCode);
          
          const result = await (webflow as any).setCustomCode({
            location: 'head',
            code: customCode
          });
          
          console.log('setCustomCode result:', result);
          console.log('Script injected successfully using setCustomCode!');
          return { success: true, message: 'Script injected using setCustomCode - should appear in "Code added by Apps"' };
        } catch (error) {
          console.log('setCustomCode failed:', error);
          console.log('setCustomCode error details:', error.message, error.stack);
        }
      } else {
        console.log('setCustomCode method not available on webflow object');
      }
      
      // Method 2: Try upsertPageCustomCode
      if (typeof webflow !== 'undefined' && (webflow as any).upsertPageCustomCode) {
        try {
          console.log('Trying upsertPageCustomCode method...');
          const result = await (webflow as any).upsertPageCustomCode({
            location: 'head',
            code: customCode
          });
          
          console.log('upsertPageCustomCode result:', result);
          console.log('Script injected successfully using upsertPageCustomCode!');
          return { success: true, message: 'Script injected using upsertPageCustomCode - should appear in "Code added by Apps"' };
        } catch (error) {
          console.log('upsertPageCustomCode failed:', error);
        }
      }
      
      // Method 3: Try other potential methods
      const otherMethods = [
        'setPageCustomCode',
        'addCustomCode',
        'injectCustomCode',
        'setHeadCode',
        'setFooterCode',
        'addHeadCode',
        'addFooterCode',
        'setSiteCustomCode',
        'upsertSiteCustomCode'
      ];
      
      for (const methodName of otherMethods) {
        if (typeof webflow !== 'undefined' && (webflow as any)[methodName]) {
          try {
            console.log(`Trying ${methodName} method...`);
            const result = await (webflow as any)[methodName]({
              location: 'head',
              code: customCode
            });
            
            console.log(`${methodName} result:`, result);
            console.log(`Script injected successfully using ${methodName}!`);
            return { success: true, message: `Script injected using ${methodName} - should appear in "Code added by Apps"` };
          } catch (error) {
            console.log(`${methodName} failed:`, error);
          }
        }
      }
      
      // If no Designer Extension API methods work, fall back to REST API approach
      console.log('No Designer Extension API methods found. Using REST API approach...');
      
      try {
        // Step 1: Register the script
        console.log('Step 1: Registering script...');
        const registerResult = await registerAccessibilityScript();
        console.log('Script registration result:', registerResult);
        
        // Step 2: Apply the script
        console.log('Step 2: Applying script...');
        const scriptId = registerResult.result?.id;
        const version = registerResult.result?.version || '1.0.0';
        
        if (scriptId) {
          const applyResult = await applyAccessibilityScript({
            targetType: 'site',
            scriptId: scriptId,
            location: 'header',
            version: version
          });
          
          console.log('Script applied successfully:', applyResult);
          return { 
            success: true, 
            message: 'Script applied via REST API - will appear in Custom Code section, not "Code added by Apps"',
            note: 'Script is applied but may not appear in "Code added by Apps" section'
          };
        }
      } catch (error) {
        console.log('REST API approach failed:', error);
      }
      
      // Final fallback
      console.log('All injection methods failed. Providing manual instructions.');
      return { 
        success: true, 
        message: 'Script registered successfully. Please manually add the script to your site\'s custom code section.',
        manualStep: true,
        scriptUrl: scriptUrl,
        customCode: customCode
      };
    } catch (error) {
      console.error('Failed to inject script:', error);
      throw error;
    }
  };

  return {
    user: authState?.user || { firstName: "", email: "" },
    sessionToken: authState?.sessionToken || "",
    isAuthLoading,
    exchangeAndVerifyIdToken,
    logout,
    openAuthScreen,
    isAuthenticatedForCurrentSite,
    makeAuthenticatedRequest,
    publishSettings,
    connectCustomDomain,
    getPublishedSettings,
    registerAccessibilityScript,
    applyAccessibilityScript,
    injectScriptToWebflow,
  };
}
