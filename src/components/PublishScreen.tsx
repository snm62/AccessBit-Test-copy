import React, { useState } from "react";
import { useAuth } from "../hooks/userAuth";
import "../styles/publish.css";
const whitearrow = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
  <path d="M0.756 8.59012V6.62812H10.314L5.598 2.30812L6.948 0.940125L13.356 6.97012V8.23012L6.948 14.2601L5.58 12.8741L10.278 8.59012H0.756Z" fill="white"/>
</svg>`);
// Accessibility icon as data URL (Font Awesome 5 style: ring + figure)
const icon1 = new URL("../assets/Accessibility.webp", import.meta.url).href;
const icon2 = new URL("../assets/icon2.svg", import.meta.url).href;
const icon3 = new URL("../assets/icon3.svg", import.meta.url).href;
const icon4 = new URL("../assets/icon4.svg", import.meta.url).href;
const icon5 = new URL("../assets/icon5.svg", import.meta.url).href;
const icon6 = new URL("../assets/icon6.svg", import.meta.url).href;
const icon7 = new URL("../assets/icon7.svg", import.meta.url).href;
const icon8 = new URL("../assets/icon8.svg", import.meta.url).href;

// Icon options matching CustomizationScreen
const iconOptions = [
  { id: "accessibility", label: icon1, name: "Accessibility" },
  { id: "person", label: icon2, name: "Person" },
  { id: "wheelchair", label: icon3, name: "Wheelchair" },
  { id: "ad", label: icon4, name: "AD" },
  { id: "eye", label: icon5, name: "Eye" },
  { id: "ramp", label: icon6, name: "Ramp" },
  { id: "gear", label: icon7, name: "Gear" },
  { id: "ad-triple", label: icon8, name: "AD)))" },
];

type CustomizationData = {
  selectedIcon: string;
  triggerButtonColor: string;
  triggerButtonShape: string;
  triggerHorizontalPosition: string;
  triggerVerticalPosition: string;
  triggerButtonSize: string;
};

type PublishScreenProps = {
  onBack: () => void;
  customizationData?: any;
};

const PublishScreen: React.FC<PublishScreenProps> = ({ onBack, customizationData }) => {
  const { publishSettings, user, sessionToken, registerAccessibilityScript, applyAccessibilityScript, injectScriptToWebflow } = useAuth();
  const [showModal, setShowModal] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | false>(false);
  const [accessibilityProfiles, setAccessibilityProfiles] = useState({
    seizureSafe: false,
    visionImpaired: false,
    adhdFriendly: false,
    cognitiveDisability: false,
    keyboardNavigation: false,
    blindUsers: false,
  });

  const handleToggle = (profile: keyof typeof accessibilityProfiles) => {
    setAccessibilityProfiles(prev => ({
      ...prev,
      [profile]: !prev[profile]
    }));
  };


  const handlePublish = () => {
    setPublishSuccess(false);
    setPublishError(null);
    setShowPublishModal(true);
  };
const handleConfirmPublish = async () => {

  setIsPublishing(true);
  setPublishError(null);
  setPublishSuccess(false);
  
  try {

    
    // Step 1: Publish settings to KV store

    const publishResult = await publishSettings(customizationData, accessibilityProfiles);

    // Step 2: Handle script registration

    const registerResult = await registerAccessibilityScript();
   
    
    // Determine success message based on result
    let successMessage = '';
    
    if (registerResult.success) {
      if (!registerResult.skipApplyScript) {
        const applyData = {
          targetType: 'site' as const,
          scriptId: registerResult.result?.id,
          location: 'header' as const,
          version: '1.0.0'
        };
        const applyResult = await applyAccessibilityScript(applyData);

        
        if (applyResult.success) {
          successMessage = 'Settings published! Script has been registered and applied to your site.';
        } else {
          setPublishError('Settings published, but failed to apply script. Please try again.');
          return;
        }
      } else {
        successMessage = 'Settings published! Script is already active on your site.';
      }
    } else {
      setPublishError('Settings published, but failed to register script. Please try again.');
      return;
    }
    
    
    
    // Set success message immediately
    setPublishSuccess(successMessage);

    
    setShowPublishModal(false);
    
    // Clear success message after 8 seconds
    setTimeout(() => {
    
      setPublishSuccess(false);
    }, 8000);
    
  } catch (error) {
   
    const errorMessage = error instanceof Error ? error.message : "Failed to publish settings";
    setPublishError(errorMessage);
  } finally {
    setIsPublishing(false);
    
  }
};

  const handleCancelPublish = () => {
    setShowPublishModal(false);
  };


  const handleReset = () => {
    setAccessibilityProfiles({
      seizureSafe: false,
      visionImpaired: false,
      adhdFriendly: false,
      cognitiveDisability: false,
      keyboardNavigation: false,
      blindUsers: false,
    });
  };

  const handleHideInference = () => {
    setShowModal(false);
  };

  return (
    <div className="publish-screen">
      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="publish-modal-overlay">
          <div className="publish-modal">
            <div className="publish-modal-content">
              <p>We are installing the script in your site custom code.</p>
              <p>Click confirm to proceed.</p>
              <div className="publish-modal-buttons">
                <button 
                  className="confirm-btn" 
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Confirm"}
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={handleCancelPublish}
                  disabled={isPublishing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="publish-header">
        <div className="app-logo">
          <span className="app-name"></span>
        </div>
        <div className="header-buttons">
          <button className="back-btn" onClick={onBack}>
            <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <button className="publish-btn" onClick={handlePublish}>
            Publish <img src={whitearrow} alt="" />
          </button>
        </div>
      </div>

      {/* Success Message */}
      {publishSuccess && (
        <div className="success-banner" style={{ 
          backgroundColor: '#e8f5e8', 
          color: '#2e7d32', 
          padding: '10px 20px', 
          margin: '10px 0',
          borderRadius: '4px',
          border: '1px solid #c8e6c9'
        }}>
          ✅ {typeof publishSuccess === 'string' ? publishSuccess : 'Accessibility settings published successfully!'}
        </div>
      )}

      


      {/* Step Navigation */}
      <div className="step-navigation">
        <div className="step completed">
          <span className="step-number">STEP 1</span>
          <span className="step-name">Customization</span>
        </div>
        <div className="step completed">
          <span className="step-number">STEP 2</span>
          <span className="step-name">Payment</span>
        </div>
        <div className="step active">
          <span className="step-number">STEP 3</span>
          <span className="step-name">Publish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h3>Preview</h3>
          </div>
          <div className="preview-window1">
            <div className="browser-window">
              <div className="browser-controls">
                <div className="traffic-lights">
                  <div className="traffic-light red"></div>
                  <div className="traffic-light yellow"></div>
                  <div className="traffic-light green"></div>
                </div>
              </div>
              <div className="browser-content">
                {/* Accessibility Modal */}
                {showModal && (
                  <div
                    className={`accessibility-modal ${customizationData?.triggerHorizontalPosition === 'Left' ? 'position-left' :
                      customizationData?.triggerHorizontalPosition === 'Right' ? 'position-right' : 'position-center'
                      }`}
                  >
                    <div className="modal-header">
                      <button className="close-btn" onClick={() => setShowModal(false)}>
                        ×
                      </button>
                      <h2>Accessibility Adjustments</h2>
                      <div className="modal-buttons">
                        <button className="modal-btn">
                          Reset Settings
                        </button>
                        <button className="modal-btn">
                          Hide Interface
                        </button>
                      </div>
                    </div>
                    <div className="modal-content">
                      <p className="modal-intro">Choose the right accessibility profile for you</p>
                      <div className="profile-list">
                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="seizureSafe"
                              checked={accessibilityProfiles.seizureSafe}
                              onChange={() => handleToggle('seizureSafe')}
                              disabled
                            />
                            <label htmlFor="seizureSafe" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>Seizure Safe Profile</h4>
                            <p>Clear flashes & reduces color</p>
                          </div>
                        </div>

                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="visionImpaired"
                              checked={accessibilityProfiles.visionImpaired}
                              onChange={() => handleToggle('visionImpaired')}
                              disabled
                            />
                            <label htmlFor="visionImpaired" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>Vision Impaired Profile</h4>
                            <p>Enhances website's visuals</p>
                          </div>
                        </div>

                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="adhdFriendly"
                              checked={accessibilityProfiles.adhdFriendly}
                              onChange={() => handleToggle('adhdFriendly')}
                              disabled
                            />
                            <label htmlFor="adhdFriendly" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>ADHD Friendly Profile</h4>
                            <p>ADHD Friendly Profile</p>
                          </div>
                        </div>

                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="cognitiveDisability"
                              checked={accessibilityProfiles.cognitiveDisability}
                              onChange={() => handleToggle('cognitiveDisability')}
                              disabled
                            />
                            <label htmlFor="cognitiveDisability" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>Cognitive Disability Profile</h4>
                            <p>Assists with reading & focusing</p>
                          </div>
                        </div>

                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="keyboardNavigation"
                              checked={accessibilityProfiles.keyboardNavigation}
                              onChange={() => handleToggle('keyboardNavigation')}
                              disabled
                            />
                            <label htmlFor="keyboardNavigation" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>Keyboard Navigation (Motor)</h4>
                            <p>Keyboard Navigation (Motor)</p>
                          </div>
                        </div>

                        <div className="profile-item">
                          <div className="toggle-switch">
                            <input
                              type="checkbox"
                              id="blindUsers"
                              checked={accessibilityProfiles.blindUsers}
                              onChange={() => handleToggle('blindUsers')}
                              disabled
                            />
                            <label htmlFor="blindUsers" className="toggle-label">
                              <span className="toggle-off">OFF</span>
                              <span className="toggle-on">ON</span>
                            </label>
                          </div>
                          <div className="profile-info">
                            <h4>Blind Users (Screen Reader)</h4>
                            <p>Optimize website for screen-readers</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Widget */}
                {customizationData?.hideTriggerButton !== 'Yes' && (
                  <div
                    className="accessibility-widget"
                    style={{
                      left: customizationData?.triggerHorizontalPosition === 'Left' ?
                        `calc(10px + ${parseInt(customizationData?.triggerHorizontalOffset || '0px')}px)` :
                        customizationData?.triggerHorizontalPosition === 'Right' ? 'auto' : '50%',
                      right: customizationData?.triggerHorizontalPosition === 'Right' ?
                        `calc(10px + ${parseInt(customizationData?.triggerHorizontalOffset || '0px')}px)` : 'auto',
                      top: customizationData?.triggerVerticalPosition === 'Top' ?
                        `calc(10px + ${parseInt(customizationData?.triggerVerticalOffset || '0px')}px)` : 'auto',
                      bottom: customizationData?.triggerVerticalPosition === 'Bottom' ?
                        `calc(10px + ${parseInt(customizationData?.triggerVerticalOffset || '0px')}px)` : 'auto',
                      transform: customizationData?.triggerHorizontalPosition === 'Center' ?
                        (customizationData?.triggerVerticalPosition === 'Middle' ? 'translateX(-50%)' : 'translateX(-50%)') :
                        (customizationData?.triggerVerticalPosition === 'Middle' ? 'translateY(-50%)' : 'none')
                    }}
                  >
                    <div
                      className={`widget-trigger ${customizationData?.triggerButtonShape?.toLowerCase() || 'circle'} ${customizationData?.triggerButtonSize?.toLowerCase() || 'medium'}`}
                      style={{ backgroundColor: customizationData?.triggerButtonColor || '#007bff' }}
                      onClick={() => setShowModal(!showModal)}
                    >
                      <img
                        src={iconOptions.find(icon => icon.id === customizationData?.selectedIcon)?.label || icon1}
                        alt="Accessibility Icon"
                        className="widget-icon"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishScreen;
