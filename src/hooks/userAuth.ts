import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/types";
import { WebflowAPI } from "../types/webflowtypes";

const base_url = "https://accessibility-widget.web-8fb.workers.dev";

// Create webflow instance - this would normally come from Webflow's SDK
const webflow: WebflowAPI = {
  getSiteInfo: async () => {
    // This would be implemented with actual Webflow API calls
    return {
      siteId: "mock-site-id",
      siteName: "Mock Site",
      shortName: "mock",
      url: "https://mock-site.webflow.io"
    };
  },
  getIdToken: async () => {
    // This would return the actual ID token from Webflow
    return "mock-id-token";
  },
  publishSite: async () => {
    // This would publish the site
    return {
      customDomains: [],
      publishToWebflowSubdomain: true
    };
  }
};

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
        
        // Store the session data from the OAuth popup
        const userData = {
          sessionToken: event.data.sessionToken,
          firstName: event.data.user.firstName,
          email: event.data.user.email,
          siteId: event.data.user.siteId,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
          siteInfo: event.data.siteInfo // Add site info
        };
        
        // Store in sessionStorage (not sessionStorage) for persistence
        sessionStorage.setItem("contrastkit-userinfo", JSON.stringify(userData));
        sessionStorage.removeItem("explicitly_logged_out");
        
        // Update React Query cache
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

  return {
    user: authState?.user || { firstName: "", email: "" },
    sessionToken: authState?.sessionToken || "",
    isAuthLoading,
    exchangeAndVerifyIdToken,
    logout,
    openAuthScreen,
    isAuthenticatedForCurrentSite,
  };
}
