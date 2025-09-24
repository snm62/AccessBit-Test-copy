import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PublishScreen from "./components/PublishScreen";
import { useAuth} from "./hooks/userAuth";
import { getAuthStorageItem,setAuthStorageItem,removeAuthStorageItem } from "./util/authStorage";
import { getSessionTokenFromLocalStorage } from "./util/session";
// Webflow API is available globally in the Webflow Designer environment
type AppState = 'welcome' | 'customization' | 'publish';
const App: React.FC = () => {
  console.log(":rocket: APP: App component rendering...");
  console.log(":rocket: APP: Component render timestamp:", new Date().toISOString());
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [customizationData, setCustomizationData] = useState<any>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  console.log(":rocket: APP: About to call useAuth hook...");
  const { openAuthScreen, getPublishedSettings, attemptAutoRefresh, isAuthLoading, attemptSilentAuth, checkPublishedDataExists } = useAuth();
  console.log(":rocket: APP: useAuth hook completed, attemptAutoRefresh:", typeof attemptAutoRefresh);
  console.log(":rocket: APP: Component state - currentScreen:", currentScreen);
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  // Check if user is authenticated based on session token
  //const isAuthenticated = !!(user.email && sessionToken);
  // OAuth callback handling is now done by the Cloudflare Worker
  // No need for frontend callback handling when using worker-based OAuth
  // Load existing customization data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      loadExistingCustomizationData();
    }
  }, [isAuthenticated, isAuthLoading]);
  // Navigation is handled after data load in initializeApp
  // Load existing customization data when authenticated
  const loadExistingCustomizationData = async () => {
    if (!isAuthenticated) return;
    setIsLoadingExistingData(true);
    try {
      console.log("App: Loading existing customization data...");
      // Add a small delay to ensure authentication is fully complete
      await new Promise(resolve => setTimeout(resolve, 500));
      const existingSettings = await getPublishedSettings();
      console.log("App: Existing settings loaded:", existingSettings);
      if (existingSettings && existingSettings.customization) {
        setCustomizationData(existingSettings.customization);
        console.log("App: Customization data set:", existingSettings.customization);
        console.log(":white_tick: App: Successfully loaded existing customization data");
      } else {
        console.log("App: No existing customization data found - using defaults");
      }
    } catch (error) {
      console.error("App: Failed to load existing customization data:", error);
      // Don't show error to user, just continue with empty data
    } finally {
      setIsLoadingExistingData(false);
    }
  };
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) {
      console.log(":rocket: APP: Already initialized, skipping...");
      return;
    }
    const initializeApp = async () => {
      const startTime = performance.now();
      console.log(":rocket: APP: Starting initialization...");
      setHasInitialized(true);
      setIsAppInitializing(false);
      setIsCheckingAuth(true);
      
      // Always attempt silent authentication first to get fresh tokens
      console.log(":rocket: APP: Always attempting silent authentication for fresh site-specific data...");
      
      try {
        // Try fresh background authentication (silent) with timeout
        const authPromise = attemptAutoRefresh();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log(":rocket: APP: Silent auth timeout reached");
            resolve(false);
          }, 5000); // 5 second timeout
        });
        
        const refreshSuccess = await Promise.race([authPromise, timeoutPromise]);
        
        if (refreshSuccess) {
          console.log(":rocket: APP: Silent authentication successful - token generated");
          setIsAuthenticated(true);
          
          // Check what's stored in sessionStorage
          const storedData = sessionStorage.getItem('contrastkit-userinfo');
          console.log(":rocket: APP: Stored data in sessionStorage:", storedData);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            console.log(":rocket: APP: Parsed stored data:", parsedData);
          }
          
          // Now check if published data exists for this user
          setTimeout(async () => {
            try {
              console.log(":rocket: APP: Checking if published data exists...");
              const hasPublishedData = await checkPublishedDataExists();
              
              if (hasPublishedData) {
                console.log(":rocket: APP: Published data exists, loading existing customization data...");
                const existingData = await loadExistingCustomizationData();
                console.log(":rocket: APP: Existing customization data loaded:", existingData);
              } else {
                console.log(":rocket: APP: No published data exists, using defaults");
              }
            } catch (error) {
              console.error(":rocket: APP: Failed to check/load published data:", error);
            }
          }, 500); // Small delay to ensure auth state is updated
          
          setCurrentScreen('customization');
        } else {
          console.log(":rocket: APP: Silent authentication failed, user needs to authorize first");
          setIsAuthenticated(false);
          // Show welcome screen with authorize button as fallback
          setCurrentScreen('welcome');
        }
      } catch (error) {
        console.error(":rocket: APP: Error during silent authentication:", error);
        setIsAuthenticated(false);
        setCurrentScreen('welcome');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initializeApp();
  }, [hasInitialized]);
  const handleAuthorize = async () => {
    console.log("Authorize button clicked");
    try {
      // Use OAuth flow instead of direct token exchange
      console.log("Opening OAuth authorization...");
      await openAuthScreen();
      console.log("OAuth authorization initiated");
    } catch (error) {
      console.error("Authentication failed:", error);
      alert(`Authentication failed: ${error.message}`);
    }
  };
  // (kept) data loader above handles auth + loading state
  const handleNeedHelp = () => {
    console.log("Need help button clicked");
    // Add your help logic here
  };
  const handleWelcomeScreen = () => {
    console.log("Scan Project button clicked");
    setCurrentScreen('customization');
  };
  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };
  const handleBackToCustomization = () => {
    console.log("App: Going back to customization, current customizationData:", customizationData);
    setCurrentScreen('customization');
  };
  const handleNextToPublish = (data: any) => {
    console.log("App: Received customization data from CustomizationScreen:", data);
    setCustomizationData(data);
    setCurrentScreen('publish');
  };
  return (
    <div>
      {currentScreen === 'welcome' ? (
        <WelcomeScreen
          onAuthorize={handleAuthorize}
          onNeedHelp={handleNeedHelp}
          authenticated={isAuthenticated}
          handleWelcomeScreen={handleWelcomeScreen}
        />
      ) : currentScreen === 'customization' ? (
        <CustomizationScreen
          onBack={handleBackToWelcome}
          onNext={handleNextToPublish}
          existingCustomizationData={customizationData}
          isLoadingExistingData={isLoadingExistingData}
        />
      ) : (
        <PublishScreen
          onBack={handleBackToCustomization}
          customizationData={customizationData || {}}
        />
      )}
    </div>
  );
};
export default App;
