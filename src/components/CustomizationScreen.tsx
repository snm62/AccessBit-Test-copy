import React, { useState, useRef, useEffect } from "react";
import "../styles/customization.css";
import iro from "@jaames/iro"; // Import iro.js
const previewarea = new URL("../assets/preview-area.svg", import.meta.url).href;
const mobile = new URL("../assets/mobile.svg", import.meta.url).href;
const monitor = new URL("../assets/monitor.svg", import.meta.url).href;
const whitearrow = new URL("../assets/→.svg", import.meta.url).href;
const icon1 = new URL("../assets/Accessibility.webp", import.meta.url).href;

type CustomizationData = {
  selectedIcon: string;
  triggerButtonColor: string;
  triggerButtonShape: string;
  triggerHorizontalPosition: string;
  triggerVerticalPosition: string;
  triggerButtonSize: string;
  interfaceLanguage: string;
};

type CustomizationScreenProps = {
  onBack: () => void;
  onNext: (customizationData: any) => void;
  existingCustomizationData?: any;
  isLoadingExistingData?: boolean;
};
const CustomizationScreen: React.FC<CustomizationScreenProps> = ({ onBack, onNext, existingCustomizationData, isLoadingExistingData = false }) => {
  const [isDesktopView, setIsDesktopView] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Customization state
  const [interfaceLeadColor, setInterfaceLeadColor] = useState("#FFFFFF");
  const [accessibilityStatementLink, setAccessibilityStatementLink] = useState("");
  const [interfaceFooterContent, setInterfaceFooterContent] = useState("");
  const [interfaceLanguage, setInterfaceLanguage] = useState("English");
  const [interfacePosition, setInterfacePosition] = useState("Left");
  const [triggerVerticalPosition, setTriggerVerticalPosition] = useState("Bottom");
  const [triggerButtonSize, setTriggerButtonSize] = useState("Medium");
  const [triggerButtonShape, setTriggerButtonShape] = useState("Circle");
  const [triggerHorizontalOffset, setTriggerHorizontalOffset] = useState("0px");
  const [hideTriggerButton, setHideTriggerButton] = useState("No");
  const [triggerVerticalOffset, setTriggerVerticalOffset] = useState("3px");
  const [triggerHorizontalPosition, setTriggerHorizontalPosition] = useState("Left");
  const [btnColor, setBtnColor] = useState("#007bff");
  const [showOnMobile, setShowOnMobile] = useState("Show");
  const [mobileTriggerHorizontalPosition, setMobileTriggerHorizontalPosition] = useState("Left");
  const [mobileTriggerVerticalPosition, setMobileTriggerVerticalPosition] = useState("Bottom");
  const [mobileTriggerSize, setMobileTriggerSize] = useState("Medium");
  const [mobileTriggerShape, setMobileTriggerShape] = useState("Rounded");
  const [mobileTriggerHorizontalOffset, setMobileTriggerHorizontalOffset] = useState("3");
  const [mobileTriggerVerticalOffset, setMobileTriggerVerticalOffset] = useState("3");

  // colorpicker
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [btnOpen, setBtnOpen] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const pickerInstance = useRef<any>(null);
  const btnPickerInstance = useRef<any>(null);
  const btnDropdownRef = useRef<HTMLDivElement | null>(null);

  const btnPickerRef = useRef<HTMLDivElement | null>(null);
  

  // Load existing customization data when component mounts
  useEffect(() => {
    console.log("CustomizationScreen mounted, existingCustomizationData:", existingCustomizationData);
    if (existingCustomizationData) {
      console.log("Loading existing customization data:", existingCustomizationData);
      setInterfaceLeadColor(existingCustomizationData.interfaceLeadColor || "#FFFFFF");
      setAccessibilityStatementLink(existingCustomizationData.accessibilityStatementLink || "");
      setInterfaceFooterContent(existingCustomizationData.interfaceFooterContent || "");
      setInterfacePosition(existingCustomizationData.interfacePosition || "Left");
      setTriggerVerticalPosition(existingCustomizationData.triggerVerticalPosition || "Bottom");
      setTriggerButtonSize(existingCustomizationData.triggerButtonSize || "Medium");
      setTriggerButtonShape(existingCustomizationData.triggerButtonShape || "Circle");
      setTriggerHorizontalOffset(existingCustomizationData.triggerHorizontalOffset || "0px");
      setHideTriggerButton(existingCustomizationData.hideTriggerButton || "No");
      setTriggerVerticalOffset(existingCustomizationData.triggerVerticalOffset || "0px");
      setTriggerHorizontalPosition(existingCustomizationData.triggerHorizontalPosition || "Left");
      setBtnColor(existingCustomizationData.triggerButtonColor || "#007bff");
      setShowOnMobile(existingCustomizationData.showOnMobile || "Show");
      setMobileTriggerHorizontalPosition(existingCustomizationData.mobileTriggerHorizontalPosition || "Left");
      setMobileTriggerVerticalPosition(existingCustomizationData.mobileTriggerVerticalPosition || "Bottom");
      setMobileTriggerSize(existingCustomizationData.mobileTriggerSize || "Medium");
      setMobileTriggerShape(existingCustomizationData.mobileTriggerShape || "Rounded");
      setMobileTriggerHorizontalOffset(existingCustomizationData.mobileTriggerHorizontalOffset || "0");
      setMobileTriggerVerticalOffset(existingCustomizationData.mobileTriggerVerticalOffset || "0");
      setInterfaceLanguage(existingCustomizationData.interfaceLanguage || "English");
    }
  }, [existingCustomizationData]);

 
  useEffect(() => {
    if (!pickerInstance.current && colorPickerRef.current) {
      pickerInstance.current = iro.ColorPicker(colorPickerRef.current, {
        width: 100,
        color: color,
        borderWidth: 2,
        borderColor: "#ccc",
      });

      pickerInstance.current.on("color:change", (newColor: any) => {
        setColor(newColor.hexString);
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && pickerInstance.current) {
      pickerInstance.current.color.set(color);
    }
  }, [isOpen]);

  useEffect(() => {

    if (!btnPickerInstance.current && btnPickerRef.current) {
      btnPickerInstance.current = iro.ColorPicker(btnPickerRef.current, { width: 100, color: btnColor, borderWidth: 2, borderColor: "#ccc" });
      btnPickerInstance.current.on("color:change", (newColor: any) => handleColorChange(newColor.hexString));
    }
  }, [])
  useEffect(() => {
    // Sync picker color with state when dropdown opens
    if (btnOpen && btnPickerInstance.current) btnPickerInstance.current.color.set(btnColor);
  }, [btnOpen])

  useEffect(() => {
    // Handle click outside to close dropdowns
    function handleClickOutside(event: MouseEvent) {
      if (
        btnOpen &&
        btnDropdownRef.current &&
        !btnDropdownRef.current.contains(event.target as Node) &&
        btnPickerRef.current &&
        !btnPickerRef.current.contains(event.target as Node)
      ) {
        setBtnOpen(false);
      }
    }

    if (btnOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [btnOpen]);


  const dropdownRefs = {
    interfaceLanguage: useRef<HTMLDivElement>(null),
    interfacePosition: useRef<HTMLDivElement>(null),
    triggerHorizontalPosition: useRef<HTMLDivElement>(null),
    triggerVerticalPosition: useRef<HTMLDivElement>(null),
    triggerButtonSize: useRef<HTMLDivElement>(null),
    triggerButtonShape: useRef<HTMLDivElement>(null),
    triggerHorizontalOffset: useRef<HTMLDivElement>(null),
    hideTriggerButton: useRef<HTMLDivElement>(null),
    triggerVerticalOffset: useRef<HTMLDivElement>(null),
    showOnMobile: useRef<HTMLDivElement>(null),
    mobileTriggerHorizontalPosition: useRef<HTMLDivElement>(null),
    mobileTriggerVerticalPosition: useRef<HTMLDivElement>(null),
    mobileTriggerSize: useRef<HTMLDivElement>(null),
    mobileTriggerShape: useRef<HTMLDivElement>(null),
    mobileTriggerHorizontalOffset: useRef<HTMLDivElement>(null),
    mobileTriggerVerticalOffset: useRef<HTMLDivElement>(null),
  };

  // Dropdown options
  const languageOptions = [
    { label: "German", value: "German" },
    { label: "English", value: "English" },
    { label: "Spanish", value: "Spanish" },
    { label: "French", value: "French" },
  ];

  const positionOptions = [
    { label: "Left", value: "Left" },
    { label: "Right", value: "Right" },
  ];

  const verticalPositionOptions = [
    { label: "Top", value: "Top" },   
    { label: "Middle", value: "Middle" },
    { label: "Bottom", value: "Bottom" },
  ];

  const sizeOptions = [
    { label: "Small", value: "Small" },
    { label: "Medium", value: "Medium" },
    { label: "Large", value: "Large" },
  ];

  const shapeOptions = [
    { label: "Circle", value: "Circle" },
    { label: "Square", value: "Square" },
    { label: "Rounded", value: "Rounded" },
  ];

  const offsetOptions = [
    { label: "0px", value: "0px" },
    { label: "5px", value: "5px" },
    { label: "10px", value: "10px" },
    { label: "15px", value: "15px" },
    { label: "20px", value: "20px" },
  ];

  const yesNoOptions = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ];

  const showOptions = [
    { label: "Show", value: "Show" },
    { label: "Hide", value: "Hide" },
  ];

  const mobileVerticalPositionOptions = [
    { label: "Top", value: "Top" },
    { label: "Middle", value: "Middle" },
    { label: "Bottom", value: "Bottom" },
  ];

  const mobileShapeOptions = [
    { label: "Rounded", value: "Rounded" },
    { label: "Square", value: "Square" },
    { label: "Circle", value: "Circle" },
  ];

  const mobileOffsetOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
  ];


  const getLabel = (opts: any[], val: string) =>
    (opts.find((o) => o.value === val) || {}).label || val;

  // Handle click outside for custom dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      Object.entries(dropdownRefs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          if (openDropdown === key) setOpenDropdown(null);
        }
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleNextPayment = async () => {
    console.log('🚨🚨🚨 FORCE RELOAD TEST - This should show if changes are applied');
    try {
      const customizationData = {
        // Map your state variables to the customization object
        triggerButtonColor: btnColor,
        triggerButtonShape: triggerButtonShape,
        triggerButtonSize: triggerButtonSize,
        triggerHorizontalPosition: triggerHorizontalPosition,
        triggerVerticalPosition: triggerVerticalPosition,
        triggerHorizontalOffset: triggerHorizontalOffset,
        triggerVerticalOffset: triggerVerticalOffset,
        hideTriggerButton: hideTriggerButton,
        interfaceLeadColor: interfaceLeadColor,
        interfacePosition: interfacePosition,
        interfaceLanguage: interfaceLanguage,
        selectedIcon: 'accessibility', // Default icon
        selectedIconName: 'Accessibility', // Default icon name
        showOnMobile: showOnMobile,
        mobileTriggerButtonColor: btnColor, // Use same color as desktop
        mobileTriggerShape: mobileTriggerShape,
        mobileTriggerSize: mobileTriggerSize,
        mobileTriggerHorizontalPosition: mobileTriggerHorizontalPosition,
        mobileTriggerVerticalPosition: mobileTriggerVerticalPosition,
        mobileTriggerHorizontalOffset: mobileTriggerHorizontalOffset,
        mobileTriggerVerticalOffset: mobileTriggerVerticalOffset,
        accessibilityStatementLink: accessibilityStatementLink,
        interfaceFooterContent: interfaceFooterContent
      };
      
      // Navigate to next page - PaymentScreen will be shown first
      console.log('🔥🔥🔥 PAYMENT NAVIGATION: Passing data to PaymentScreen:', customizationData);
      console.log('🔥🔥🔥 PAYMENT NAVIGATION: Calling onNext with data');
      onNext(customizationData);
    } catch (error) {
      console.error('Error preparing customization data:', error);
      alert('An error occurred while preparing data. Please try again.');
    }
  };

  // Helper function for site ID
  const getCurrentSiteId = async () => {
    console.log('🔍 CustomizationScreen: Getting site ID...');
    const urlParams = new URLSearchParams(window.location.search);
    const urlSiteId = urlParams.get('siteId');
    
    // Check the correct sessionStorage key used by the auth system (new key with legacy fallback)
    const contrastkitUserInfo = sessionStorage.getItem('accessbit-userinfo') || sessionStorage.getItem('accessbit-userinfo');
    let sessionSiteId = null;
    if (contrastkitUserInfo) {
      try {
        const userData = JSON.parse(contrastkitUserInfo);
        sessionSiteId = userData.siteId;
        console.log('🔍 CustomizationScreen: Found siteId in userinfo:', sessionSiteId);
      } catch (error) {
        console.log('🔍 CustomizationScreen: Error parsing userinfo:', error);
      }
    }
    
    // Also check the old keys for backward compatibility
    const oldSessionSiteId = sessionStorage.getItem('accessibility_site_id');
    const localSiteId = localStorage.getItem('accessibility_site_id');
    
    console.log('🔍 CustomizationScreen: URL siteId:', urlSiteId);
    console.log('🔍 CustomizationScreen: Session siteId:', sessionSiteId);
    console.log('🔍 CustomizationScreen: Session siteId (old):', oldSessionSiteId);
    console.log('🔍 CustomizationScreen: Local siteId:', localSiteId);
    
    // If we have a URL siteId, use it (this comes from domain lookup)
    if (urlSiteId) {
      console.log('🔍 CustomizationScreen: Using URL siteId (from domain lookup):', urlSiteId);
      return urlSiteId;
    }
    
    // If no URL siteId, try to get it from domain lookup
    if (sessionSiteId) {
      try {
        console.log('🔍 CustomizationScreen: Attempting domain lookup for siteId consistency...');
        const response = await fetch(`https://accessibility-widget.web-8fb.workers.dev/api/accessibility/domain-lookup?domain=${window.location.hostname}`);
        if (response.ok) {
          const domainData = await response.json();
          if (domainData.siteId) {
            console.log('🔍 CustomizationScreen: Domain lookup found siteId:', domainData.siteId);
            return domainData.siteId;
          }
        }
      } catch (error) {
        console.log('🔍 CustomizationScreen: Domain lookup failed:', error);
      }
    }
    
    // Fallback to sessionStorage
    const siteId = sessionSiteId || oldSessionSiteId || localSiteId;
    console.log('🔍 CustomizationScreen: Final siteId (fallback):', siteId);
    return siteId;
  };


  // Load customization data function
  const loadCustomizationData = async (siteId: string) => {
    try {
      console.log('🌐 CustomizationScreen: Making API request to:', `https://accessibility-widget.web-8fb.workers.dev/api/accessibility/config?siteId=${siteId}`);
      const response = await fetch(`https://accessibility-widget.web-8fb.workers.dev/api/accessibility/config?siteId=${siteId}`);
      
      console.log('📡 CustomizationScreen: API response status:', response.status);
      console.log('📡 CustomizationScreen: API response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 CustomizationScreen: Full API response data:', data);
        console.log('📊 CustomizationScreen: Customization data:', data.customization);
        return data.customization;
      } else {
        const errorText = await response.text();
        console.error('❌ CustomizationScreen: Failed to load customization data:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ CustomizationScreen: Error loading customization data:', error);
      return null;
    }
  };

  const handleBack = () => {
    onBack();
  };



  const handleColorChange = (color: string) => {
    setBtnColor(color);
  };

  const handleShapeChange = (shape: string) => {
    setTriggerButtonShape(shape);
  };

  const handlePositionChange = (position: string) => {
    setTriggerHorizontalPosition(position);
  };

  const handleVerticalPositionChange = (position: string) => {
    setTriggerVerticalPosition(position);
  };

  const renderDropdown = (
    type: string,
    label: string,
    value: string,
    options: any[],
    onPick: (val: string) => void
  ) => (
    <div className="form-group">
      <label>{label}</label>
      <div className={`custom-select ${openDropdown === type ? "open" : ""}`} ref={dropdownRefs[type as keyof typeof dropdownRefs]}>
        <div
          className="selected"
          onClick={() =>
            setOpenDropdown(openDropdown === type ? null : type)
          }
        >
          <span>{getLabel(options, value)}</span>
          <svg className="dropdown-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {openDropdown === type && (
          <ul className="options">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onPick(opt.value);
                  setOpenDropdown(null);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );


  return (
    <div className="customization-screen">
      {/* Loading indicator for existing data */}
      {isLoadingExistingData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
       {/*<div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px' }}>Loading your existing settings...</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we fetch your customization data</div>
          </div>*/}
        </div>
      )}
      
      {/* Header */}
      <div className="customization-header">
        <div className="app-name"></div>
        <div className="header-buttons">
          <button className="back-btn" onClick={handleBack}>
            <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
                <button className="next-btn" onClick={handleNextPayment}>
            Next <img src={whitearrow} alt="" />
          </button>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        <div className="step active">
          <span className="step-number">STEP 1</span>
          <span className="step-name">Customization</span>
        </div>
        <div className="step">
          <span className="step-number">STEP 2</span>
          <span className="step-name">Payment</span>
        </div>
        <div className="step">
          <span className="step-number">STEP 3</span>
          <span className="step-name">Publish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Customization Options */}
        <div className="left-panel">
          <div className="panel-content">
            <div className="section">
              <h3>Customization AccessWidget Interface</h3>

              <div className="interface-grid">
                {/* <div className="form-group">
                      <label>Interface Lead Color</label>
                      <div className="color-input-group">
                        <input
                          type="text"
                          value={interfaceLeadColor}
                          onChange={(e) => setInterfaceLeadColor(e.target.value)}
                          className="color-input"
                        />
                      </div>
                    </div> */}

                <div className="form-group">
                  <label>Accessibility Statement Link</label>
                  <input
                    type="text"
                    placeholder="Link here."
                    value={accessibilityStatementLink}
                    onChange={(e) => setAccessibilityStatementLink(e.target.value)}
                  />
                </div>

                {/* <div className="form-group">
                      <label>Interface Footer Content</label>
                      <input
                        type="text"
                        placeholder="Link here."
                        value={interfaceFooterContent}
                        onChange={(e) => setInterfaceFooterContent(e.target.value)}
                      />
                    </div> */}

                {/*<div className="form-group">
                  <label>Interface language</label>
                  <div className="custom-select-container">
                    {renderDropdown("interfaceLanguage", "", interfaceLanguage, languageOptions, setInterfaceLanguage)}
                  </div>
                </div>*/}
                
              </div>
            </div>

            <div className="section">
              <h3>Customizing AccessWidget Trigger</h3>

              <div className="trigger-grid">
                <div className="form-group">
                  <div>
                    <label>Background Color</label>
                    <div className="color-picker-dropdown" ref={btnDropdownRef}>
                      <button className="color-picker-button" onClick={() => setBtnOpen(!btnOpen)}>
                        <span className="color-text">{btnColor}</span>
                        <div className="color-preview" style={{ backgroundColor: btnColor }}></div>
                      </button>
                      <div ref={btnPickerRef} className={`color-picker-container ${btnOpen ? "visible" : "hidden"}`}></div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Vertical Position</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerVerticalPosition", "", triggerVerticalPosition, verticalPositionOptions, handleVerticalPositionChange)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Button Size</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerButtonSize", "", triggerButtonSize, sizeOptions, setTriggerButtonSize)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Button Shape</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerButtonShape", "", triggerButtonShape, shapeOptions, handleShapeChange)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Hide Trigger Button</label>
                  <div className="custom-select-container">
                    {renderDropdown("hideTriggerButton", "", hideTriggerButton, yesNoOptions, setHideTriggerButton)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Horizontal Position</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerHorizontalPosition", "", triggerHorizontalPosition, positionOptions, handlePositionChange)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Horizontal Offset</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={triggerHorizontalOffset.replace('px', '')}
                    onChange={(e) => setTriggerHorizontalOffset(e.target.value + 'px')}
                    className="offset-input"
                  />
                </div>

                <div className="form-group">
                  <label>Trigger Vertical Offset</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={triggerVerticalOffset.replace('px', '')}
                    onChange={(e) => setTriggerVerticalOffset(e.target.value + 'px')}
                    className="offset-input"
                  />
                </div>
              </div>

            </div>

            <div className="section">
              <h3>Customizing AccessWidget for Mobile</h3>

              <div className="mobile-grid">
                <div className="form-group">
                  <label>Show On Mobile?</label>
                  <div className="custom-select-container">
                    {renderDropdown("showOnMobile", "", showOnMobile, showOptions, setShowOnMobile)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Horizontal Position</label>
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerHorizontalPosition", "", mobileTriggerHorizontalPosition, positionOptions, setMobileTriggerHorizontalPosition)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Vertical Position</label>
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerVerticalPosition", "", mobileTriggerVerticalPosition, mobileVerticalPositionOptions, setMobileTriggerVerticalPosition)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Size</label>
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerSize", "", mobileTriggerSize, sizeOptions, setMobileTriggerSize)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Mobile Shape</label>
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerShape", "", mobileTriggerShape, mobileShapeOptions, setMobileTriggerShape)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Horizontal Offset</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={mobileTriggerHorizontalOffset}
                    onChange={(e) => setMobileTriggerHorizontalOffset(e.target.value)}
                    className="offset-input"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Vertical Offset</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={mobileTriggerVerticalOffset}
                    onChange={(e) => setMobileTriggerVerticalOffset(e.target.value)}
                    className="offset-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="right-panel">
          <div className="preview-header">
            <h3>Preview</h3>
            <div className="device-selector">
              <button
                className={`device-btn ${isDesktopView ? 'active' : ''}`}
                onClick={() => setIsDesktopView(true)}
              >
                <img src={monitor} alt="" />
              </button>
              <button
                className={`device-btn ${!isDesktopView ? 'active' : ''}`}
                onClick={() => setIsDesktopView(false)}
              >
                <img src={mobile} alt="" />
              </button>
            </div>
          </div>

          <div style={{ padding: "10px" }}>
            {isDesktopView ? (
              <div className="preview-window desktop-preview">
                <div className="browser-window">
                  <div className="browser-controls">
                    <div className="traffic-lights">
                      <div className="traffic-light red"></div>
                      <div className="traffic-light yellow"></div>
                      <div className="traffic-light green"></div>
                    </div>
                  </div>
                  <div className="browser-content">
                    {hideTriggerButton === 'No' && (
                      <div
                        className="accessibility-widget"
                        style={{
                          left: triggerHorizontalPosition === 'Left' ?
                            `calc(9px + ${parseInt(triggerHorizontalOffset)* 0.2}px)` :
                            triggerHorizontalPosition === 'Right' ? 'auto' : '50%',
                          right: triggerHorizontalPosition === 'Right' ?
                            `calc(9px + ${parseInt(triggerHorizontalOffset)* 0.2}px)` : 'auto',
                          top: triggerVerticalPosition === 'Top' ?
                            `calc(9px + ${parseInt(triggerVerticalOffset) * 0.2}px)` : 'auto',
                          bottom: triggerVerticalPosition === 'Bottom' ?
                            `calc(9px + ${parseInt(triggerVerticalOffset) * 0.2}px)` : 'auto',
                          transform: triggerHorizontalPosition === 'Center' ?
                            (triggerVerticalPosition === 'Middle' ? 'translateX(-50%)' : 'translateX(-50%)') :
                            (triggerVerticalPosition === 'Middle' ? 'translateY(-13%)' : 'none')
                        }}
                      >
                        <div
                          className={`widget-trigger ${triggerButtonShape.toLowerCase()} ${triggerButtonSize.toLowerCase()}`}
                          style={{ backgroundColor: btnColor }}
                        >
                          <img
                            src={icon1}
                            alt="Accessibility Icon"
                            className="widget-icon"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-window mobile-preview">
                <div className="mobile-browser-window">
                  <div className="mobile-browser-content">
                    {showOnMobile === 'Show' && (
                      <div
                        className="mobile-trigger-widget"
                        style={{
                          left: mobileTriggerHorizontalPosition === 'Left' ?
                            `calc(8px + ${parseInt(mobileTriggerHorizontalOffset)}px)` :
                            mobileTriggerHorizontalPosition === 'Right' ? 'auto' : '50%',
                          right: mobileTriggerHorizontalPosition === 'Right' ?
                            `calc(8px + ${parseInt(mobileTriggerHorizontalOffset)}px)` : 'auto',
                          top: mobileTriggerVerticalPosition === 'Top' ?
                            `calc(10px + ${parseInt(mobileTriggerVerticalOffset)}px)` :
                            mobileTriggerVerticalPosition === 'Middle' ? '50%' : 'auto',
                          bottom: mobileTriggerVerticalPosition === 'Bottom' ?
                            `calc(10px + ${parseInt(mobileTriggerVerticalOffset)}px)` : 'auto',
                          transform: mobileTriggerHorizontalPosition === 'Center' ?
                            (mobileTriggerVerticalPosition === 'Middle' ? 'translateX(-50%)' : 'translateX(-50%)') :
                            (mobileTriggerVerticalPosition === 'Middle' ? 'translateY(-50%)' : 'none')
                        }}
                      >
                        <div
                          className={`mobile-widget-trigger ${mobileTriggerShape === 'Rounded' ? 'round' : mobileTriggerShape.toLowerCase()} ${mobileTriggerSize.toLowerCase()}`}
                          style={{ backgroundColor: btnColor }}
                        >
                          <img
                            src={icon1}
                            alt="Accessibility Icon"
                            className="mobile-widget-icon"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomizationScreen;
