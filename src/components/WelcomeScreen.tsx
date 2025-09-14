import React, { useState, useEffect } from "react";
import "../styles/welcomescreen.css";
const leftLines = new URL("../assets/leftlines.svg", import.meta.url).href;
const rightLines = new URL("../assets/rightlines.svg", import.meta.url).href;


type WelcomeScreenProps = {
  onAuthorize: () => void;
  onNeedHelp: () => void;
  authenticated?:boolean;
  handleWelcomeScreen: () => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onAuthorize, onNeedHelp ,authenticated,handleWelcomeScreen}) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasUserData, setHasUserData] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    // Check for user authentication data in sessionStorage and authenticated prop
    const checkUserAuth = () => {
      const userinfo = sessionStorage.getItem("contrastkit-userinfo");
      const hasData = userinfo && userinfo !== "null" && userinfo !== "undefined";
      // User has data if either authenticated prop is true OR sessionStorage has data
      setHasUserData(authenticated || !!hasData);
    };

    // Set a 2-second delay before showing the actual buttons
    const timer = setTimeout(() => {
      checkUserAuth();
      setIsCheckingAuth(false);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []); // Remove authenticated from dependencies to prevent re-running

  // Separate useEffect to handle authentication changes
  useEffect(() => {
    if (authenticated) {
      setHasUserData(true);
      setIsAuthorizing(false);
    }
  }, [authenticated]);

  const handleAuthorizeClick = () => {
    setIsAuthorizing(true);
    onAuthorize();
  };

   return (
    <div className="welcome-screen">
      <div className="welcome-main-content">
        {/* Background line images - commented out until assets are added */}
        <img src={leftLines} alt="" className="welcome-bg-lines-left" />
        <img src={rightLines} alt="" className="welcome-bg-lines-right" />
        {/* Main content */}
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome to{" "}
            <span className="welcome-title-highlight">ContrastKit</span>
          </h1>
          {isCheckingAuth ? (
            <p className="welcome-instructions">
              Checking your authentication status...
            </p>
          ) : isAuthorizing ? (
            <p className="welcome-instructions">
              Please complete the authorization process in the popup window...
            </p>
          ) : hasUserData ? (
            <p className="welcome-instructions">
              Click on Next and customize your widget and publish when you are ready.
            </p>
          ) : (
            <p className="welcome-instructions">
              The authorization process appears to be incomplete. To continue with the next step, please ensure that all necessary authorization steps have been successfully carried out.
            </p>
          )}
          {isCheckingAuth ? (
            <button className="welcome-authorize-btn" disabled>
              Loading...
            </button>
          ) : isAuthorizing ? (
            <button className="welcome-authorize-btn" disabled>
              Authorizing...
            </button>
          ) : hasUserData ? (
            <button
              className="welcome-authorize-btn scan-project"
              onClick={handleWelcomeScreen}
            >
              Next
            </button>
          ) : (
            <button className="welcome-authorize-btn" onClick={handleAuthorizeClick}>
              Authorize
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
