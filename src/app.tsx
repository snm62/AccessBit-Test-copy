import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CustomizationScreen from "./components/CustomizationScreen";
import PaymentScreen from "./components/PaymentScreen";
import PublishScreen from "./components/PublishScreen";
import { useAuth} from "./hooks/userAuth";
import { getAuthStorageItem,setAuthStorageItem,removeAuthStorageItem } from "./util/authStorage";
import { getSessionTokenFromLocalStorage } from "./util/session";
// Webflow API is available globally in the Webflow Designer environment
type AppState = 'welcome' | 'customization' | 'payment' | 'publish';
const App: React.FC = () => {
 
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [customizationData, setCustomizationData] = useState<any>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
 
  const { openAuthScreen, getPublishedSettings, attemptAutoRefresh, isAuthLoading, attemptSilentAuth, checkPublishedDataExists } = useAuth();
 
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  // Check if user is authenticated based on session token
  //const isAuthenticated = !!(user.email && sessionToken);
  // OAuth callback handling is now done by the Cloudflare Worker
  // No need for frontend callback handling when using worker-based OAuth
  // Detect app installation and send webhook to Make.com
  useEffect(() => {

    const detectAppInstallation = async () => {
      try {
        // Prefer new key, fallback to legacy
        const userData = localStorage.getItem('accessbit-userinfo') || localStorage.getItem('accessbit-userinfo');
        if (userData) {
          const parsed = JSON.parse(userData);
          const { siteId, email, siteInfo } = parsed;
          
          // Check if this is a new installation (you can add more logic here)
          const installationKey = `app_installed_${siteId}`;
          const hasBeenNotified = localStorage.getItem(installationKey);
          
          if (!hasBeenNotified && siteId && email) {
         
            
            // Send webhook to your worker
            await fetch('https://accessbit-test-worker.web-8fb.workers.dev/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: `app_install_${siteId}`,
                value: {
                  siteId: siteId,
                  userId: parsed.userId || 'unknown',
                  userEmail: email,
                  siteName: siteInfo?.siteName || 'Unknown Site',
                  installationData: {
                    timestamp: new Date().toISOString(),
                    source: 'webflow_app'
                  }
                }
              })
            });
            
            // Mark as notified to avoid duplicate emails
            localStorage.setItem(installationKey, 'true');
       
          }
        }
      } catch (error) {
      
      }
    };
    
    // Run installation detection after a short delay
    const timer = setTimeout(detectAppInstallation, 2000);
    return () => clearTimeout(timer);
  }, []);

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
   
      // Add a small delay to ensure authentication is fully complete
      await new Promise(resolve => setTimeout(resolve, 500));
      const existingSettings = await getPublishedSettings();

      if (existingSettings && existingSettings.customization) {
        setCustomizationData(existingSettings.customization);

      } else {

      }
    } catch (error) {

      // Don't show error to user, just continue with empty data
    } finally {
      setIsLoadingExistingData(false);
    }
  };
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) {

      return;
    }
    const initializeApp = async () => {
      const startTime = performance.now();

      setHasInitialized(true);
      setIsAppInitializing(false);
      setIsCheckingAuth(true);
      

      try {
        // Try fresh background authentication (silent) with timeout
        const authPromise = attemptAutoRefresh();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
           
            resolve(false);
          }, 5000); // 5 second timeout
        });
        
        const refreshSuccess = await Promise.race([authPromise, timeoutPromise]);
        
        if (refreshSuccess) {
         
          setIsAuthenticated(true);
          
          // Check what's stored in sessionStorage (prefer new key)
          const storedData = localStorage.getItem('accessbit-userinfo') || localStorage.getItem('accessbit-userinfo');

          if (storedData) {
            const parsedData = JSON.parse(storedData);
        
          }
          
          // Now check if published data exists for this user
          setTimeout(async () => {
            try {
             
              const hasPublishedData = await checkPublishedDataExists();
              
              if (hasPublishedData) {

                const existingData = await loadExistingCustomizationData();

              } else {

              }
            } catch (error) {

            }
          }, 500); // Small delay to ensure auth state is updated
          
          // Stay on welcome screen for authenticated users instead of auto-redirecting
          setCurrentScreen('welcome');
        } else {

          setIsAuthenticated(false);
          // Show welcome screen with authorize button as fallback
          setCurrentScreen('welcome');
        }
      } catch (error) {

        setIsAuthenticated(false);
        setCurrentScreen('welcome');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initializeApp();
  }, [hasInitialized]);
  const handleAuthorize = async () => {
   
    try {

      await openAuthScreen();
     
    } catch (error) {
     
      alert(`Authentication failed: ${error.message}`);
    }
  };
  // (kept) data loader above handles auth + loading state
  const handleNeedHelp = () => {

    // Add your help logic here
  };
  const handleWelcomeScreen = () => {

    setCurrentScreen('customization');
  };
  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };
  const handleBackToCustomization = () => {
    
    setCurrentScreen('customization');
  };
  const handleNextToPayment = (data: any) => {
    
    setCustomizationData(data);
    setCurrentScreen('payment');
    
  };

  const handleNextToPublish = () => {
    
    setCurrentScreen('publish');
  };

  const handleBackToPayment = () => {
  
    setCurrentScreen('payment');
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
          onNext={handleNextToPayment}
          existingCustomizationData={customizationData}
          isLoadingExistingData={isLoadingExistingData}
        />
      ) : currentScreen === 'payment' ? (
        <PaymentScreen
          onBack={handleBackToCustomization}
          onNext={handleNextToPublish}
          customizationData={customizationData || {}}
        />
      ) : (
        <PublishScreen
          onBack={handleBackToPayment}
          customizationData={customizationData || {}}
        />
      )}
    </div>
  );
};
export default App;
