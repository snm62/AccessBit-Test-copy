import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PublishScreen from "./components/PublishScreen";

declare const webflow: {
  getSelectedElement: () => Promise<any>;
  // Add more method signatures if you need them later
};

type AppState = 'welcome' | 'customization' | 'publish';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthorize = () => {
    console.log("Authorize button clicked");
    // Simulate authorization process
    setTimeout(() => {
      setIsAuthenticated(true);
      setCurrentScreen('customization');
    }, 1000);
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
        />
      ) : (
        <PublishScreen onBack={handleBackToCustomization} />
      )}
    </div>
  );
};

export default App;