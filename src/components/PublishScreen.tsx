import React, { useState } from "react";
import "../styles/publish.css";
const whitearrow = new URL("../assets/→.svg", import.meta.url).href;

type PublishScreenProps = {
  onBack: () => void;
};

const PublishScreen: React.FC<PublishScreenProps> = ({ onBack }) => {
  const [showModal, setShowModal] = useState(true);
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
    console.log("Publishing with settings:", accessibilityProfiles);
    // Add publish logic here
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
      {/* Header */}
      <div className="publish-header">
        <div className="app-logo">
          <span className="app-name">App Name</span>
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

      {/* Step Navigation */}
      <div className="step-navigation">
        <div className="step completed">
          <span className="step-number">STEP 1</span>
          <span className="step-name">Customization</span>
        </div>
        <div className="step active">
          <span className="step-number">STEP 2</span>
          <span className="step-name">Publish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Preview */}
        <div className="left-panel">
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
                  <div className="accessibility-modal">
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
                            />
                            <label htmlFor="seizureSafe" className="toggle-label">
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
                            />
                            <label htmlFor="visionImpaired" className="toggle-label">
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
                            />
                            <label htmlFor="adhdFriendly" className="toggle-label">
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
                            />
                            <label htmlFor="cognitiveDisability" className="toggle-label">
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
                            />
                            <label htmlFor="keyboardNavigation" className="toggle-label">
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
                            />
                            <label htmlFor="blindUsers" className="toggle-label">
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
                <div className="accessibility-widget">
                  <div className="widget-trigger" onClick={() => setShowModal(!showModal)}>
                    ♿
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishScreen;
