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
  console.log("🚀 APP: App component rendering...");
  console.log("🚀 APP: Component render timestamp:", new Date().toISOString());
  
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [customizationData, setCustomizationData] = useState<any>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  
  console.log("🚀 APP: About to call useAuth hook...");
  const { openAuthScreen, getPublishedSettings, attemptAutoRefresh } = useAuth();
  console.log("🚀 APP: useAuth hook completed, attemptAutoRefresh:", typeof attemptAutoRefresh);
  console.log("🚀 APP: Component state - currentScreen:", currentScreen);
  
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is authenticated based on session token
  //const isAuthenticated = !!(user.email && sessionToken);

  // OAuth callback handling is now done by the Cloudflare Worker
  // No need for frontend callback handling when using worker-based OAuth

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
        console.log("✅ App: Successfully loaded existing customization data");
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
    console.log("🚀 APP: useEffect triggered - App component mounted");
    console.log("🚀 APP: useEffect dependencies: []");
    console.log("🚀 APP: attemptAutoRefresh available:", typeof attemptAutoRefresh);
    
    const initializeApp = async () => {
      const startTime = performance.now();
      console.log("🚀 APP: Starting initialization...");
      setIsAppInitializing(false);
      setIsCheckingAuth(true);
      
      // Test if attemptAutoRefresh function exists
      console.log("🚀 APP: attemptAutoRefresh function:", typeof attemptAutoRefresh);
      
      try {
        // Always attempt silent authentication first
        console.log("🚀 APP: Attempting silent authentication...");
        const authPromise = attemptAutoRefresh();
        console.log("🚀 APP: Auth promise created:", typeof authPromise);
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log("🚀 APP: Silent auth timeout reached");
            resolve(false);
          }, 5000); // 5 second timeout
        });
        
        console.log("🚀 APP: Waiting for auth result...");
        const refreshSuccess = await Promise.race([authPromise, timeoutPromise]);
        console.log("🚀 APP: Auth result:", refreshSuccess);
        
        if (refreshSuccess) {
          console.log("🚀 APP: Silent authentication successful");
          setIsAuthenticated(true);
        } else {
          console.log("🚀 APP: Silent authentication failed, user will need to re-authenticate");
          setIsAuthenticated(false);
          
          // Since silent auth failed, we need to show the welcome screen
          // The user will need to click "Authorize" to start the OAuth flow
          console.log("🚀 APP: User needs to authenticate via OAuth flow");
        }
      } catch (error) {
        console.error("🚀 APP: Error during silent authentication:", error);
        setIsAuthenticated(false);
      }
      
      setIsCheckingAuth(false);
      const endTime = performance.now();
      console.log(`🚀 APP: Initialization took ${endTime - startTime} milliseconds`);
    };

    console.log("🚀 APP: Calling initializeApp...");
    initializeApp();
  }, []);


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
  useEffect(() => {
    if (isAuthenticated) {
      loadExistingCustomizationData();
    }
  }, [isAuthenticated]);
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