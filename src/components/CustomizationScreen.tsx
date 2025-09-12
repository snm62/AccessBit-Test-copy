import React, { useState, useRef, useEffect } from "react";
import "../styles/customization.css";
import iro from "@jaames/iro"; // Import iro.js
const previewarea = new URL("../assets/preview-area.svg", import.meta.url).href;
const mobile = new URL("../assets/mobile.svg", import.meta.url).href;
const monitor = new URL("../assets/monitor.svg", import.meta.url).href;
const icon1 = new URL("../assets/icon1.svg", import.meta.url).href;
const icon2 = new URL("../assets/icon2.svg", import.meta.url).href;
const icon3 = new URL("../assets/icon3.svg", import.meta.url).href;
const icon4 = new URL("../assets/icon4.svg", import.meta.url).href;
const icon5 = new URL("../assets/icon5.svg", import.meta.url).href;
const icon6 = new URL("../assets/icon6.svg", import.meta.url).href;
const icon7 = new URL("../assets/icon7.svg", import.meta.url).href;
const icon8 = new URL("../assets/icon8.svg", import.meta.url).href;
const iconArray = [icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8];
const whitearrow = new URL("../assets/→.svg", import.meta.url).href;

type CustomizationScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

const CustomizationScreen: React.FC<CustomizationScreenProps> = ({ onBack, onNext }) => {
  const [isDesktopView, setIsDesktopView] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Customization state
  const [interfaceLeadColor, setInterfaceLeadColor] = useState("#FFFFFF");
  const [accessibilityStatementLink, setAccessibilityStatementLink] = useState("");
  const [interfaceFooterContent, setInterfaceFooterContent] = useState("");
  const [interfaceLanguage, setInterfaceLanguage] = useState("German");
  const [interfacePosition, setInterfacePosition] = useState("Left");
  const [triggerButtonColor, setTriggerButtonColor] = useState("#FFFFFF");
  const [triggerHorizontalPosition, setTriggerHorizontalPosition] = useState("Left");
  const [triggerVerticalPosition, setTriggerVerticalPosition] = useState("Bottom");
  const [triggerButtonSize, setTriggerButtonSize] = useState("Medium");
  const [triggerButtonShape, setTriggerButtonShape] = useState("Circle");
  const [triggerHorizontalOffset, setTriggerHorizontalOffset] = useState("0px");
  const [hideTriggerButton, setHideTriggerButton] = useState("No");
  const [triggerVerticalOffset, setTriggerVerticalOffset] = useState("0px");
  const [selectedIcon, setSelectedIcon] = useState("accessibility");
  const [showOnMobile, setShowOnMobile] = useState("Show");
  const [mobileTriggerHorizontalPosition, setMobileTriggerHorizontalPosition] = useState("Left");
  const [mobileTriggerVerticalPosition, setMobileTriggerVerticalPosition] = useState("Button");
  const [mobileTriggerSize, setMobileTriggerSize] = useState("Medium");
  const [mobileTriggerShape, setMobileTriggerShape] = useState("Round");
  const [mobileTriggerHorizontalOffset, setMobileTriggerHorizontalOffset] = useState("3");
  const [mobileTriggerVerticalOffset, setMobileTriggerVerticalOffset] = useState("3");

  // colorpicker
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [btnColor, setBtnColor] = useState("#C9C9C9");
  const [btnOpen, setBtnOpen] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const pickerInstance = useRef<any>(null);
  const btnPickerInstance = useRef<any>(null);
  const btnDropdownRef = useRef<HTMLDivElement | null>(null);

  const btnPickerRef = useRef<HTMLDivElement | null>(null);

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
      btnPickerInstance.current.on("color:change", (newColor: any) => setBtnColor(newColor.hexString));
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
    { label: "Center", value: "Center" },
  ];

  const verticalPositionOptions = [
    { label: "Top", value: "Top" },
    { label: "Bottom", value: "Bottom" },
    { label: "Middle", value: "Middle" },
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
    { label: "Bottom", value: "Bottom" },
    { label: "Button", value: "Button" },
  ];

  const mobileShapeOptions = [
    { label: "Round", value: "Round" },
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

  // Icon options
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

  const handleNext = () => {
    onNext();
  };

  const handleBack = () => {
    onBack();
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
      {/* Header */}
      <div className="customization-header">
        <div className="app-name">ContrastKit</div>
        <div className="header-buttons">
          <button className="back-btn" onClick={handleBack}>
            <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <button className="next-btn" onClick={handleNext}>
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

                <div className="form-group">
                  <label>Interface language</label>
                  <div className="custom-select-container">
                    {renderDropdown("interfaceLanguage", "", interfaceLanguage, languageOptions, setInterfaceLanguage)}
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Customizing accessWidget Trigger</h3>

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
                    {renderDropdown("triggerVerticalPosition", "", triggerVerticalPosition, verticalPositionOptions, setTriggerVerticalPosition)}
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
                    {renderDropdown("triggerButtonShape", "", triggerButtonShape, shapeOptions, setTriggerButtonShape)}
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
                    {renderDropdown("triggerHorizontalPosition", "", triggerHorizontalPosition, positionOptions, setTriggerHorizontalPosition)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Horizontal Offset</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerHorizontalOffset", "", triggerHorizontalOffset, offsetOptions, setTriggerHorizontalOffset)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Trigger Vertical Offset</label>
                  <div className="custom-select-container">
                    {renderDropdown("triggerVerticalOffset", "", triggerVerticalOffset, offsetOptions, setTriggerVerticalOffset)}
                  </div>
                </div>
              </div>

              <div className="trigger-icon-section">
                <h3>Trigger Button icon</h3>
                <div className="icon-grid">
                  {iconOptions.map((icon) => (
                    <div
                      key={icon.id}
                      className={`icon-option ${selectedIcon === icon.id ? 'selected' : ''}`}
                      onClick={() => setSelectedIcon(icon.id)}
                    >
                      <img src={icon.label} alt={icon.name} className="icon-symbol" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Customizing accessWidget for mobile</h3>

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
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerHorizontalOffset", "", mobileTriggerHorizontalOffset, mobileOffsetOptions, setMobileTriggerHorizontalOffset)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Trigger Vertical Offset</label>
                  <div className="custom-select-container">
                    {renderDropdown("mobileTriggerVerticalOffset", "", mobileTriggerVerticalOffset, mobileOffsetOptions, setMobileTriggerVerticalOffset)}
                  </div>
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
              <div className="preview-window desktop-preview"></div>
            ) : (
              <div className="preview-window mobile-preview"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationScreen;
