import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PublishScreen from "./components/PublishScreen";
import { useAuth } from "./hooks/userAuth";

declare const webflow: {
  getSelectedElement: () => Promise<any>;
  // Add more method signatures if you need them later
};

type AppState = 'welcome' | 'customization' | 'publish';

type CustomizationData = {
  selectedIcon: string;
  triggerButtonColor: string;
  triggerButtonShape: string;
  triggerHorizontalPosition: string;
  triggerVerticalPosition: string;
  triggerButtonSize: string;
  // Add other customization properties as needed
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
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
  const [customizationData, setCustomizationData] = useState<CustomizationData>({
    selectedIcon: 'accessibility',
    triggerButtonColor: '#2c59c9',
    triggerButtonShape: 'Circle',
    triggerHorizontalPosition: 'Left',
    triggerVerticalPosition: 'Bottom',
    triggerButtonSize: 'Medium',
  });

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
    setCurrentScreen('customization');
  };

  const handleNextToPublish = () => {
    setCurrentScreen('publish');
  };

  const handleCustomizationUpdate = (data: Partial<CustomizationData>) => {
    setCustomizationData(prev => ({ ...prev, ...data }));
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
          customizationData={customizationData}
          onCustomizationUpdate={handleCustomizationUpdate}
        />
      ) : (
        <PublishScreen 
          onBack={handleBackToCustomization}
          customizationData={customizationData}
        />
      )}
    </div>
  );
};

export default App;