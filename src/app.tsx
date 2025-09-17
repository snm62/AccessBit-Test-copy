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
  const { user, sessionToken, isAuthLoading, exchangeAndVerifyIdToken, openAuthScreen } = useAuth();
  
  // Check if user is authenticated based on session token
  const isAuthenticated = !!(user.email && sessionToken);

  // OAuth callback handling is now done by the Cloudflare Worker
  // No need for frontend callback handling when using worker-based OAuth

  // Auto-navigate to customization screen when authenticated
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'welcome') {
      setCurrentScreen('customization');
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