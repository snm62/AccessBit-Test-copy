import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PublishScreen from "./components/PublishScreen";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customizationData, setCustomizationData] = useState<CustomizationData>({
    selectedIcon: 'accessibility',
    triggerButtonColor: '#2c59c9',
    triggerButtonShape: 'Circle',
    triggerHorizontalPosition: 'Left',
    triggerVerticalPosition: 'Bottom',
    triggerButtonSize: 'Medium',
  });

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