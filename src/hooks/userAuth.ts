import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/types";
import { WebflowAPI } from "../types/webflowtypes";
import { getAuthData,setAuthData,removeAuthStorageItem,setSiteInfo,clearAuthData,setContrastKitAuthData } from "../util/authStorage";
import { getAuthStorageItem } from "../util/authStorage";
const base_url = "https://accessibility-widget.web-8fb.workers.dev";

// Use the real Webflow API from the global scope,
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
  console.log("🔐 AUTH: useAuth hook called");
  const queryClient = useQueryClient();
  const isExchangingToken = { current: false };

  // Query for managing auth state and token validation
  const { data: authState, isLoading: isAuthLoading } = useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedUser = sessionStorage.getItem("accessbit-userinfo") || sessionStorage.getItem("accessbit-userinfo");
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
          sessionStorage.removeItem("accessbit-userinfo");
          sessionStorage.removeItem("accessbit-userinfo");
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
        sessionStorage.removeItem("accessbit-userinfo");
        sessionStorage.removeItem("accessbit-userinfo");
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
       // Worker now sends real email, so use it directly
       const realEmail = data.email || '';
        const userData = {
          sessionToken: data.sessionToken,
          firstName: data.firstName,
          email: realEmail,
          siteId: data.siteId, // Store the siteId from server response
          exp: decodedToken.exp,
        };

                 // Update sessionStorage
        sessionStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");

        // Store site information after authentication (include normalized email)
        if (data.siteInfo) {
          const siteInfoWithEmail = { ...data.siteInfo, email: realEmail };
          sessionStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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
      // Worker now sends real email, so use it directly
      const realEmail = data.email || '';
      const userData = {
        sessionToken: data.sessionToken,
        firstName: data.firstName,
        email: realEmail,
        siteId: siteInfo.siteId, // Store the siteId
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      };

            sessionStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
      sessionStorage.removeItem("explicitly_logged_out");

      // Store site information after authentication (include normalized email)
      if (siteInfo) {
        const siteInfoWithEmail = { ...siteInfo, email: realEmail };
        sessionStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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
      sessionStorage.removeItem("accessbit-userinfo");
      sessionStorage.removeItem("accessbit-userinfo");
      throw error;
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Set logout flag and clear storage
    sessionStorage.setItem("explicitly_logged_out", "true");
    sessionStorage.removeItem("accessbit-userinfo");
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
      `${base_url}/api/auth/authorize?state=webflow_designer_${siteInfo.siteId}&siteId=${siteInfo.siteId}`,
      "_blank",
      "width=600,height=600"
    );

    if (!authWindow) {
      return;
    }
    
    // Monitor popup window for completion and URL changes
    const checkPopupClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkPopupClosed);
        console.log('OAuth popup closed, checking for auth success...');
        
        // Check for auth success when popup closes
        const url = new URL(window.location.href);
        const authSuccess = url.searchParams.get('auth_success');
        
        if (authSuccess === 'true') {
          console.log('Auth success detected when popup closed');
          processAuthSuccess(url);
        }
      }
    }, 1000);
    
    // Listen for postMessage from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'oauth-success') {
        console.log('OAuth success message received from popup:', event.data);
        clearInterval(checkPopupClosed);
        clearInterval(checkUrlChange);
        
        // Process the auth success with the data from the popup
        const authData = event.data.data;
        processAuthSuccessFromData(authData);
      }
    };
    
    // Listen for storage events (when popup stores data)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessbit-userinfo' && event.newValue) {
        console.log('Auth data stored by popup:', event.newValue);
        clearInterval(checkPopupClosed);
        clearInterval(checkUrlChange);
        
        try {
          const authData = JSON.parse(event.newValue);
          processAuthSuccessFromData(authData);
        } catch (error) {
          console.error('Failed to parse auth data from storage event:', error);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);
    
    // Also monitor for URL changes in the main window (in case popup redirects back)
    const checkUrlChange = setInterval(() => {
      const url = new URL(window.location.href);
      const authSuccess = url.searchParams.get('auth_success');
      
      if (authSuccess === 'true') {
        clearInterval(checkUrlChange);
        clearInterval(checkPopupClosed);
        console.log('Auth success detected via URL change');
        
        // Process auth success using helper function
        processAuthSuccess(url);
      }
    }, 500);
    
    // Check immediately for auth success (in case popup already completed)
    const checkImmediateAuth = () => {
      try {
        const url = new URL(window.location.href);
        const authSuccess = url.searchParams.get('auth_success');
        
        if (authSuccess === 'true') {
          console.log('Auth success detected immediately in URL parameters');
          
          // Clear intervals since we found auth success
          clearInterval(checkUrlChange);
          clearInterval(checkPopupClosed);
          
          // Process auth success (same logic as above)
          processAuthSuccess(url);
        }
      } catch (error) {
        console.warn('Error checking immediate auth:', error);
      }
    };
    
    // Helper function to process auth success
    const processAuthSuccess = (url: URL) => {
      try {
        // IMPORTANT: Clear all old session data first to prevent cross-site contamination
        console.log('Clearing old session data before storing new data...');
        sessionStorage.removeItem("accessbit-userinfo");
        sessionStorage.removeItem("contrastkit-userinfo");
        sessionStorage.removeItem("explicitly_logged_out");
        sessionStorage.removeItem("siteInfo");
        
        // Get auth data from URL parameters
        const sessionToken = url.searchParams.get('sessionToken');
        const firstName = url.searchParams.get('firstName');
        const email = url.searchParams.get('email');
        const siteId = url.searchParams.get('siteId');
        const siteName = url.searchParams.get('siteName');
        const shortName = url.searchParams.get('shortName');
        
        // Store the session data from the OAuth popup
        const userData = {
          sessionToken: sessionToken,
          firstName: firstName,
          email: email || '',
          siteId: siteId,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
          siteInfo: {
            siteId: siteId,
            siteName: siteName,
            shortName: shortName,
            email: email || ''
          }
        };
        
        console.log('Storing new session data for site:', siteId);
        console.log('New user data:', userData);
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");
        
        // Clear React Query cache and update with new data
        queryClient.clear();
        queryClient.setQueryData<AuthState>(["auth"], {
          user: {
            firstName: firstName,
            email: email || '',
            siteId: siteId
          },
          sessionToken: sessionToken
        });
        
        // Clean up URL parameters
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('auth_success');
        cleanUrl.searchParams.delete('sessionToken');
        cleanUrl.searchParams.delete('firstName');
        cleanUrl.searchParams.delete('email');
        cleanUrl.searchParams.delete('siteId');
        cleanUrl.searchParams.delete('siteName');
        cleanUrl.searchParams.delete('shortName');
        window.history.replaceState({}, '', cleanUrl.toString());
      } catch (error) {
        console.warn('Error processing auth success:', error);
      }
    };
    
    // Helper function to process auth success from data object
    const processAuthSuccessFromData = (authData: any) => {
      try {
        console.log('Processing auth success from data:', authData);
        
        // IMPORTANT: Clear all old session data first to prevent cross-site contamination
        console.log('Clearing old session data before storing new data...');
        sessionStorage.removeItem("accessbit-userinfo");
        sessionStorage.removeItem("contrastkit-userinfo");
        sessionStorage.removeItem("explicitly_logged_out");
        sessionStorage.removeItem("siteInfo");
        
        // Store the session data from the OAuth popup
        const userData = {
          sessionToken: authData.sessionToken,
          firstName: authData.firstName,
          email: authData.email || '',
          siteId: authData.siteId,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
          siteInfo: {
            siteId: authData.siteId,
            siteName: authData.siteName,
            shortName: authData.shortName,
            email: authData.email || ''
          }
        };
        
        console.log('Storing new session data for site:', authData.siteId);
        console.log('New user data:', userData);
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");
        
        // Clear React Query cache and update with new data
        queryClient.clear();
        queryClient.setQueryData<AuthState>(["auth"], {
          user: {
            firstName: authData.firstName,
            email: authData.email || '',
            siteId: authData.siteId
          },
          sessionToken: authData.sessionToken
        });
        
        console.log('OAuth success processed successfully');
      } catch (error) {
        console.warn('Error processing auth success from data:', error);
      }
    };
    
    // Check immediately for auth success
    checkImmediateAuth();
    
    // Set a timeout to clear intervals after 5 minutes
    setTimeout(() => {
      clearInterval(checkUrlChange);
      clearInterval(checkPopupClosed);
      console.log('OAuth monitoring timeout reached');
    }, 5 * 60 * 1000); // 5 minutes
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
    // Try to get session token with retry mechanism
    let sessionToken = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!sessionToken && attempts < maxAttempts) {
      attempts++;
      console.log(`[AUTH_REQUEST] Attempt ${attempts} to get session token...`);
      
      // Try to get session token from authState first, then from sessionStorage as fallback
      sessionToken = authState?.sessionToken;
      
      if (!sessionToken) {
        // Fallback: get from sessionStorage
        const storedUser = sessionStorage.getItem("accessbit-userinfo") || sessionStorage.getItem("accessbit-userinfo");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          sessionToken = userData.sessionToken;
        }
      }
      
      if (!sessionToken && attempts < maxAttempts) {
        console.log(`[AUTH_REQUEST] No session token found, waiting 200ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, 200));
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
        const storedUser = sessionStorage.getItem("accessbit-userinfo") || sessionStorage.getItem("accessbit-userinfo");
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
      
      // No OAuth popup needed - proceed with publishing using existing session token

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

 // Function to attempt automatic token refresh on app load
  const attemptAutoRefresh = async (): Promise<boolean> => {
    try {
      console.log("[AUTO_REFRESH] Starting automatic token refresh...");
      
      // Check if user was explicitly logged out
      const wasExplicitlyLoggedOut = sessionStorage.getItem("explicitly_logged_out");
      if (wasExplicitlyLoggedOut) {
        console.log("[AUTO_REFRESH] User was explicitly logged out, skipping refresh");
        return false;
      }
      
      // Get current site info to check if site has changed
      const currentSiteInfo = await webflow.getSiteInfo();
      if (!currentSiteInfo?.siteId) {
        console.log("[AUTO_REFRESH] No current site info available");
        return false;
      }
      
      console.log("[AUTO_REFRESH] Current site ID:", currentSiteInfo.siteId);
      
      // Check if there's existing auth data that might be expired or invalid
      const storedUser = sessionStorage.getItem("accessbit-userinfo") || sessionStorage.getItem("accessbit-userinfo");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Check if site has changed
          if (userData.siteId && userData.siteId !== currentSiteInfo.siteId) {
            console.log("[AUTO_REFRESH] Site has changed, clearing old session data");
            console.log("[AUTO_REFRESH] Old site:", userData.siteId, "New site:", currentSiteInfo.siteId);
            sessionStorage.removeItem('accessbit-userinfo');
            sessionStorage.removeItem('accessbit-userinfo');
            sessionStorage.removeItem('siteInfo');
            console.log("[AUTO_REFRESH] Cleared old session data, attempting silent auth for new site");
            return false; // Force silent auth for new site
          }
          
          if (userData.sessionToken) {
            const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
            // If token is not expired, don't need to refresh
            if (decodedToken.exp * 1000 > Date.now()) {
              console.log("[AUTO_REFRESH] Valid token found for current site, no refresh needed");
              return true; // Already have valid token
            } else {
              console.log("[AUTO_REFRESH] Token expired, attempting refresh");
            }
          }
        } catch (error) {
          console.log("[AUTO_REFRESH] Invalid token data, attempting refresh");
        }
      } else {
        console.log("[AUTO_REFRESH] No existing auth data, attempting silent auth");
      }

      // Attempt silent auth to refresh token with timeout
      console.log("[AUTO_REFRESH] Attempting silent authentication...");
      const silentAuthPromise = attemptSilentAuth();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log("[AUTO_REFRESH] Silent auth timeout reached");
          resolve(false);
        }, 3000); // 3 second timeout for silent auth
      });
      
      const result = await Promise.race([silentAuthPromise, timeoutPromise]);
      console.log("[AUTO_REFRESH] Result:", result);
      return result;
    } catch (error) {
      console.error("[AUTO_REFRESH] Error during auto refresh:", error);
      return false;
    }
  };

// Function to attempt silent authorization without user interaction
  const attemptSilentAuth = async (): Promise<boolean> => {
    try {
      console.log("[SILENT_AUTH] Starting silent authentication...");
      
      // Attempt to get ID token silently (works if user is already authenticated with Webflow)
      console.log("[SILENT_AUTH] Getting ID token from Webflow...");
      console.log("[SILENT_AUTH] Webflow object available:", typeof webflow !== 'undefined');
      console.log("[SILENT_AUTH] getIdToken method available:", typeof webflow?.getIdToken);
      
      const idToken = await webflow.getIdToken();
      console.log("[SILENT_AUTH] ID token result:", idToken ? 'Token received' : 'No token');
      
      if (idToken) {
        // Decode and log the ID token payload for debugging
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("[SILENT_AUTH] ID token payload:", payload);
            console.log("[SILENT_AUTH] ID token exp:", new Date(payload.exp * 1000));
            console.log("[SILENT_AUTH] ID token iss:", payload.iss);
            console.log("[SILENT_AUTH] ID token aud:", payload.aud);
          }
        } catch (error) {
          console.log("[SILENT_AUTH] Failed to decode ID token:", error);
        }
      }
      
      if (!idToken) {
        console.log("[SILENT_AUTH] No ID token available from Webflow - user needs to authorize first");
        console.log("[SILENT_AUTH] This means the user hasn't authorized the app with Webflow yet");
        return false;
      }
      
      console.log("[SILENT_AUTH] ID token obtained successfully");
      
      // Get site info from Webflow
      console.log("[SILENT_AUTH] Getting site info from Webflow...");
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo || !siteInfo.siteId) {
        console.log("[SILENT_AUTH] No site info available from Webflow");
        return false;
      }
      console.log("[SILENT_AUTH] Site info obtained:", siteInfo.siteId);
      
      console.log("[SILENT_AUTH] Making token exchange request...");
      
      // Check what's currently in sessionStorage
      const currentStoredData = sessionStorage.getItem('accessbit-userinfo') || sessionStorage.getItem('accessbit-userinfo');
      const currentStoredData2 = sessionStorage.getItem('consentbit-userinfo');
      console.log("[SILENT_AUTH] Current sessionStorage (contrastkit):", currentStoredData);
      console.log("[SILENT_AUTH] Current sessionStorage (consentbit):", currentStoredData2);
      
      // Try the token endpoint first (it might work now)
      console.log("[SILENT_AUTH] Trying token endpoint: /api/auth/token");
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
      
      console.log("[SILENT_AUTH] Response status:", response.status);
      
      if (response.ok) {
        console.log("[SILENT_AUTH] Success with token endpoint!");
        const data = await response.json();
        console.log("[SILENT_AUTH] Response data:", data);
        console.log("[SILENT_AUTH] Full response data:", JSON.stringify(data, null, 2));
        
        if (data.sessionToken) {
          // Create user data object with all necessary information
          // Worker now sends real email from KV, so use it directly
          const userData = {
            sessionToken: data.sessionToken,
            firstName: data.firstName || 'User',
            email: data.email || '',
            siteId: siteInfo.siteId,
            exp: data.exp,
            siteInfo: {
              siteId: siteInfo.siteId,
              siteName: siteInfo.siteName,
              shortName: siteInfo.shortName,
              email: data.email || ''
            }
          };
          
          console.log("[SILENT_AUTH] Storing authentication data...");
          console.log("[SILENT_AUTH] User data to store:", JSON.stringify(userData, null, 2));
          
          // Store in sessionStorage with the correct key
          sessionStorage.setItem('accessbit-userinfo', JSON.stringify(userData));
          sessionStorage.removeItem('explicitly_logged_out');
          
          // Also store site info separately for easy access (include email)
          if (siteInfo) {
            const siteInfoWithEmail = { ...siteInfo, email: data.email || '' };
            sessionStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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
          
          // Verify the data was stored
          const storedData = sessionStorage.getItem('accessbit-userinfo');
          console.log("[SILENT_AUTH] Stored data in sessionStorage:", storedData);
          console.log("[SILENT_AUTH] Silent authentication completed successfully - token generated");
          return true;
        } else {
          console.log("[SILENT_AUTH] No session token in response:", data);
          return false;
        }
      }
      
      const data = await response.json();
      console.log("[SILENT_AUTH] Token exchange failed:", data);
      console.log("[SILENT_AUTH] Error details:", JSON.stringify(data, null, 2));
      console.log("[SILENT_AUTH] This means the backend cannot verify the Webflow ID token");
      console.log("[SILENT_AUTH] The user needs to go through OAuth flow first");
      return false;
      
    } catch (error) {
      console.error("[SILENT_AUTH] Silent auth failed with error:", error);
      return false;
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

  // Function to check if published data exists for current user
  const checkPublishedDataExists = async (): Promise<boolean> => {
    try {
      console.log("[CHECK_PUBLISHED] Checking if published data exists...");
      
      // Get siteId from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {
        console.log("[CHECK_PUBLISHED] No site information available");
        return false;
      }

      console.log("[CHECK_PUBLISHED] Checking for siteId:", siteInfo.siteId);
      
      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/settings?siteId=${siteInfo.siteId}`, {
        method: 'GET',
      });
      
      console.log("[CHECK_PUBLISHED] Published data check result:", result);
      
      // If we get here without error, published data exists
      if (result && (result.customization || result.accessibilityProfiles)) {
        console.log("[CHECK_PUBLISHED] Published data exists for current user");
        return true;
      } else {
        console.log("[CHECK_PUBLISHED] No published data found");
        return false;
      }
    } catch (error) {
      console.log("[CHECK_PUBLISHED] No published data exists (404 or other error):", error.message);
      return false;
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

  console.log("🔐 AUTH: Returning functions from useAuth hook");
  console.log("🔐 AUTH: attemptAutoRefresh type:", typeof attemptAutoRefresh);
  console.log("🔐 AUTH: attemptSilentAuth type:", typeof attemptSilentAuth);
  
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
    checkPublishedDataExists,
    registerAccessibilityScript,
    applyAccessibilityScript,
    injectScriptToWebflow,
    attemptSilentAuth,
    attemptAutoRefresh
  };
}
