import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/types";
import { WebflowAPI } from "../types/webflowtypes";
import { getAuthData,setAuthData,removeAuthStorageItem,setSiteInfo,clearAuthData,setAccessBitAuthData } from "../util/authStorage";
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
  
  const queryClient = useQueryClient();
  const isExchangingToken = { current: false };

  // Query for managing auth state and token validation
  const { data: authState, isLoading: isAuthLoading } = useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedUser = localStorage.getItem("accessbit-userinfo") || localStorage.getItem("accessbit-userinfo");
      const wasExplicitlyLoggedOut = localStorage.getItem(
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
          localStorage.removeItem("accessbit-userinfo");
          localStorage.removeItem("accessbit-userinfo");
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
        localStorage.removeItem("accessbit-userinfo");
        localStorage.removeItem("accessbit-userinfo");
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
        localStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        localStorage.removeItem("explicitly_logged_out");

        // Store site information after authentication (include normalized email)
        if (data.siteInfo) {
          const siteInfoWithEmail = { ...data.siteInfo, email: realEmail };
          localStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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

            localStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
      localStorage.removeItem("explicitly_logged_out");

      // Store site information after authentication (include normalized email)
      if (siteInfo) {
        const siteInfoWithEmail = { ...siteInfo, email: realEmail };
        localStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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
      localStorage.removeItem("accessbit-userinfo");
      localStorage.removeItem("accessbit-userinfo");
      throw error;
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Set logout flag and clear storage
    localStorage.setItem("explicitly_logged_out", "true");
    localStorage.removeItem("accessbit-userinfo");
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
        
        // Check for auth success when popup closes
        const url = new URL(window.location.href);
        const authSuccess = url.searchParams.get('auth_success');
        
        if (authSuccess === 'true') {
          
          processAuthSuccess(url);
        }
      }
    }, 1000);
    
    // Listen for postMessage from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'oauth-success') {
        
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
        
        clearInterval(checkPopupClosed);
        clearInterval(checkUrlChange);
        
        try {
          const authData = JSON.parse(event.newValue);
          processAuthSuccessFromData(authData);
        } catch (error) {
          
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
          
          // Clear intervals since we found auth success
          clearInterval(checkUrlChange);
          clearInterval(checkPopupClosed);
          
          // Process auth success (same logic as above)
          processAuthSuccess(url);
        }
      } catch (error) {
        
      }
    };
    
    // Helper function to process auth success
    const processAuthSuccess = (url: URL) => {
      try {
        // IMPORTANT: Clear all old session data first to prevent cross-site contamination
        
        localStorage.removeItem("accessbit-userinfo");
        localStorage.removeItem("accessbit-userinfo");
        localStorage.removeItem("explicitly_logged_out");
        localStorage.removeItem("siteInfo");
        
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
        
        
        
        // Store in sessionStorage for persistence
        localStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        localStorage.removeItem("explicitly_logged_out");
        
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
        
      }
    };
    
    // Helper function to process auth success from data object
    const processAuthSuccessFromData = (authData: any) => {
      try {
        
        // IMPORTANT: Clear all old session data first to prevent cross-site contamination
        
        localStorage.removeItem("accessbit-userinfo");
        localStorage.removeItem("accessbit-userinfo");
        localStorage.removeItem("explicitly_logged_out");
        localStorage.removeItem("siteInfo");
        
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
        
        
        
        // Store in sessionStorage for persistence
        localStorage.setItem("accessbit-userinfo", JSON.stringify(userData));
        localStorage.removeItem("explicitly_logged_out");
        
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
        
        
      } catch (error) {
        
      }
    };
    
    // Check immediately for auth success
    checkImmediateAuth();
    
    // Set a timeout to clear intervals after 5 minutes
    setTimeout(() => {
      clearInterval(checkUrlChange);
      clearInterval(checkPopupClosed);
      
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
      
      // Try to get session token from authState first, then from sessionStorage as fallback
      sessionToken = authState?.sessionToken;
      
      if (!sessionToken) {
        // Fallback: get from sessionStorage
        const storedUser = localStorage.getItem("accessbit-userinfo") || localStorage.getItem("accessbit-userinfo");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          sessionToken = userData.sessionToken;
        }
      }
      
      if (!sessionToken && attempts < maxAttempts) {
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    if (!sessionToken) {
      throw new Error('No session token available. Please authenticate first.');
    }

    

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      ...options.headers,
    };

    

    const response = await fetch(url, {
      ...options,
      headers,
    });

    
    

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      
      throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return response.json();
  };

  // Function to publish accessibility settings and customizations
  const publishSettings = async (customizationData: any, accessibilityProfiles: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // IMMEDIATE AUTH CHECK
    
    
    try {
      // DEBUG: Check authentication state
      
      
      // Check if user is authenticated - use fallback to sessionStorage
      let sessionToken = authState?.sessionToken;
      let userEmail = authState?.user?.email;
      
      if (!sessionToken || !userEmail) {
        
        // Fallback: get from sessionStorage
        const storedUser = localStorage.getItem("accessbit-userinfo") || localStorage.getItem("accessbit-userinfo");
        
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          sessionToken = userData.sessionToken;
          userEmail = userData.email;
          
        }
      }
      
      // No OAuth popup needed - proceed with publishing using existing session token

      

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

      

      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/publish?siteId=${siteInfo.siteId}`, {
        method: 'POST',
        body: JSON.stringify(publishData),
      });

      
      return result;
    } catch (error) {
      
      throw error;
    }
  };

 // Function to attempt automatic token refresh on app load
  const attemptAutoRefresh = async (): Promise<boolean> => {
    try {
      
      // Check if user was explicitly logged out
      const wasExplicitlyLoggedOut = localStorage.getItem("explicitly_logged_out");
      if (wasExplicitlyLoggedOut) {
        
        return false;
      }
      
      // Get current site info to check if site has changed
      const currentSiteInfo = await webflow.getSiteInfo();
      if (!currentSiteInfo?.siteId) {
        
        return false;
      }
      
      
      
      // Check if there's existing auth data that might be expired or invalid
      const storedUser = localStorage.getItem("accessbit-userinfo") || localStorage.getItem("accessbit-userinfo");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Check if site has changed
          if (userData.siteId && userData.siteId !== currentSiteInfo.siteId) {
            
            
            localStorage.removeItem('accessbit-userinfo');
            localStorage.removeItem('accessbit-userinfo');
            localStorage.removeItem('siteInfo');
            
            return false; // Force silent auth for new site
          }
          
          if (userData.sessionToken) {
            const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
            // If token is not expired, don't need to refresh
            if (decodedToken.exp * 1000 > Date.now()) {
              
              return true; // Already have valid token
            } else {
              
            }
          }
        } catch (error) {
          
        }
      } else {
        
      }

      // Attempt silent auth to refresh token with timeout
      
      const silentAuthPromise = attemptSilentAuth();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          
          resolve(false);
        }, 3000); // 3 second timeout for silent auth
      });
      
      const result = await Promise.race([silentAuthPromise, timeoutPromise]);
      
      return result;
    } catch (error) {
      
      return false;
    }
  };

// Function to attempt silent authorization without user interaction
  const attemptSilentAuth = async (): Promise<boolean> => {
    try {
      
      // Attempt to get ID token silently (works if user is already authenticated with Webflow)
      
      
      
      
      const idToken = await webflow.getIdToken();
      
      
      if (idToken) {
        // Decode and log the ID token payload for debugging
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            
            
            
            
          }
        } catch (error) {
          
        }
      }
      
      if (!idToken) {
        
        
        return false;
      }
      
      
      
      // Get site info from Webflow
      
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo || !siteInfo.siteId) {
        
        return false;
      }
      
      
      
      
      // Check what's currently in sessionStorage
      const currentStoredData = localStorage.getItem('accessbit-userinfo') || localStorage.getItem('accessbit-userinfo');
      const currentStoredData2 = localStorage.getItem('consentbit-userinfo');
      
      
      
      // Try the token endpoint first (it might work now)
      
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
      
      
      if (response.ok) {
        
        const data = await response.json();
        
        
        
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
          
          
          
          // Store in sessionStorage with the correct key
          localStorage.setItem('accessbit-userinfo', JSON.stringify(userData));
          localStorage.removeItem('explicitly_logged_out');
          
          // Also store site info separately for easy access (include email)
          if (siteInfo) {
            const siteInfoWithEmail = { ...siteInfo, email: data.email || '' };
            localStorage.setItem('siteInfo', JSON.stringify(siteInfoWithEmail));
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
          const storedData = localStorage.getItem('accessbit-userinfo');
          
          
          return true;
        } else {
          
          return false;
        }
      }
      
      const data = await response.json();
      
      
      
      
      return false;
      
    } catch (error) {
      
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

      throw error;
    }
  };

  // Function to check if published data exists for current user
  const checkPublishedDataExists = async (): Promise<boolean> => {
    try {

      
      // Get siteId from Webflow
      const siteInfo = await webflow.getSiteInfo();
      if (!siteInfo?.siteId) {

        return false;
      }


      
      const result = await makeAuthenticatedRequest(`${base_url}/api/accessibility/settings?siteId=${siteInfo.siteId}`, {
        method: 'GET',
      });
      

      
      // If we get here without error, published data exists
      if (result && (result.customization || result.accessibilityProfiles)) {
       
        return true;
      } else {
        
        return false;
      }
    } catch (error) {
     
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

      return result;
    } catch (error) {

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
     
      throw error;
    }
  };

  // Inject script directly into Webflow using Designer Extension API
  const injectScriptToWebflow = async (scriptUrl: string) => {
    try {
     
      // Get site info
      const siteInfo = await webflow.getSiteInfo();

      // Get access token
      const idToken = await webflow.getIdToken();
    
      const availableMethods = typeof webflow !== 'undefined' ? Object.keys(webflow) : [];
    

      
      // Try the correct Webflow Designer Extension API method for "Code added by Apps"
      const customCode = `<script src="${scriptUrl}" async></script>`;

      // Method 1: Try setCustomCode (most likely to work for "Code added by Apps")
      if (typeof webflow !== 'undefined' && (webflow as any).setCustomCode) {
        try {

          const result = await (webflow as any).setCustomCode({
            location: 'head',
            code: customCode
          });
          
          
          return { success: true, message: 'Script injected using setCustomCode - should appear in "Code added by Apps"' };
        } catch (error) {
          
        }
      } else {
       
      }
      
      // Method 2: Try upsertPageCustomCode
      if (typeof webflow !== 'undefined' && (webflow as any).upsertPageCustomCode) {
        try {
        
          const result = await (webflow as any).upsertPageCustomCode({
            location: 'head',
            code: customCode
          });
          
         
          return { success: true, message: 'Script injected using upsertPageCustomCode - should appear in "Code added by Apps"' };
        } catch (error) {
         
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
           
            const result = await (webflow as any)[methodName]({
              location: 'head',
              code: customCode
            });
            
            
            return { success: true, message: `Script injected using ${methodName} - should appear in "Code added by Apps"` };
          } catch (error) {
           
          }
        }
      }
      
      // If no Designer Extension API methods work, fall back to REST API approach
      
      
      try {
        // Step 1: Register the script
       
        const registerResult = await registerAccessibilityScript();
       
        
        // Step 2: Apply the script
       
        const scriptId = registerResult.result?.id;
        const version = registerResult.result?.version || '1.0.0';
        
        if (scriptId) {
          const applyResult = await applyAccessibilityScript({
            targetType: 'site',
            scriptId: scriptId,
            location: 'header',
            version: version
          });
          
         
          return { 
            success: true, 
            message: 'Script applied via REST API - will appear in Custom Code section, not "Code added by Apps"',
            note: 'Script is applied but may not appear in "Code added by Apps" section'
          };
        }
      } catch (error) {
        
      }
      
      // Final fallback

      return { 
        success: true, 
        message: 'Script registered successfully. Please manually add the script to your site\'s custom code section.',
        manualStep: true,
        scriptUrl: scriptUrl,
        customCode: customCode
      };
    } catch (error) {
     
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
    checkPublishedDataExists,
    registerAccessibilityScript,
    applyAccessibilityScript,
    injectScriptToWebflow,
    attemptSilentAuth,
    attemptAutoRefresh
  };
}
