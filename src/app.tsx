import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PublishScreen from "./components/PublishScreen";
import { useAuth } from "./hooks/userAuth";

// Webflow API is available globally in the Webflow Designer environment

type AppState = 'welcome' | 'customization' | 'publish';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [customizationData, setCustomizationData] = useState<any>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  const { user, sessionToken, isAuthLoading, exchangeAndVerifyIdToken, openAuthScreen, getPublishedSettings } = useAuth();
  
  // Check if user is authenticated based on session token
  const isAuthenticated = !!(user.email && sessionToken);

  // OAuth callback handling is now done by the Cloudflare Worker
  // No need for frontend callback handling when using worker-based OAuth

  // Load existing customization data when authenticated
  const loadExistingCustomizationData = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingExistingData(true);
    try {
      console.log("App: Loading existing customization data...");
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

  // Auto-navigate to customization screen when authenticated and load existing data
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'welcome') {
      loadExistingCustomizationData().then(() => {
        setCurrentScreen('customization');
      });
    } else if (!isAuthenticated && currentScreen !== 'welcome') {
      // If not authenticated, go back to welcome screen
      setCurrentScreen('welcome');
    }
  }, [isAuthenticated, currentScreen]);

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