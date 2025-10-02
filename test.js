class AccessibilityWidget {
constructor() {

        this.settings = {};

        this.contentScale = 100; // Start at 100% (normal size)

        this.fontSize = 100;

        this.lineHeight = 100;

        this.letterSpacing = 100;

        this.textMagnifierHandlers = new Map(); // Store event handler references

        this.originalLineHeight = null; // Store original line-height

        this.originalFontSizes = new Map(); // Store original font sizes to prevent compounding

        this.currentlyFocusedElement = null; // Track currently focused element for highlight focus
        this.isKeyboardNavigation = false; // Track if user is using keyboard navigation
        this.lastInteractionMethod = null; // Track last interaction method (keyboard/mouse)

        this.currentLanguage = this.getCurrentLanguage(); // Initialize current language

        this.translations = this.getTranslations(); // Initialize translations

        this.isOpeningDropdown = false; // Flag to prevent immediate close

        // Set the KV API URL for your worker
        this.kvApiUrl = 'https://accessibility-widget.web-8fb.workers.dev';
        console.log('Accessibility Widget: kvApiUrl set to:', this.kvApiUrl);

        console.log('Accessibility Widget: Initializing...');

        this.init();

    }



    async init() {

        this.addFontAwesome();

        this.addCSS(); // Load CSS from hosted URL

        // Check if interface should be hidden
        if (localStorage.getItem('accessibility-widget-hidden') === 'true') {
            console.log('[CK] Accessibility interface is hidden, not creating widget');
            return;
        }

        this.createWidget();

        this.loadSettings();
        
        // Load user settings from KV storage
        await this.loadSettingsFromKV();
        
        await this.fetchCustomizationData();
        
        // Restore saved language
        const savedLanguage = localStorage.getItem('accessibility-widget-language');
        if (savedLanguage) {
            console.log('[CK] init() - Restoring saved language:', savedLanguage);
            this.applyLanguage(savedLanguage);
        } else {
            console.log('[CK] init() - No saved language found, using default English');
            this.applyLanguage('English');
        }
        
        // Set up periodic refresh to check for customization updates
        this.setupCustomizationRefresh();
        

        // Delay binding events to ensure elements are created

        setTimeout(async () => {

            

            this.bindEvents();

            this.applySettings();

            

            // Fetch customization data from API

            //console.log('Accessibility Widget: Fetching customization data...');

            const customizationData = await this.fetchCustomizationData();

            if (customizationData && customizationData.customization) {

                console.log('Accessibility Widget: Applying customization data:', customizationData.customization);

                this.applyCustomizations(customizationData.customization);

            } else {

                console.log('Accessibility Widget: No customization data found from KV; keeping icon hidden until styles are available');

            }

            

            // Initialize keyboard shortcuts only if keyboard navigation is enabled

            if (this.settings['keyboard-nav']) {

                console.log('Accessibility Widget: Keyboard navigation enabled, initializing shortcuts...');

            this.initKeyboardShortcuts();

            } else {

                console.log('Accessibility Widget: Keyboard navigation disabled, shortcuts not initialized');

            }

            

            

            console.log('Accessibility Widget: Initialized successfully');

        }, 100);

    }



    bindEvents() {

        console.log('Accessibility Widget: Starting to bind events...');

        

        // Panel toggle functionality - using Shadow DOM

        const icon = this.shadowRoot.getElementById('accessibility-icon');

        const panel = this.shadowRoot.getElementById('accessibility-panel');

        const closeBtn = this.shadowRoot.getElementById('close-panel');

        

        console.log('Accessibility Widget: Found icon in Shadow DOM:', !!icon);

        console.log('Accessibility Widget: Found panel in Shadow DOM:', !!panel);

        console.log('Accessibility Widget: Found close button in Shadow DOM:', !!closeBtn);

        

        if (icon) {

            // Click event

            icon.addEventListener('click', () => {

                console.log('Accessibility Widget: Icon clicked, toggling panel');

                this.togglePanel();

                

                // Debug: Check panel state

                const panel = this.shadowRoot.getElementById('accessibility-panel');

                if (panel) {

                    console.log('Accessibility Widget: Panel found, current classes:', panel.className);

                    console.log('Accessibility Widget: Panel has active class:', panel.classList.contains('active'));

                    console.log('Accessibility Widget: Panel computed right position:', window.getComputedStyle(panel).right);

                } else {

                    console.error('Accessibility Widget: Panel not found after click!');

                }

            });
            // Add this in your init function after the existing code
// Add window resize listener for mobile responsiveness and screen scaling
window.addEventListener('resize', () => {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;
    const icon = this.shadowRoot?.getElementById('accessibility-icon');
    const panel = this.shadowRoot?.getElementById('accessibility-panel');
    
    console.log('📱 [WINDOW RESIZE] Window resized - screen width:', screenWidth);
    console.log('📱 [WINDOW RESIZE] Is mobile:', isMobile);
    console.log('📱 [WINDOW RESIZE] Icon found:', !!icon);
    console.log('📱 [WINDOW RESIZE] Panel found:', !!panel);
    
    if (icon && panel) {
        // Add a small delay to ensure proper rendering after resize
        setTimeout(() => {
            // First, ensure base panel CSS is applied
            this.ensureBasePanelCSS();
            
            // Force re-render to ensure styles are applied
            panel.style.display = 'none';
            panel.offsetHeight; // Trigger reflow
            panel.style.display = '';
            
        if (isMobile) {
            // Apply mobile settings - force small panel near icon
                console.log('📱 [WINDOW RESIZE] Window resized to mobile - applying mobile styles');
            this.applyMobileResponsiveStyles();
            
            // Reapply mobile positioning if it was set
            if (this.customizationData) {
                if (this.customizationData.mobileTriggerHorizontalPosition && this.customizationData.mobileTriggerVerticalPosition) {
                        console.log('📱 [WINDOW RESIZE] Reapplying combined mobile positioning on resize');
                    this.updateMobileTriggerCombinedPosition(this.customizationData.mobileTriggerHorizontalPosition, this.customizationData.mobileTriggerVerticalPosition);
                }
            }
        } else {
            // Apply desktop settings
                console.log('📱 [WINDOW RESIZE] Window resized to desktop - removing mobile styles');
            this.removeMobileResponsiveStyles();
        }
        }, 100); // Small delay to ensure proper rendering
    } else {
        console.log('📱 [WINDOW RESIZE] Icon or panel not found - skipping responsive styles');
    }
});

// Apply mobile responsive styles on load if mobile
if (window.innerWidth <= 768) {
    this.applyMobileResponsiveStyles();
}

// Add listener for display scaling changes and device pixel ratio changes
window.addEventListener('resize', () => {
    // Force re-application of base CSS after any resize to maintain styling
    setTimeout(() => {
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        if (panel) {
            console.log('🔧 [SCALING RESIZE] Display scaling or size changed - reapplying base CSS');
            this.ensureBasePanelCSS();
        }
    }, 50);
});

// Add listener for device pixel ratio changes (display scaling)
if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(min-resolution: 1.5dppx)');
    const handlePixelRatioChange = () => {
        console.log('🔧 [PIXEL RATIO] Device pixel ratio changed - reapplying base CSS');
        setTimeout(() => {
            const panel = this.shadowRoot?.getElementById('accessibility-panel');
            if (panel) {
                this.ensureBasePanelCSS();
            }
        }, 100);
    };
    
    mediaQuery.addListener(handlePixelRatioChange);
}

// Add MutationObserver to watch for style changes and reapply base CSS
if (this.shadowRoot) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const panel = this.shadowRoot?.getElementById('accessibility-panel');
                if (panel && panel === mutation.target) {
                    console.log('🔧 [MUTATION] Panel style changed - ensuring base CSS is maintained');
                    setTimeout(() => {
                        this.ensureBasePanelCSS();
                    }, 10);
                }
            }
        });
    });
    
    // Start observing the panel for style changes
    const panel = this.shadowRoot?.getElementById('accessibility-panel');
    if (panel) {
        observer.observe(panel, { attributes: true, attributeFilter: ['style'] });
    }
}

// Add periodic check to ensure panel maintains its CSS (every 2 seconds)
setInterval(() => {
    const panel = this.shadowRoot?.getElementById('accessibility-panel');
    if (panel && panel.style.display !== 'none') {
        // Check if essential CSS properties are missing
        const computedStyle = window.getComputedStyle(panel);
        const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && computedStyle.backgroundColor !== 'transparent';
        const hasBoxShadow = computedStyle.boxShadow !== 'none';
        const hasBorderRadius = computedStyle.borderRadius !== '0px';
        
        if (!hasBackground || !hasBoxShadow || !hasBorderRadius) {
            console.log('🔧 [PERIODIC CHECK] Panel missing essential CSS - reapplying base CSS');
            this.ensureBasePanelCSS();
        }
    }
}, 2000);
            

            // Keyboard event for icon

            icon.addEventListener('keydown', (e) => {

                if (e.key === 'Enter' || e.key === ' ') {

                    e.preventDefault();

                    console.log('Accessibility Widget: Icon activated via keyboard');

                    this.togglePanel();

                }

            });

        }

        

        if (closeBtn) {

            // Click event

            closeBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Close button clicked');

                this.togglePanel();

            });

            

            // Keyboard event for close button

            closeBtn.addEventListener('keydown', (e) => {

                if (e.key === 'Enter' || e.key === ' ') {

                    e.preventDefault();

                    console.log('Accessibility Widget: Close button activated via keyboard');

                    this.togglePanel();

                }

            });

        }

        

        // Toggle switches - using Shadow DOM

        const toggles = this.shadowRoot.querySelectorAll('.toggle-switch input');

        toggles.forEach(toggle => {

            // Add proper ARIA attributes for screen readers

            this.addToggleAccessibility(toggle);

            

            toggle.addEventListener('change', (e) => {

                const feature = e.target.id;

                const enabled = e.target.checked;

                console.log(`Accessibility Widget: Toggle ${feature} changed to ${enabled}`);

                this.handleToggle(feature, enabled);

                

                // Special handling for content scaling toggle

                if (feature === 'content-scaling') {

                    this.toggleContentScalingControls(enabled);

                }

                

                // Special handling for font sizing toggle

                if (feature === 'font-sizing') {

                    this.toggleFontSizingControls(enabled);

                }



                // Special handling for line height toggle
                console.log('📏 [TOGGLE HANDLER] Processing line height toggle:', feature, 'enabled:', enabled);

                if (feature === 'adjust-line-height') {
                    console.log('📏 [TOGGLE HANDLER] Calling toggleLineHeightControls with enabled:', enabled);
                    this.toggleLineHeightControls(enabled);

                }

                // Special handling for alignment toggles - ensure mutual exclusion
                console.log('🔧 [TOGGLE HANDLER] Processing alignment toggle:', feature, 'enabled:', enabled);

                if (feature === 'align-left' && enabled) {
                    console.log('🔧 [TOGGLE HANDLER] Enabling align-left, disabling others...');
                    
                    // Clear all alignment classes first
                    this.clearAllAlignmentClasses();

                    // Uncheck other alignment toggles in UI
                    const centerToggle = this.shadowRoot.getElementById('align-center');
                    const rightToggle = this.shadowRoot.getElementById('align-right');
                    console.log('🔧 [TOGGLE HANDLER] Center toggle found:', !!centerToggle);
                    console.log('🔧 [TOGGLE HANDLER] Right toggle found:', !!rightToggle);
                    if (centerToggle) centerToggle.checked = false;
                    if (rightToggle) rightToggle.checked = false;

                } else if (feature === 'align-center' && enabled) {
                    console.log('🔧 [TOGGLE HANDLER] Enabling align-center, disabling others...');

                    // Clear all alignment classes first
                    this.clearAllAlignmentClasses();

                    // Uncheck other alignment toggles in UI
                    const leftToggle = this.shadowRoot.getElementById('align-left');
                    const rightToggle = this.shadowRoot.getElementById('align-right');
                    console.log('🔧 [TOGGLE HANDLER] Left toggle found:', !!leftToggle);
                    console.log('🔧 [TOGGLE HANDLER] Right toggle found:', !!rightToggle);
                    if (leftToggle) leftToggle.checked = false;
                    if (rightToggle) rightToggle.checked = false;

                } else if (feature === 'align-right' && enabled) {
                    console.log('🔧 [TOGGLE HANDLER] Enabling align-right, disabling others...');

                    // Clear all alignment classes first
                    this.clearAllAlignmentClasses();

                    // Uncheck other alignment toggles in UI
                    const leftToggle = this.shadowRoot.getElementById('align-left');
                    const centerToggle = this.shadowRoot.getElementById('align-center');
                    console.log('🔧 [TOGGLE HANDLER] Left toggle found:', !!leftToggle);
                    console.log('🔧 [TOGGLE HANDLER] Center toggle found:', !!centerToggle);
                    if (leftToggle) leftToggle.checked = false;
                    if (centerToggle) centerToggle.checked = false;

                }

                // Prevent multiple calls to the same alignment function
                if (feature.startsWith('align-') && enabled) {
                    console.log('🔧 [TOGGLE HANDLER] Preventing duplicate alignment calls for:', feature);
                    return; // Skip the normal toggle processing to prevent conflicts
                }



                // Special handling for letter spacing toggle

                if (feature === 'adjust-letter-spacing') {

                    this.toggleLetterSpacingControls(enabled);

                }



            });

        });



        // Add keyboard support for profile items (Enter key to toggle)

        const profileItems = this.shadowRoot.querySelectorAll('.profile-item');

        profileItems.forEach(profileItem => {

            // Make profile items focusable

            profileItem.setAttribute('tabindex', '0');

            profileItem.setAttribute('role', 'button');

            

            // Add keyboard event listener

            profileItem.addEventListener('keydown', (e) => {

                if (e.key === 'Enter' || e.key === ' ') {

                    e.preventDefault();

                    const toggle = profileItem.querySelector('input[type="checkbox"]');

                    if (toggle) {

                        toggle.checked = !toggle.checked;

                        const feature = toggle.id;
                        console.log('🎹 [KEYBOARD TOGGLE] Feature toggled via keyboard:', feature, 'enabled:', toggle.checked);

                        const enabled = toggle.checked;

                        console.log(`Accessibility Widget: Keyboard toggle ${feature} changed to ${enabled}`);

                        this.handleToggle(feature, enabled);

                        // Ensure control buttons are revealed when toggled via keyboard
                        try {
                            if (feature === 'content-scaling') {
                                console.log('🎛️ [KEYBOARD TOGGLE] Forcing content scaling controls visibility:', enabled);
                                this.toggleContentScalingControls(enabled);
                            } else if (feature === 'font-sizing') {
                                console.log('🔤 [KEYBOARD TOGGLE] Forcing font sizing controls visibility:', enabled);
                                this.toggleFontSizingControls(enabled);
                            } else if (feature === 'adjust-line-height') {
                                console.log('📏 [KEYBOARD TOGGLE] Forcing line height controls visibility:', enabled);
                                this.toggleLineHeightControls(enabled);
                            } else if (feature === 'adjust-letter-spacing') {
                                console.log('📝 [KEYBOARD TOGGLE] Forcing letter spacing controls visibility:', enabled);
                                this.toggleLetterSpacingControls(enabled);
                            }
                        } catch (err) {
                            console.warn('⚠️ [KEYBOARD TOGGLE] Failed to force control visibility:', err);
                        }

                        

                        // Announce to screen reader

                        const featureName = profileItem.querySelector('h4')?.textContent || feature;

                        this.announceToScreenReader(`${featureName} ${enabled ? 'enabled' : 'disabled'}`);

                    }

                }

            });

        });

        

        // Action buttons - using Shadow DOM

        const resetBtn = this.shadowRoot.getElementById('reset-settings');

        if (resetBtn) {

            resetBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Reset settings clicked');

                this.resetSettings();

            });

        }

        

        const statementBtn = this.shadowRoot.getElementById('statement');

        if (statementBtn) {

            statementBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Statement button clicked');

                this.showStatement();

            });

        }

        

        const hideBtn = this.shadowRoot.getElementById('hide-interface');

        if (hideBtn) {

            hideBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Hide interface clicked');

                this.hideInterface();

            });

        }

        

        // Language selector header event listener will be set up after panel creation

        

        

        // Content scaling control buttons - using Shadow DOM

        const decreaseContentScaleBtn = this.shadowRoot.getElementById('decrease-content-scale-btn');

        if (decreaseContentScaleBtn) {

            decreaseContentScaleBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Decrease content scale clicked');

                this.decreaseContentScale();

            });

        }



        const increaseContentScaleBtn = this.shadowRoot.getElementById('increase-content-scale-btn');

        if (increaseContentScaleBtn) {

            increaseContentScaleBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Increase content scale clicked');

                this.increaseContentScale();

            });

        }



        // Font sizing control buttons - using Shadow DOM

        const decreaseFontSizeBtn = this.shadowRoot.getElementById('decrease-font-size-btn');

        if (decreaseFontSizeBtn) {

            decreaseFontSizeBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Decrease font size clicked');

                this.decreaseFontSize();

            });

        }



        const increaseFontSizeBtn = this.shadowRoot.getElementById('increase-font-size-btn');

        if (increaseFontSizeBtn) {

            increaseFontSizeBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Increase font size clicked');

                this.increaseFontSize();

            });

        }







        // Letter spacing control buttons - using Shadow DOM

        const decreaseLetterSpacingBtn = this.shadowRoot.getElementById('decrease-letter-spacing-btn');

        if (decreaseLetterSpacingBtn) {

            decreaseLetterSpacingBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Decrease letter spacing clicked');

                this.decreaseLetterSpacing();

            });

        }



        const increaseLetterSpacingBtn = this.shadowRoot.getElementById('increase-letter-spacing-btn');

        if (increaseLetterSpacingBtn) {

            increaseLetterSpacingBtn.addEventListener('click', () => {

                console.log('Accessibility Widget: Increase letter spacing clicked');

                this.increaseLetterSpacing();

            });

        }



        console.log('Accessibility Widget: Events bound successfully');

    }



    initTextMagnifier() {

        // Initialize text magnifier functionality

        console.log('Accessibility Widget: Text magnifier initialized');

    }



    initKeyboardShortcuts() {

        console.log('Accessibility Widget: Initializing keyboard shortcuts...');

        

        // Remove existing shortcuts if any

        this.removeKeyboardShortcuts();

        

        // Initialize element tracking for cycling

        this.currentElementIndex = {};

        this.highlightedElements = [];

        

        // Add mouse detection for disabling keyboard focus indicators
        this.mouseHandler = (e) => {
            this.isKeyboardNavigation = false;
            this.lastInteractionMethod = 'mouse';
            console.log('Accessibility Widget: Mouse interaction detected - disabling keyboard focus indicators');
            
            // Disable highlight focus when mouse is used
            if (document.body.classList.contains('highlight-focus')) {
                console.log('Accessibility Widget: Auto-disabling highlight focus for mouse interaction');
                this.disableHighlightFocus();
            }
        };

        // Add keyboard shortcuts for navigation

        this.keyboardShortcutHandler = (e) => {

            console.log('Accessibility Widget: Key pressed:', e.key, 'Alt:', e.altKey, 'Keyboard nav enabled:', this.settings['keyboard-nav']);

            // Detect Tab key navigation
            if (e.key === 'Tab') {
                this.isKeyboardNavigation = true;
                this.lastInteractionMethod = 'keyboard';
                console.log('Accessibility Widget: Tab key detected - keyboard navigation mode active');
                
                // Automatically enable highlight focus when Tab is used
                if (!document.body.classList.contains('highlight-focus')) {
                    console.log('Accessibility Widget: Auto-enabling highlight focus for keyboard navigation');
                    this.enableHighlightFocus();
                }
            }

            

            // Global shortcuts (only work when keyboard navigation is enabled)

            if (e.altKey && this.settings['keyboard-nav']) {

                switch(e.key.toLowerCase()) {

                    case 'a': // Toggle accessibility panel

                        e.preventDefault();

                        console.log('Accessibility Widget: Alt+A pressed, toggling panel');

                        this.togglePanel();

                        this.announceToScreenReader('Accessibility panel toggled');

                        return;

                    case 's': // Toggle seizure safe

                        e.preventDefault();

                        console.log('Accessibility Widget: Alt+S pressed, toggling seizure safe');

                        const currentSeizureState = this.settings['seizure-safe'];

                        if (currentSeizureState) {

                            this.disableSeizureSafe();

                        } else {

                            this.enableSeizureSafe();

                        }

                        // Update toggle switch in panel

                        this.updateToggleSwitch('seizure-safe', !currentSeizureState);

                        const seizureStatus = !currentSeizureState ? 'enabled' : 'disabled';

                        this.announceToScreenReader(`Seizure safe mode ${seizureStatus}`);

                        return;

                    case 'v': // Toggle vision impaired

                        e.preventDefault();

                        console.log('Accessibility Widget: Alt+V pressed, toggling vision impaired');

                        const currentVisionState = this.settings['vision-impaired'];

                        if (currentVisionState) {

                            this.disableVisionImpaired();

                        } else {

                            this.enableVisionImpaired();

                        }

                        // Update toggle switch in panel

                        this.updateToggleSwitch('vision-impaired', !currentVisionState);

                        const visionStatus = !currentVisionState ? 'enabled' : 'disabled';

                        this.announceToScreenReader(`Vision impaired mode ${visionStatus}`);

                        return;

                    case 'h': // Toggle ADHD friendly

                        e.preventDefault();

                        console.log('Accessibility Widget: Alt+H pressed, toggling ADHD friendly');

                        const currentADHDState = this.settings['adhd-friendly'];

                        if (currentADHDState) {

                            this.disableADHDFriendly();

                        } else {

                            this.enableADHDFriendly();

                        }

                        // Update toggle switch in panel

                        this.updateToggleSwitch('adhd-friendly', !currentADHDState);

                        const adhdStatus = !currentADHDState ? 'enabled' : 'disabled';

                        this.announceToScreenReader(`ADHD friendly mode ${adhdStatus}`);

                        return;

                    case 'r': // Reset all settings

                        e.preventDefault();

                        console.log('Accessibility Widget: Alt+R pressed, resetting all settings');

                        this.resetSettings();

                        // Update all toggle switches to off

                        this.updateAllToggleSwitches();

                        this.announceToScreenReader('All accessibility settings have been reset');

                        return;

                }

            }

            

            // Escape key to close panel (works regardless of keyboard navigation setting)

            if (e.key === 'Escape') {

                if (this.isPanelOpen) {

                    e.preventDefault();

                    console.log('Accessibility Widget: Escape pressed, closing panel');

                    this.togglePanel();

                    this.announceToScreenReader('Accessibility panel closed');

                    return;

                }

            }

            

            // Only activate keyboard navigation if enabled

            if (!this.settings['keyboard-nav']) {

                console.log('Accessibility Widget: Keyboard navigation not enabled');

                return;

            }

            

            // Check if user is typing in an input field

            const activeElement = document.activeElement;

            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {

                console.log('Accessibility Widget: Ignoring key press in input field');

                return; // Don't interfere with typing

            }

            

            // Single key navigation (no Alt/Ctrl needed)

            switch(e.key.toLowerCase()) {

                case 'm': // Menus

                    e.preventDefault();

                    console.log('Accessibility Widget: M key pressed - cycling through menus');

                    this.cycleThroughElements('nav, [role="navigation"], .menu, .navbar', 'menu');

                    break;

                case 'h': // Headings

                    e.preventDefault();

                    console.log('Accessibility Widget: H key pressed - cycling through headings');

                    this.cycleThroughElements('h1, h2, h3, h4, h5, h6', 'heading');

                    break;

                case 'f': // Forms

                    e.preventDefault();

                    console.log('Accessibility Widget: F key pressed - cycling through forms');

                    this.cycleThroughElements('form, input, textarea, select, button[type="submit"]', 'form');

                    break;

                case 'b': // Buttons

                    e.preventDefault();

                    console.log('Accessibility Widget: B key pressed - cycling through buttons');

                    this.cycleThroughElements('button, .btn, input[type="button"], input[type="submit"]', 'button');

                    break;

                case 'g': // Graphics

                    e.preventDefault();

                    console.log('Accessibility Widget: G key pressed - cycling through graphics');

                    this.cycleThroughElements('img, svg, canvas, .image, .graphic', 'graphic');

                    break;

                case 'l': // Links

                    e.preventDefault();

                    console.log('Accessibility Widget: L key pressed - cycling through links');

                    this.cycleThroughElements('a[href], .link', 'link');

                    break;

                case 's': // Skip to main content

                    e.preventDefault();

                    console.log('Accessibility Widget: S key pressed - skipping to main content');

                    this.focusElement('main, [role="main"], .main-content, #main');

                    break;

                default:

                    // For any other key, just log it to see if the event listener is working

                    console.log('Accessibility Widget: Other key pressed:', e.key);

                    break;

            }

        };

        

        // Add event listeners

        document.addEventListener('keydown', this.keyboardShortcutHandler);
        document.addEventListener('mousedown', this.mouseHandler);
        document.addEventListener('click', this.mouseHandler);

        console.log('Accessibility Widget: Keyboard shortcuts and mouse detection initialized successfully');

        

        // Test if event listener is working

        setTimeout(() => {

            console.log('Accessibility Widget: Testing keyboard event listener...');

            // Simulate a key press to test

            const testEvent = new KeyboardEvent('keydown', { key: 'h' });

            document.dispatchEvent(testEvent);

        }, 1000);

    }



    removeKeyboardShortcuts() {

        if (this.keyboardShortcutHandler) {

            document.removeEventListener('keydown', this.keyboardShortcutHandler);

            this.keyboardShortcutHandler = null;

            console.log('Accessibility Widget: Keyboard shortcuts removed');
        }

        if (this.mouseHandler) {

            document.removeEventListener('mousedown', this.mouseHandler);

            document.removeEventListener('click', this.mouseHandler);

            this.mouseHandler = null;

            console.log('Accessibility Widget: Mouse detection removed');

        }

        

        // Remove all highlighted elements

        this.removeAllHighlights();

        

        // Reset element tracking

        this.currentElementIndex = {};

    }



    cycleThroughElements(selector, type) {

        console.log(`Accessibility Widget: Cycling through ${type} elements with selector: ${selector}`);

        

        // Remove previous highlights

        this.removeAllHighlights();

        

        // Get all matching elements

        const elements = Array.from(document.querySelectorAll(selector));

        console.log(`Accessibility Widget: Found ${elements.length} ${type} elements`);

        

        if (elements.length === 0) {

            console.log(`Accessibility Widget: No ${type} elements found`);

            return;

        }

        

        // Get current index for this type

        const currentIndex = this.currentElementIndex[type] || 0;

        const element = elements[currentIndex];

        

        console.log(`Accessibility Widget: Highlighting ${type} element ${currentIndex + 1} of ${elements.length}:`, element);

        

        // Create highlight

        this.createHighlight(element, type, currentIndex + 1, elements.length);

        

        // Update index for next cycle

        this.currentElementIndex[type] = (currentIndex + 1) % elements.length;

        

        console.log(`Accessibility Widget: Highlighted ${type} ${currentIndex + 1} of ${elements.length}`);

    }



    createHighlight(element, type, current, total) {

        console.log(`Accessibility Widget: Creating highlight for ${type} element:`, element);

        

        const rect = element.getBoundingClientRect();

        console.log(`Accessibility Widget: Element rect:`, rect);

        

        // Create highlight box

        const highlight = document.createElement('div');

        highlight.className = 'keyboard-highlight';

        highlight.style.cssText = `

            position: fixed;

            top: ${rect.top - 3}px;

            left: ${rect.left - 3}px;

            width: ${rect.width + 6}px;

            height: ${rect.height + 6}px;

            border: 3px solid #6366f1;

            border-radius: 6px;

            background: transparent;

            pointer-events: none;

            z-index: 1000000;

            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);

            transition: all 0.3s ease;

        `;

        

        // Create label

        const label = document.createElement('div');

        label.className = 'keyboard-highlight-label';

        label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} ${current} of ${total}`;

        label.style.cssText = `

            position: fixed;

            top: ${rect.top - 35}px;

            left: ${rect.left}px;

            background: #6366f1;

            color: white;

            padding: 4px 8px;

            border-radius: 4px;

            font-size: 12px;

            font-weight: bold;

            white-space: nowrap;

            z-index: 1000001;

            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

        `;

        

        // Add to page

        document.body.appendChild(highlight);

        document.body.appendChild(label);

        

        console.log(`Accessibility Widget: Added highlight and label to page`);

        

        // Store references for removal

        this.highlightedElements.push(highlight, label);

        

        // Auto-remove after 3 seconds

        setTimeout(() => {

            this.removeAllHighlights();

        }, 3000);

    }



    removeAllHighlights() {

        if (this.highlightedElements && Array.isArray(this.highlightedElements)) {

        this.highlightedElements.forEach(element => {

            if (element && element.parentNode) {

                element.parentNode.removeChild(element);

            }

        });

        }

        this.highlightedElements = [];

    }



    focusElement(selector) {

        const element = document.querySelector(selector);

        if (element) {

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            element.focus();

            console.log(`Accessibility Widget: Focused on ${selector}`);

        } else {

            console.log(`Accessibility Widget: Element not found: ${selector}`);

        }

    }



    addFontAwesome() {

        if (!document.querySelector('link[href*="font-awesome"]')) {

            const fontAwesome = document.createElement('link');

            fontAwesome.rel = 'stylesheet';

            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';

            document.head.appendChild(fontAwesome);

            console.log('Accessibility Widget: Font Awesome added');

        }

    }



    addCSS() {

        // Check if CSS is already loaded

        if (!document.querySelector('link[href*="accessibility-widget.css"]')) {

            const link = document.createElement('link');

            link.rel = 'stylesheet';

            link.href = 'https://cdn.jsdelivr.net/gh/snm62/accessibility-test@77b2db8/accessibility-widget.css';
            // External CSS removed to prevent conflicts with internal styles
            link.onload = () => {
                
                console.log('Accessibility Widget: CSS loaded successfully');

            };

            link.onerror = () => {

                console.error('Accessibility Widget: Failed to load CSS from:', link.href);

            };

            document.head.appendChild(link);

            // Add this after your existing CSS

            // Define overrideCSS first
            const overrideCSS = `
.accessibility-panel {
  left: auto !important;
  right: auto !important;
  top: auto !important;
  bottom: auto !important;
  transform: none !important;
}

/* REMOVED the conflicting accessibility-icon rule that was forcing 50% border-radius */

/* Icon Shape Rules - Simplified */
.accessibility-icon[data-shape="circle"] {
    border-radius: 50%;
}

.accessibility-icon[data-shape="rounded"] {
    border-radius: 12px;
}

.accessibility-icon[data-shape="square"] {
    border-radius: 0px;
}

        /* Ensure panel always appears on top of icon */
        .accessibility-panel {
            z-index: 100001 !important;
            position: fixed !important;
            overflow-y: auto !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
        }

.accessibility-icon {
    z-index: 99998 !important;
}

/* Additional shape classes for compatibility */
.accessibility-icon.rounded {
    border-radius: 12px;
}

.accessibility-icon.circle {
    border-radius: 50%;
}

.accessibility-icon.square {
    border-radius: 0px;
}

/* Mobile-First Responsive Design */

/* Very Small Mobile Screens (430px and below) */
@media (max-width: 430px) {
    .accessibility-panel {
        font-size: 12px;
    }
    
    .accessibility-panel h2 {
        font-size: 1.3em;
    }
    
    .accessibility-panel h3 {
        font-size: 1.1em;
    }
    
    .accessibility-panel h4 {
        font-size: 0.9em;
    }
    
    .accessibility-panel p {
        font-size: 0.8em;
    }
    
    .accessibility-panel .action-btn {
        font-size: 0.8em;
        padding: 4px 8px;
    }
    
    .accessibility-panel .scaling-btn {
        font-size: 0.7em;
        padding: 3px 5px;
    }
    
    .accessibility-panel .profile-info h4 {
        font-size: 0.8em;
    }
    
    .accessibility-panel .profile-info p {
        font-size: 0.7em;
    }
    
    .accessibility-panel .profile-item h4 {
        font-size: 0.8em;
    }
    
    .accessibility-panel .profile-item p {
        font-size: 0.7em;
    }
    
    .accessibility-panel .close-btn {
        font-size: 16px;
        padding: 4px;
    }
}

/* Mobile Devices (Small Screens) - Base styles */
@media (max-width: 480px) {
    .accessibility-panel {
        width: 90vw;
        max-width: 350px;
        padding: 12px;
        font-size: 14px;
        max-height: 90vh !important;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
    
    .accessibility-panel h2 {
        margin-bottom: 8px;
        font-size: 1.5em;
    }
    
    .accessibility-panel h3 {
        margin-bottom: 6px;
        font-size: 1.2em;
    }
    
    .accessibility-panel h4 {
        font-size: 1em;
    }
    
    .accessibility-panel p {
        line-height: 1.3;
        font-size: 0.9em;
    }
    
    .accessibility-panel .action-btn {
        padding: 6px 10px;
        min-height: 28px;
        font-size: 0.9em;
    }
    
    .accessibility-panel .scaling-btn {
        padding: 4px 6px;
        min-height: 24px;
        font-size: 0.8em;
    }
    
    .accessibility-panel .profile-info h4 {
        font-size: 0.9em;
    }
    
    .accessibility-panel .profile-info p {
        font-size: 0.8em;
    }
    
    .accessibility-panel .profile-item h4 {
        font-size: 0.9em;
    }
    
    .accessibility-panel .profile-item p {
        font-size: 0.8em;
    }
    
    .accessibility-panel .close-btn {
        font-size: 18px;
        padding: 6px;
    }
    
    .accessibility-icon {
        width: 45px;
        height: 45px;
        /* Position controlled by JS; do not force a corner here */
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
}

/* Landscape Phones & Smaller Portrait Tablets */
@media (min-width: 481px) and (max-width: 768px) {
    .accessibility-panel {
        width: 80vw;
        max-width: 380px;
        padding: 14px;
        max-height: 90vh !important;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h2 {
        margin-bottom: 10px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        margin-bottom: 8px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel p {
        line-height: 1.4;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .action-btn {
        padding: 8px 12px;
        min-height: 32px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .scaling-btn {
        padding: 5px 8px;
        min-height: 26px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .close-btn {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-icon {
        width: 50px;
        height: 50px;
        /* Position controlled by JS */
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
}

/* Tablets (Portrait & Landscape) & Laptops */
@media (min-width: 769px) and (max-width: 1024px) {
    .accessibility-panel {
        width: 70vw;
        max-width: 450px;
        padding: 16px;
        max-height: 90vh !important;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h2 {
        margin-bottom: 12px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        margin-bottom: 10px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel p {
        line-height: 1.5;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .action-btn {
        padding: 10px 14px;
        min-height: 36px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .scaling-btn {
        padding: 6px 10px;
        min-height: 28px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .close-btn {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-icon {
        width: 55px;
        height: 55px;
        /* Position controlled by JS */
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
}

/* Larger Displays (Desktops) */
@media (min-width: 1012px) {
    .accessibility-panel {
        width: 500px;
        max-width: 500px;
        padding: 20px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h2 {
        margin-bottom: 14px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        margin-bottom: 12px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel p {
        line-height: 1.6;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .action-btn {
        padding: 12px 16px;
        min-height: 40px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .scaling-btn {
        padding: 8px 12px;
        min-height: 32px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .close-btn {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-icon {
        width: 60px;
        height: 60px;
        /* Position controlled by JS */
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
}

/* Orientation-specific styles */
@media (orientation: landscape) and (max-width: 768px) {
    .accessibility-panel {
        width: 85vw;
        max-width: 400px;
        max-height: 90vh !important;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h2 {
        margin-bottom: 8px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        margin-bottom: 6px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel p {
        line-height: 1.3;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .action-btn {
        padding: 6px 10px;
        min-height: 28px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .scaling-btn {
        padding: 4px 6px;
        min-height: 24px;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .close-btn {
        /* Font size controlled by JavaScript */
    }
}

/* High-resolution screens */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) {
    .accessibility-icon {
        /* Ensure crisp rendering on high-DPI displays */
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}
    
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .action-btn {
        padding: 8px 12px !important;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .scaling-btn {
        padding: 4px 8px !important;
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    /* Mobile shape adjustments */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px;
    }
}

/* Removed - replaced with mobile-first approach above */
    
    /* Medium toggles for medium mobile screens */
    .toggle-switch {
        width: 18px !important;
        height: 11px !important;
    }
    
    .toggle-switch .slider {
        width: 18px !important;
        height: 11px !important;
    }
    
    .toggle-switch .slider:before {
        width: 7px !important;
        height: 7px !important;
        left: 2px !important;
        bottom: 2px !important;
    }
    
    .toggle-switch input:checked + .slider:before {
        transform: translateX(26px) !important;
    }
    
    /* Medium profile items for medium mobile screens */
    .profile-item {
        padding: 3px !important;
        margin-bottom: 3px !important;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
        margin-bottom: 2px !important;
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
        margin-bottom: 2px !important;
    }
    
    /* Medium close button for medium mobile screens */
    .close-btn {
        /* Font size controlled by JavaScript */
        padding: 10px !important;
        width: 40px !important;
        height: 40px !important;
        min-width: 40px !important;
        min-height: 40px !important;
    }
    
    /* Ensure rounded shape works on medium mobile */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px !important;
        -webkit-border-radius: 12px !important;
        -moz-border-radius: 12px !important;
    }
}

/* Small Mobile Screens (375px and below) */
@media (max-width: 400px) {
    .accessibility-panel {
        /* Font size controlled by JavaScript */
        padding: 8px;
        width: 90vw;
        max-width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
    
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
        margin-bottom: 6px;
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
        margin-bottom: 4px;
    }
    
    .accessibility-panel .action-btn {
        /* Font size controlled by JavaScript */
        padding: 4px 6px;
        min-height: 24px;
    }
    
    .accessibility-panel .scaling-btn {
        /* Font size controlled by JavaScript */
        padding: 2px 4px;
        min-height: 20px;
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    /* Smaller toggles for small screens */
    .toggle-switch {
        width: 16px;
        height: 10px;
    }
    
    .toggle-switch .slider {
        width: 16px;
        height: 10px;
    }
    
    .toggle-switch .slider:before {
        width: 6px;
        height: 6px;
        left: 2px;
        bottom: 2px;
    }
    
    .toggle-switch input:checked + .slider:before {
        transform: translateX(6px);
    }
    
    /* Smaller profile items for small screens */
    .profile-item {
        padding: 2px;
        margin-bottom: 2px;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
        margin-bottom: 1px;
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
        margin-bottom: 1px;
    }
    
    /* Smaller close button for small screens */
    .close-btn {
        /* Font size controlled by JavaScript */
        padding: 8px;
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        min-height: 36px !important;
    }
    
    /* Ensure rounded shape works on small mobile */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px;
        -webkit-border-radius: 12px;
        -moz-border-radius: 12px;
    }
}

@media (max-width: 480px) {
    .accessibility-panel {
        /* Font size controlled by JavaScript */ /* Override external 8px */
    }
    
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */ /* Override external 9px */
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */ /* Override external 8px */
    }
    
    /* Override external button size conflicts */
    .accessibility-panel .action-btn {
        /* Font size controlled by JavaScript */
        padding: 6px 10px;
    }
    
    .accessibility-panel .scaling-btn {
        /* Font size controlled by JavaScript */
        padding: 3px 6px;
    }
    
    .accessibility-panel .profile-info h4 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel .profile-info p {
        /* Font size controlled by JavaScript */
    }
    
    /* Ensure rounded shape works on small mobile */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px;
        -webkit-border-radius: 12px;
        -moz-border-radius: 12px;
    }
}

/* Override external panel positioning conflicts */
.accessibility-panel {
    /* Let JavaScript control positioning, not external CSS */
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
}

/* ===== MOBILE RESPONSIVE - PANEL CLOSE TO ICON ===== */

/* Removed - replaced with mobile-first approach above */
    
    /* Ensure rounded shape works on large tablets */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px !important;
        -webkit-border-radius: 12px !important;
        -moz-border-radius: 12px !important;
    }
    
    .accessibility-icon {
        width: 55px !important;
        height: 55px !important;
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
    
    /* Better content spacing for large tablets */
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
        margin-bottom: 14px !important;
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
        margin-bottom: 12px !important;
    }
    
    .profile-item {
        padding: 12px !important;
        margin-bottom: 10px !important;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .action-btn {
        padding: 10px 14px !important;
        /* Font size controlled by JavaScript */
    }
}

/* Removed - replaced with mobile-first approach above */
    
    /* Ensure rounded shape works on tablets */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px !important;
        -webkit-border-radius: 12px !important;
        -moz-border-radius: 12px !important;
    }
    
    .accessibility-icon {
        width: 50px !important;
        height: 50px !important;
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
}

/* iPad Mini and Tablet - Responsive sizing */
@media (max-width: 819px) and (min-width: 769px) {
    .accessibility-panel {
        width: 85vw !important;
        max-width: 450px !important;
        /* Font size controlled by JavaScript */
        padding: 16px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
        position: fixed !important;
        z-index: 100001 !important;
    }
    
    /* Ensure rounded shape works on iPad Mini */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px !important;
        -webkit-border-radius: 12px !important;
        -moz-border-radius: 12px !important;
    }
    
    .accessibility-icon {
        width: 50px !important;
        height: 50px !important;
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
    
    /* Better content spacing for tablet */
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
        margin-bottom: 12px !important;
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
        margin-bottom: 10px !important;
    }
    
    .profile-item {
        padding: 10px !important;
        margin-bottom: 8px !important;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .action-btn {
        padding: 8px 12px !important;
        /* Font size controlled by JavaScript */
    }
}

/* Removed - replaced with mobile-first approach above */
    
    .accessibility-icon {
        width: 45px !important;
        height: 45px !important;
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
    
    /* Reasonable text and toggles for mobile landscape */
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
        margin-bottom: 10px !important;
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
        margin-bottom: 8px !important;
    }
    
    .profile-item {
        padding: 6px !important;
        margin-bottom: 4px !important;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .action-btn {
        padding: 4px 6px !important;
        /* Font size controlled by JavaScript */
    }
    
    /* Much smaller action buttons for mobile landscape */
    .action-btn.reset-btn,
    .action-btn.statement-btn,
    .action-btn.hide-btn {
        padding: 3px 5px !important;
        /* Font size controlled by JavaScript */
        min-height: 20px !important;
    }
    
    .action-btn i {
        /* Font size controlled by JavaScript */
        margin-right: 2px !important;
    }
    
    /* Very small toggles for mobile landscape */
    .toggle-switch {
        width: 20px !important;
        height: 12px !important;
    }
    
    .toggle-switch .slider {
        width: 20px !important;
        height: 12px !important;
    }
    
    .toggle-switch .slider:before {
        height: 8px !important;
        width: 8px !important;
        left: 2px !important;
        bottom: 2px !important;
    }
    
    .toggle-switch input:checked + .slider:before {
        transform: translateX(26px) !important;
    }
}

/* Mobile Portrait - Reasonable text and toggles */
@media (max-width: 480px) {
    .accessibility-panel {
        width: 75vw !important;
        max-width: 320px !important;
        /* Font size controlled by JavaScript */
        padding: 12px !important;
        max-height: 90vh !important;
        overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
    
    .accessibility-icon {
        width: 40px !important;
        height: 40px !important;
    }
    
    .accessibility-icon i {
        /* Font size controlled by JavaScript */
    }
    
    /* Reasonable text and toggles for mobile portrait */
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
        margin-bottom: 8px !important;
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
        margin-bottom: 6px !important;
    }
    
    .profile-item {
        padding: 2px !important;
        margin-bottom: 2px !important;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .action-btn {
        padding: 2px 3px !important;
        /* Font size controlled by JavaScript */
    }
    
    /* EXTREMELY small action buttons for mobile portrait */
    .action-btn.reset-btn,
    .action-btn.statement-btn,
    .action-btn.hide-btn {
        padding: 1px 2px !important;
        /* Font size controlled by JavaScript */
        min-height: 12px !important;
    }
    
    .action-btn i {
        /* Font size controlled by JavaScript */
        margin-right: 1px !important;
    }
    
    /* TINY toggles for mobile portrait */
    .toggle-switch {
        width: 12px !important;
        height: 8px !important;
    }
    
    .toggle-switch .slider {
        width: 12px !important;
        height: 8px !important;
    }
    
    .toggle-switch .slider:before {
        height: 4px !important;
        width: 4px !important;
        left: 2px !important;
        bottom: 2px !important;
    }
    
    .toggle-switch input:checked + .slider:before {
        transform: translateX(26px) !important;
    }
}

/* ===== FORCE ROUNDED SHAPES - MAXIMUM AGGRESSIVE ===== */

/* Removed conflicting shape styles */

/* DEBUG: Add visual indicators for shape testing */
.accessibility-icon[data-shape="circle"]::after {
    content: "CIRCLE" !important;
    position: absolute !important;
    top: -20px !important;
    left: 0 !important;
    /* Font size controlled by JavaScript */
    color: red !important;
    background: yellow !important;
    z-index: 9999 !important;
}

.accessibility-icon[data-shape="rounded"]::after {
    content: "ROUNDED" !important;
    position: absolute !important;
    top: -20px !important;
    left: 0 !important;
    /* Font size controlled by JavaScript */
    color: red !important;
    background: yellow !important;
    z-index: 9999 !important;
}

.accessibility-icon[data-shape="square"]::after {
    content: "SQUARE" !important;
    position: absolute !important;
    top: -20px !important;
    left: 0 !important;
    /* Font size controlled by JavaScript */
    color: red !important;
    background: yellow !important;
    z-index: 9999 !important;
}

/* Removed conflicting media query rules */

/* Removed ultimate override rules */

/* Removed simple clean override rules */
}

/* Removed all conflicting shape override rules */

/* ===== FORCE MOBILE STYLES - MAXIMUM AGGRESSIVE ===== */

/* Removed - replaced with mobile-first approach above */
    
    .accessibility-panel h2 {
        /* Font size controlled by JavaScript */
    }
    
    .accessibility-panel h3 {
        /* Font size controlled by JavaScript */
    }
    
    /* Mobile shape adjustments */
    .accessibility-icon[data-shape="rounded"] {
        border-radius: 12px;
    }
    
    .profile-item h4 {
        /* Font size controlled by JavaScript */
    }
    
    .profile-item p {
        /* Font size controlled by JavaScript */
    }
    
    .action-btn {
        /* Font size controlled by JavaScript */
        padding: 2px 3px !important;
    }
    
    .action-btn.reset-btn,
    .action-btn.statement-btn,
    .action-btn.hide-btn {
        /* Font size controlled by JavaScript */
        padding: 1px 2px !important;
        min-height: 12px !important;
    }
    
    .toggle-switch {
        width: 12px !important;
        height: 8px !important;
    }
    
    .toggle-switch .slider {
        width: 12px !important;
        height: 8px !important;
    }
    
    .toggle-switch .slider:before {
        width: 4px !important;
        height: 4px !important;
    }
    
    .toggle-switch input:checked + .slider:before {
        transform: translateX(26px) !important;
    }
}

.accessibility-panel {
    display: none !important;
    position: fixed !important;
    z-index: 100001 !important;
}

.accessibility-panel.show {
    display: block !important;
    visibility: visible !important;
}

/* Text Alignment CSS Rules */
body.align-left * {
    text-align: left !important;
}

body.align-center * {
    text-align: center !important;
}

body.align-right * {
    text-align: right !important;
}

/* More specific alignment rules for better coverage */
body.align-left h1,
body.align-left h2,
body.align-left h3,
body.align-left h4,
body.align-left h5,
body.align-left h6,
body.align-left p,
body.align-left div,
body.align-left span,
body.align-left a {
    text-align: left !important;
}

body.align-center h1,
body.align-center h2,
body.align-center h3,
body.align-center h4,
body.align-center h5,
body.align-center h6,
body.align-center p,
body.align-center div,
body.align-center span,
body.align-center a {
    text-align: center !important;
}

body.align-right h1,
body.align-right h2,
body.align-right h3,
body.align-right h4,
body.align-right h5,
body.align-right h6,
body.align-right p,
body.align-right div,
body.align-right span,
body.align-right a {
    text-align: right !important;
}
`;

            // Inject the override CSS
            const style = document.createElement('style');
            style.textContent = overrideCSS;
            document.head.appendChild(style);
            
            const overrideStyle = document.createElement('style');
            overrideStyle.textContent = overrideCSS;
            document.head.appendChild(overrideStyle);
            console.log('Accessibility Widget: Loading CSS from:', link.href);

        }

    }



    createWidget() {

        // Create widget container that will host the Shadow DOM
        
        const widgetContainer = document.createElement('div');

        widgetContainer.id = 'accessibility-widget-container';

        widgetContainer.style.cssText = `

            position: fixed;

            top: 0;

            left: 0;

            width: 100%;

            height: 100%;

            pointer-events: none;

            z-index: 99998;

        `;

        // Append to documentElement instead of body to avoid transform issues

        document.documentElement.appendChild(widgetContainer);



        // Create Shadow DOM

        const shadowRoot = widgetContainer.attachShadow({ mode: 'open' });

        this.shadowRoot = shadowRoot;



        // Add CSS to Shadow DOM

        const style = document.createElement('style');

        style.textContent = this.getWidgetCSS();

        shadowRoot.appendChild(style);



        // Create accessibility icon inside Shadow DOM with enhanced accessibility

        const icon = document.createElement('div');

        icon.id = 'accessibility-icon';

        icon.className = 'accessibility-icon';

        icon.setAttribute('role', 'button');

        icon.setAttribute('tabindex', '0');

        icon.setAttribute('aria-label', 'Open accessibility options');

        icon.setAttribute('aria-expanded', 'false');

        icon.setAttribute('aria-describedby', 'accessibility-icon-description');

        icon.innerHTML = '<i class="fas fa-universal-access" aria-hidden="true"></i><span id="accessibility-icon-description" class="sr-only">Click to open accessibility settings panel</span>';

        icon.style.pointerEvents = 'auto';
        
        // Initially hide the icon until customization data is loaded
        icon.style.display = 'none';
        icon.style.visibility = 'hidden';
        icon.style.opacity = '0';

        shadowRoot.appendChild(icon);

        console.log('Accessibility Widget: Icon created in Shadow DOM with ID:', icon.id);



        // Create panel inside Shadow DOM with enhanced accessibility

        const panel = document.createElement('div');

        panel.id = 'accessibility-panel';

        panel.className = 'accessibility-panel';

        panel.setAttribute('role', 'dialog');

        panel.setAttribute('aria-label', 'Accessibility Settings');

        panel.setAttribute('aria-hidden', 'true');

        panel.setAttribute('aria-modal', 'true');

        panel.setAttribute('aria-describedby', 'panel-description');

        panel.innerHTML = this.getPanelHTML();

        panel.style.pointerEvents = 'auto';

        shadowRoot.appendChild(panel);

        console.log('Accessibility Widget: Panel created in Shadow DOM with ID:', panel.id);

        
        // In your createWidget function, after creating the panel:
        panel.style.pointerEvents = 'auto';
        panel.style.display = 'none'; // Hide panel by default
        panel.style.visibility = 'hidden'; // Also hide with visibility
        shadowRoot.appendChild(panel);
        // Initialize current language display

        this.initializeLanguageDisplay();

        

        // Set up language selector header event listener

        const languageSelectorHeader = this.shadowRoot.getElementById('language-selector-header');

        if (languageSelectorHeader) {

            languageSelectorHeader.addEventListener('click', (e) => {

                console.log('Accessibility Widget: Language selector clicked!');

                e.preventDefault();

                e.stopPropagation();

                this.toggleLanguageDropdown();

            });

            console.log('Accessibility Widget: Language selector event listener attached');

        } else {

            console.error('Accessibility Widget: Language selector header not found!');

        }

        

        // Create language dropdown inside the panel

        const languageDropdown = document.createElement('div');

        languageDropdown.id = 'language-dropdown';

        languageDropdown.className = 'language-dropdown';

        languageDropdown.style.display = 'none';

        languageDropdown.innerHTML = this.getLanguageDropdownContent();

        // Append dropdown INSIDE the panel, not to shadowRoot
        panel.appendChild(languageDropdown);

        console.log('Accessibility Widget: Language dropdown appended to panel');

        console.log('Accessibility Widget: Dropdown innerHTML length:', languageDropdown.innerHTML.length);

        console.log('Accessibility Widget: Dropdown children count:', languageDropdown.children.length);

        

        // Dropdown is ready for use

        

        // Set up language dropdown event listeners after dropdown is created

        this.setupLanguageDropdownListeners();

        



        // Create screen reader announcements container

        const srAnnouncements = document.createElement('div');

        srAnnouncements.id = 'sr-announcements';

        srAnnouncements.className = 'sr-only';

        srAnnouncements.setAttribute('aria-live', 'polite');

        srAnnouncements.setAttribute('aria-atomic', 'true');

        shadowRoot.appendChild(srAnnouncements);

        

        // Verify elements are in Shadow DOM

        setTimeout(() => {

            const iconCheck = shadowRoot.getElementById('accessibility-icon');

            const panelCheck = shadowRoot.getElementById('accessibility-panel');

            console.log('Accessibility Widget: Icon in Shadow DOM:', !!iconCheck);

            console.log('Accessibility Widget: Panel in Shadow DOM:', !!panelCheck);

            

            // Debug: Check panel visibility

            if (panelCheck) {

                const computedStyle = window.getComputedStyle(panelCheck);

                console.log('Accessibility Widget: Panel computed styles:');

                console.log('- display:', computedStyle.display);

                console.log('- visibility:', computedStyle.visibility);

                console.log('- opacity:', computedStyle.opacity);

                console.log('- right:', computedStyle.right);

                console.log('- z-index:', computedStyle.zIndex);

            }

        }, 100);
        
        // Setup hide interface modal after a short delay to ensure elements are ready
        setTimeout(() => {
            this.setupHideInterfaceModal();
        }, 200);

    }



    getWidgetCSS() {

        return `
        /* Import FontAwesome for icons */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        /* Force icon shape overrides - must come first */
        .accessibility-icon {
            /* REMOVED empty rule that was potentially conflicting */
        }
        
        /* Override external CSS with maximum specificity */
        .accessibility-icon[data-shape="circle"] {
            border-radius: 50% !important;
            -webkit-border-radius: 50% !important;
            -moz-border-radius: 50% !important;
        }
        
        .accessibility-icon[data-shape="rounded"] {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        .accessibility-icon[data-shape="square"] {
            border-radius: 0px !important;
            -webkit-border-radius: 0px !important;
            -moz-border-radius: 0px !important;
        }
        
        /* ULTRA-AGGRESSIVE OVERRIDE FOR ROUNDED SHAPE */
        .accessibility-icon.rounded,
        .accessibility-icon[data-shape="rounded"],
        .accessibility-icon.rounded[data-shape="rounded"],
        .accessibility-icon[data-shape="rounded"].rounded {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Force rounded shape with absolute maximum specificity */
        .accessibility-icon.rounded[data-shape="rounded"] {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Override any external CSS that might be forcing circle shape */
        .accessibility-icon[data-shape="rounded"]:not([data-shape="circle"]) {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Force rounded shape with absolute maximum specificity */
        .accessibility-icon.rounded,
        .accessibility-icon[data-shape="rounded"] {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Override any external CSS that might be forcing circle shape */
        .accessibility-icon[data-shape="rounded"]:not([data-shape="circle"]) {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Maximum specificity override for rounded shape */
        .accessibility-icon.rounded[data-shape="rounded"] {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Force rounded shape with absolute maximum specificity */
        .accessibility-icon[data-shape="rounded"].rounded {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Override any external CSS with maximum force */
        .accessibility-icon[data-shape="rounded"] {
            border-radius: 12px !important;
            -webkit-border-radius: 12px !important;
            -moz-border-radius: 12px !important;
        }
        
        /* Force panel positioning */
        .accessibility-panel {
            position: fixed !important;
            z-index: 100001 !important;
            display: none !important; /* Hidden by default */
        }
        
        .accessibility-panel.show {
            display: block !important;
            visibility: visible !important;
        }
        
        /* Mobile responsiveness - handled by main responsive CSS above */
        
        @media (max-width: 480px) {
            .accessibility-icon {
                width: 45px !important;
                height: 45px !important;
            }
            
            .accessibility-icon i {
                /* Font size controlled by JavaScript */
            }
            
            .accessibility-panel {
                width: 95vw !important;
                max-width: 350px !important;
            }
        }
            /* Accessibility Widget Styles - Shadow DOM */

            :host {

                position: fixed;

                top: 0;

                left: 0;

                width: 100%;

                height: 100%;

                pointer-events: none;

                z-index: 99998;

                isolation: isolate;

                contain: layout style paint;

            }



            /* Ensure icon positioning is always fixed and not affected by host context */

            .accessibility-icon {

                position: fixed !important;

                z-index: 99998 !important;
                
                /* Ensure JavaScript positioning takes precedence */
                top: unset !important;
                bottom: unset !important;
                left: unset !important;
                right: unset !important;
                transform: unset !important;

            }



            /* Accessibility Icon - Visual styling */

            .accessibility-icon {

                width: 60px;

                height: 60px;

                background: #6366f1;

                display: flex;

                align-items: center;

                justify-content: center;

                cursor: pointer;

                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

                transition: all 0.3s ease;

                pointer-events: auto;

                z-index: 99998;

            }



            .accessibility-icon:hover {

                transform: scale(1.1);

                background: #4f46e5;

            }



            .accessibility-icon i {

                color: #ffffff;

                font-size: 24px;

            }



            /* CRITICAL: Focus indicators for keyboard navigation in Shadow DOM */

            .accessibility-icon:focus {

                
            }

            /* Allow focus indicators when highlight-focus is active */
            body.highlight-focus .accessibility-icon:focus {
                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
            }
            
            /* Additional focus styles for accessibility icon when keyboard navigation is active */
            body.highlight-focus #accessibility-icon:focus {
                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3) !important;
            }



            /* Focus indicators for all interactive elements */

            input:focus,

            button:focus,

            select:focus,

            label:focus,

            .action-btn:focus,

            .scaling-btn:focus,

            .close-btn:focus,

            .language-selector:focus {

        
             outline-offset: 0px !important;
             box-shadow: none !important;   

            }



            .toggle-switch input:focus + .slider {

                 outline: none !important;
            }
            
            /* Override for accessibility icon to show focus when keyboard navigation is active */
            body.highlight-focus .accessibility-icon:focus,
            body.highlight-focus #accessibility-icon:focus {
                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3) !important;
            }



            /* Focus indicator for profile items (entire feature row) */

            .profile-item:focus,

            .profile-item:focus-within {

                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
            }



            .profile-item:focus {

               outline: 3px solid #6366f1 !important;
               outline-offset: 2px !important;
               background: rgba(99, 102, 241, 0.1) !important;
               border-radius: 4px !important;
               transition: outline 0.2s ease, background 0.2s ease !important;
            }



            /* Screen reader only content */

            .sr-only {

                position: absolute !important;

                width: 1px !important;

                height: 1px !important;

                padding: 0 !important;

                margin: -1px !important;

                overflow: hidden !important;

                clip: rect(0, 0, 0, 0) !important;

                white-space: nowrap !important;

                border: 0 !important;

            }



            /* Focus indicators for keyboard navigation */

            .accessibility-icon:focus,

            .accessibility-panel button:focus,

            .accessibility-panel input:focus,

            .accessibility-panel label:focus {

                
                outline-offset: 0px !important;
                box-shadow: none !important;

            }

            /* Allow focus indicators when highlight-focus is active (document scope) */
            body.highlight-focus .accessibility-icon:focus,
            body.highlight-focus .accessibility-panel button:focus,
            body.highlight-focus .accessibility-panel input:focus,
            body.highlight-focus .accessibility-panel label:focus {
                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
            }

            /* Ensure focus styles work inside Shadow DOM when body has highlight-focus */
            :host-context(.highlight-focus) #accessibility-icon:focus,
            :host-context(.highlight-focus) .accessibility-icon:focus,
            :host-context(.highlight-focus) .accessibility-panel button:focus,
            :host-context(.highlight-focus) .accessibility-panel input:focus,
            :host-context(.highlight-focus) .accessibility-panel label:focus {
                outline: 3px solid #6366f1 !important;
                outline-offset: 2px !important;
                background: rgba(99, 102, 241, 0.1) !important;
                border-radius: 4px !important;
                transition: outline 0.2s ease, background 0.2s ease !important;
            }

            /* High contrast focus for better visibility */

            .accessibility-icon:focus-visible,

            .accessibility-panel button:focus-visible,

            .accessibility-panel input:focus-visible {

                

            }



            /* Accessibility Panel - Fixed position on right side */

            .accessibility-panel {

                position: fixed;

                width: 500px !important;

                height: 700px !important;

                background: #ffffff !important;

                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;

                z-index: 100000 !important;

                transition: left 0.3s ease;

                overflow-y: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;

                overflow-x: hidden;

                font-family: 'DM Sans', sans-serif !important;

                border-radius: 8px !important;

                margin: 0 20px;

                pointer-events: auto;

                /* Text wrapping to prevent cutoff */
                word-wrap: break-word !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                hyphens: auto !important;

                /* Make panel a containing block for modal */
                position: relative;

}

            .accessibility-panel.active {

                display: block !important;

                visibility: visible !important;

                opacity: 1 !important;

            }

            

            /* Responsive Design - handled by main responsive CSS above */
                

                .accessibility-panel.active {

                    left: 20px !important;

                }

            }

            

            @media (max-width: 480px) {

                .accessibility-icon {

                    width: 45px !important;

                    height: 45px !important;

                    /* Position controlled by JS; do not force a corner here */

                }

                

                .accessibility-icon i {

                    /* Font size controlled by JavaScript */

                }

                

                .accessibility-panel {

                    width: 500px !important;

                    margin: 0 10px !important;

                    height: 700px !important;

                }

                

                .accessibility-panel.active {

                    left: 10px !important;

                }

            }



            /* Panel Header */

            .panel-header {

                display: flex;

                flex-direction: column;

                padding: 20px;

                background: transparent !important;

                color: #ffffff !important;

                border-radius: 24px !important;

                border: 4px solid #ffffff !important;

                border-bottom: none !important;

                position: relative;

                z-index: 1002;

                overflow: hidden;

                min-height: 210px;

            }



            .panel-header::before {

                content: '';

                position: absolute;

                top: 4px;

                left: 4px;

                right: 4px;

                bottom: 0;

                background: linear-gradient(135deg, #262E84, #2AA2F1);

                border-radius: 16px 16px 0 0;

                z-index: -1;

            }



            .close-btn {

                cursor: pointer !important;

                font-size: 24px;

                padding: 12px !important;

                position: absolute !important;

                top: 4px !important;

                left: 8px !important;

                z-index: 1005 !important;

                background: transparent !important;

                border: none !important;

                color: white;

                /* Increased clickable area */
                width: 48px !important;
                height: 48px !important;
                min-width: 48px !important;
                min-height: 48px !important;
                max-width: 48px !important;
                max-height: 48px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                outline: none !important;
                border-radius: 8px !important;
                transition: background-color 0.2s ease !important;
                
                /* Ensure the entire button area is clickable */
                position: relative !important;
                overflow: visible !important;

            }



            .close-btn:hover {

                color: white;
                background-color: rgba(255, 255, 255, 0.1) !important;

            }

            /* Ensure entire close button area is clickable */
            .close-btn * {
                pointer-events: none !important;
            }

            .close-btn {
                pointer-events: auto !important;
                cursor: pointer !important;
            }
            
            /* Make sure the button itself captures all clicks */
            .close-btn::before,
            .close-btn::after {
                pointer-events: none !important;
            }
            
            /* Ensure the button background captures all clicks */
            .close-btn {
                background-color: transparent !important;
                background-image: none !important;
            }
            
            /* Make sure no child elements interfere with clicks */
            .close-btn i,
            .close-btn span,
            .close-btn div {
                pointer-events: none !important;
                user-select: none !important;
                position: relative !important;
                z-index: 2 !important;
            }
            
            /* Create a full-coverage clickable area */
            .close-btn::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                pointer-events: auto !important;
                z-index: 1 !important;
            }



            .header-content {

                display: flex;

                flex-direction: column;

                align-items: center;

                gap: 15px;

                margin-top: 10px;

                position: relative;

                z-index: 1005;

            }





            /* Panel Content */

            .accessibility-panel h2 {

                text-align: center;

                margin: 0 0 20px 0;

                color: #ffffff;

                font-family: 'DM Sans', sans-serif;

                font-weight: 600;

                font-style: normal;

                font-size: 24px;

                line-height: 100%;

                letter-spacing: -0.03em;

                position: relative;

                z-index: 1005;

            }

            

            /* Profile descriptions - ensure text wraps properly */

            .profile-description {

                word-wrap: break-word;

                word-break: break-word;

                overflow-wrap: break-word;

                hyphens: auto;

                line-height: 1.4;

                margin: 8px 0;

            }

            

            .profile-description p {

                margin: 4px 0;

                font-size: 13px;

                color: #64748b;

            }

            

            /* Ensure profile items don't overflow */

            .profile-item {

                word-wrap: break-word !important;

                overflow-wrap: break-word !important;
                
                word-break: break-word !important;
                
                hyphens: auto !important;

            }

            

            .profile-info {

                flex: 1;

                min-width: 0; /* Allow flex item to shrink */

            }

            

            .profile-info div {

                min-width: 0; /* Allow text to wrap */
                
                word-wrap: break-word !important;
                
                word-break: break-word !important;
                
                overflow-wrap: break-word !important;
                
                hyphens: auto !important;

            }



            .action-buttons {

                display: flex;

                flex-direction: column;

                gap: 10px;

                justify-content: center;

                align-items: center;

            }



            .button-row {

                display: flex;

                flex-direction: row;

                gap: 10px;

                justify-content: center;

                align-items: center;

            }



            .action-btn {

                display: flex;

                align-items: center;

                gap: 8px;

                padding: 8px 16px;

                background: rgba(217, 217, 217, 0.3) !important;

                border: 2px solid rgba(217, 217, 217, 0.3) !important;

                color: #ffffff !important;

                border-radius: 30px;

                cursor: pointer;

                font-weight: 600;

                transition: all 0.3s ease;

                white-space: nowrap;

                font-size: 12px;

                justify-content: center;

            }



            .action-btn:hover {

                background: #6366f1;

                color: #ffffff;

                transform: translateY(-1px);

                box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);

            }



            /* White Content Section */

            .white-content-section {

                padding: 0 20px 20px;

                background: #ffffff !important;

                border-radius: 40px 40px 0 0 !important;

                margin-top: -30px !important;

                position: relative;

                z-index: 1003;

                padding-top: 12px;

            }



            .white-content-section h3 {

                color: #334155;

                margin-top: 12px;

                margin-bottom: 12px;

                font-size: 18px;

                font-weight: 600;

                text-align: center;

            }



            .profile-item {

                display: flex;

                flex-direction: row;

                align-items: center;

                padding: 15px;

                background: transparent;

                border-radius: 0;

                margin-bottom: 0;

                transition: all 0.3s ease;

                border: none;

                border-top: 1px solid #e2e8f0;

                border-bottom: 1px solid #e2e8f0;

                min-height: 60px;

                gap: 12px;

            }



            .profile-item:first-child {

                border-top: 1px solid #e2e8f0;

            }



            .profile-item:hover {

                background: rgba(99, 102, 241, 0.05);

                border-top-color: #e2e8f0;

                border-bottom-color: #e2e8f0;

                transform: translateX(2px);

                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);

            }



            .profile-info {

                display: flex;

                flex-direction: column;

                flex: 1;

                min-width: 0;

                order: 2;

            }



            .profile-info i {

                font-size: 20px;

                color: #6366f1;

                width: 24px;

                flex-shrink: 0;

            }



            .profile-info h4 {

                margin: 0;

                font-size: 16px;

                color: #334155;

                font-weight: 600;

                white-space: normal !important;

                overflow: visible !important;

                text-overflow: unset !important;
                
                word-wrap: break-word !important;
                
                word-break: break-word !important;
                
                overflow-wrap: break-word !important;
                
                hyphens: auto !important;

            }



            .profile-info p {

                margin: 5px 0 0 !important;

                font-size: 14px;

                color: #64748b;

                white-space: normal !important;

                overflow: visible !important;

                text-overflow: unset !important;
                
                word-wrap: break-word !important;
                
                word-break: break-word !important;
                
                overflow-wrap: break-word !important;
                
                hyphens: auto !important;

            }



            .profile-info small {

                display: block;

                margin: 3px 0 0;

                font-size: 12px;

                color: #6366f1;

                font-style: italic;

                white-space: nowrap;

                overflow: hidden;

                text-overflow: ellipsis;

            }



            /* Toggle Switch */

            .toggle-switch {

                position: relative;

                display: inline-block;

                width: 80px !important;

                height: 40px !important;

                flex-shrink: 0;

            }



            .toggle-switch input {

                opacity: 0;

                width: 0;

                height: 0;

            }



            .slider {

                position: absolute;

                cursor: pointer;

                top: 0;

                left: 0;

                right: 0;

                bottom: 0;

                background-color: #e5e7eb;

                transition: 0.3s;

                border-radius: 20px !important;

            }



            .slider:before {

                position: absolute;

                content: "";

                height: 32px;

                width: 32px;

                left: 4px;

                bottom: 4px;

                background-color: #ffffff;

                transition: 0.3s;

                /* border-radius: 50%; REMOVED - conflicts with shape settings */

                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

            }



            input:checked + .slider {

                background-color: #e5e7eb !important;

            }



            input:checked + .slider:before {

                transform: translateX(26px) !important;

            }



            /* Toggle Switch Text Labels */

            .slider::after {

                content: "OFF";

                position: absolute;

                top: 50%;

                left: 20px; /* Position relative to knob center */

                transform: translateY(-50%) translateX(-50%);

                font-size: 12px;

                font-weight: bold;

                color: #374151;

                pointer-events: none;

                transition: 0.3s;

                font-family: 'DM Sans', sans-serif;

            }



            .slider:before {

                position: absolute;

                content: "";

                height: 32px;

                width: 50px;

                left: 4px;

                bottom: 4px;

                background-color: #ffffff;

                transition: 0.3s;

                border-radius: 16px;

                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

                display: flex;

                align-items: center;

                justify-content: center;

                font-size: 12px;

                font-weight: bold;

                color: #374151;

                font-family: 'DM Sans', sans-serif;

            }



            input:checked + .slider::after {

                content: "ON";

                color: white;

                left: auto;

                right: 20px; /* Position relative to knob center */
                
                transform: translateY(-50%) translateX(50%);

            }



            input:checked + .slider:before {

                background-color: #4F46E5;

                color: white;

            }



            /* Panel Footer */

            .panel-footer {

                position: sticky;

                bottom: 0;

                background: linear-gradient(135deg, #262E84, #2AA2F1) !important;

                color: #ffffff;

                padding: 15px 20px;

                display: flex;

                justify-content: center;

                align-items: center;

                font-size: 14px;

                border-radius: 0 0 8px 8px !important;

                z-index: 1001;

            }



            .panel-footer .learn-more {

                color: #ffffff;

                text-decoration: none;

                font-weight: 600;

            }



            /* Language Selector Header Styles */

            .language-selector-header {

                display: flex;

                align-items: center;

                gap: 6px;

                cursor: pointer;

                padding: 6px 10px;

                border-radius: 6px;

                transition: background-color 0.2s ease;

                color: #ffffff;

                font-size: 12px;

                font-weight: 500;

                position: absolute;

                top: 5px;

                right: 10px;

                z-index: 1002;

            }



            .language-selector-header:hover {

                background: rgba(255, 255, 255, 0.1);

            }



            .language-selector-header .current-flag {

                font-size: 16px;

            }



            .language-selector-header i.fa-chevron-down {

                font-size: 10px;

                transition: transform 0.2s ease;

                opacity: 0.8;

            }



            .language-selector-header:hover i.fa-chevron-down {

                transform: translateY(1px);

            }



            /* Language Dropdown Styles */

            .language-dropdown {

                position: sticky !important;
                top: 0 !important;

                /* Keep dropdown in panel viewport when scrolling */
                position: fixed !important;

                background: #ffffff !important;

                border-radius: 12px !important;

                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;

                border: 1px solid #e5e7eb !important;

                z-index: 100001 !important;

                width: 400px !important;

                max-height: 400px !important;

                overflow-y: auto !important;

                overflow-x: hidden !important;

                animation: dropdownSlideIn 0.2s ease-out !important;

                transform: none !important;

                clip: none !important;

                display: none !important;

                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;

                pointer-events: auto !important;

                /* Ensure dropdown is positioned relative to panel */

                margin: 0 !important;

                padding: 0 !important;

            }

            

            /* Force dropdown to be visible when shown */

            .language-dropdown[style*="display: block"] {

                display: block !important;

                visibility: visible !important;

                opacity: 1 !important;

                pointer-events: auto !important;

            }



            @keyframes dropdownSlideIn {

                from {

                    opacity: 0;

                    transform: translateY(-10px);

                }

                to {

                    opacity: 1;

                    transform: translateY(0);

                }

            }



            .language-dropdown-content {

                padding: 20px !important;

                background: #ffffff !important;

                min-height: 100px !important;

            }



            .language-option {

                display: flex;

                align-items: center;

                gap: 12px;

                padding: 12px 16px;

                border: none;

                border-radius: 8px;

                background: transparent;

                cursor: pointer;

                transition: all 0.2s ease;

                font-size: 14px;

                font-weight: 500;

                color: #374151;

                text-align: left;

                width: 100%;

                margin-bottom: 4px;

                font-family: inherit;

            

                pointer-events: auto !important;

                user-select: none;

            }



            .language-option:hover {

                background: #f3f4f6;

            }



            .language-option.selected,
            .language-option[aria-selected="true"] {

                background: #6366f1 !important;

                color: #ffffff !important;

            }

            .language-option.selected:hover,
            .language-option[aria-selected="true"]:hover {

                background: #4f46e5 !important;

            }



            .language-option .flag {

                font-size: 16px;

                flex-shrink: 0;

            }



            .language-option .language-name {

                flex: 1;

                font-weight: 500;

                font-size: 14px;

            }



            /* Global Accessibility Feature Classes - These will sync with main page */

            :host(.seizure-safe) .accessibility-icon,

            :host(.seizure-safe) .accessibility-panel {

                filter: grayscale(0.8) contrast(0.9) !important;

            }

            

            /* Ensure seizure safe icon stays in correct position */

            :host(.seizure-safe) .accessibility-icon {

                position: fixed !important;

                z-index: 99998 !important;

            }



            /* Vision Impaired - Responsive scaling approach */

            :host(.vision-impaired) {

                filter: saturate(1.1) brightness(1.05) !important;

                /* Use CSS custom properties for responsive scaling */

                --vision-scale: 1.2;

                --vision-font-scale: 1.15;

            }



            /* Scale icon and panel with responsive units */

            :host(.vision-impaired) .accessibility-icon {

                width: calc(60px * var(--vision-scale)) !important;

                height: calc(60px * var(--vision-scale)) !important;

                font-size: calc(24px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel {

                width: calc(400px * var(--vision-scale)) !important;

                font-size: calc(1em * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel h2 {

                font-size: calc(24px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel h3 {

                font-size: calc(18px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel h4 {

                font-size: calc(16px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel p {

                font-size: calc(14px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel .action-btn {

                font-size: calc(1em * var(--vision-font-scale)) !important;

                padding: calc(12px * var(--vision-font-scale)) calc(16px * var(--vision-font-scale)) !important;

            }



            :host(.vision-impaired) .accessibility-panel * {

                font-size: 1em !important;

            }



            :host(.vision-impaired) .accessibility-panel h1 {

                font-size: 1.5em !important;

            }



            :host(.vision-impaired) .accessibility-panel h2 {

                font-size: 1.3em !important;

            }



            :host(.vision-impaired) .accessibility-panel h3 {

                font-size: 1.2em !important;

            }



            :host(.vision-impaired) .accessibility-panel h4 {

                font-size: 1.1em !important;

            }



            :host(.adhd-friendly) .accessibility-icon,

            :host(.adhd-friendly) .accessibility-panel {

                filter: saturate(0.9) brightness(0.9) !important;

            }



            :host(.cognitive-disability) .accessibility-icon,

            :host(.cognitive-disability) .accessibility-panel {

                filter: saturate(1.2) brightness(1.1) !important;

            }







            :host(.monochrome) .accessibility-icon,

            :host(.monochrome) .accessibility-panel {

                filter: grayscale(1) !important;

            }



            :host(.dark-contrast) .accessibility-icon,

            :host(.dark-contrast) .accessibility-panel {

                filter: saturate(1.2) brightness(0.8) contrast(1.3) !important;

            }



            :host(.light-contrast) .accessibility-icon,

            :host(.light-contrast) .accessibility-panel {

                filter: saturate(1.2) brightness(1.2) contrast(0.9) !important;

            }



            /* Reduce high contrast intensity for Shadow DOM content */

            :host(.high-contrast) .accessibility-icon,

            :host(.high-contrast) .accessibility-panel,

            :host(.high-contrast) .accessibility-panel * {

                filter: contrast(0.8) !important;

                -webkit-filter: contrast(0.8) !important;

            }





            /* Default font styles for widget elements (when readable font is disabled) */

            :host(:not(.readable-font)) .accessibility-icon,

            :host(:not(.readable-font)) .accessibility-panel {

                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;

                font-weight: normal !important;

                letter-spacing: normal !important;

            }



            :host(:not(.readable-font)) .accessibility-panel h2,

            :host(:not(.readable-font)) .accessibility-panel h3,

            :host(:not(.readable-font)) .accessibility-panel h4,

            :host(:not(.readable-font)) .accessibility-panel p,

            :host(:not(.readable-font)) .accessibility-panel .action-btn,

            :host(:not(.readable-font)) .accessibility-panel button,

            :host(:not(.readable-font)) .accessibility-panel input,

            :host(:not(.readable-font)) .accessibility-panel label {

                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;

                font-weight: normal !important;

                letter-spacing: normal !important;

            }



            /* Readable Font - Apply to widget elements (must come after default rules) */

            :host(.readable-font) .accessibility-icon,

            :host(.readable-font) .accessibility-panel {

                font-family: 'Arial', 'Open Sans', sans-serif !important;

                font-weight: 500 !important;

                letter-spacing: 0.5px !important;

            }



            :host(.readable-font) .accessibility-panel h2,

            :host(.readable-font) .accessibility-panel h3,

            :host(.readable-font) .accessibility-panel h4,

            :host(.readable-font) .accessibility-panel p,

            :host(.readable-font) .accessibility-panel .action-btn,

            :host(.readable-font) .accessibility-panel button,

            :host(.readable-font) .accessibility-panel input,

            :host(.readable-font) .accessibility-panel label {

                font-family: 'Arial', 'Open Sans', sans-serif !important;

                font-weight: 500 !important;

                letter-spacing: 0.5px !important;

            }



            :host(.high-saturation) .accessibility-icon,

            :host(.high-saturation) .accessibility-panel {

                filter: saturate(1.5) !important;

            }



            /* Font Awesome Icons */

            .fas {

                font-family: 'Font Awesome 5 Free';

                font-weight: 900;

            }







            .fa-universal-access:before {

                content: "\\f29a";

            }



            .fa-times:before {

                content: "\\f00d";

            }



            .fa-flag:before {

                content: "\\f024";

            }



            .fa-redo:before {

                content: "\\f01e";

            }



            .fa-file-alt:before {

                content: "\\f15c";

            }



            .fa-eye-slash:before {

                content: "\\f070";

            }



            .fa-bolt:before {

                content: "\\f0e7";

            }



            .fa-eye:before {

                content: "\\f06e";

            }



            .fa-brain:before {

                content: "\\f5dc";

            }



            .fa-keyboard:before {

                content: "\\f11c";

            }



            .fa-user:before {

                content: "\\f007";

            }



            .fa-search-plus:before {

                content: "\\f00e";

            }



            .fa-font:before {

                content: "\\f031";

            }



            .fa-heading:before {

                content: "\\f1dc";

            }



            .fa-link:before {

                content: "\\f0c1";

            }



            .fa-search:before {

                content: "\\f002";

            }



            .fa-align-center:before {

                content: "\\f037";

            }



            .fa-arrows-alt-v:before {

                content: "\\f07d";

            }



            .fa-text-width:before {

                content: "\\f035";

            }



            .fa-palette:before {

                content: "\\f53f";

            }



            .fa-volume-mute:before {

                content: "\\f6a9";

            }



            .fa-image:before {

                content: "\\f03e";

            }



            .fa-book-open:before {

                content: "\\f518";

            }



            .fa-compass:before {

                content: "\\f14e";

            }



            .fa-list:before {

                content: "\\f03a";

            }



            .fa-play:before {

                content: "\\f04b";

            }



            .fa-mask:before {

                content: "\\f6fa";

            }



            .fa-mouse-pointer:before {

                content: "\\f245";

            }



            /* Color Picker Inline */

            .color-picker-inline {

                margin: 8px 0;

                padding: 12px;

                background: #f8f9fa;

                border-radius: 6px;

                border: 1px solid #e2e8f0;

                width: 100%;

                box-sizing: border-box;

            }



            .color-picker-content {

                text-align: center;

            }



            .color-picker-content h4 {

                margin: 0 0 12px 0;

                color: #333;

                font-size: 14px;

                font-weight: 600;

            }



            .color-options {

                display: flex;

                justify-content: center;

                gap: 8px;

                margin-bottom: 12px;

                flex-wrap: wrap;

            }



            .color-option {

                width: 28px;

                height: 28px;

                /* border-radius: 50%; REMOVED - conflicts with shape settings */

                cursor: pointer;

                border: 2px solid transparent;

                transition: all 0.2s ease;

                position: relative;

                flex-shrink: 0;

            }



            .color-option:hover {

                transform: scale(1.1);

                border-color: #6366f1;

            }



            .color-option.selected {

                border-color: #6366f1;

                box-shadow: 0 0 0 1px #fff, 0 0 0 3px #6366f1;

            }



            .cancel-btn {

                background: #6b7280;

                color: white;

                border: none;

                padding: 8px 16px;

                border-radius: 4px;

                cursor: pointer;

                font-size: 12px;

                font-weight: 500;

                transition: background-color 0.2s ease;

            }



            .cancel-btn:hover {

                background: #4b5563;

            }



            /* Ensure profile item has relative positioning for absolute toggle */

            .profile-item.has-dropdown {

                position: relative !important;

            }



            /* Ensure toggle switch stays in position when dropdown is present */

            .profile-item.has-dropdown .toggle-switch {

                flex-shrink: 0 !important;

            }



            .profile-item.has-dropdown .profile-info {

                padding-left: 0 !important;
                margin-bottom: 0 !important;

            }



            /* Enhanced dropdown styling */

            .useful-links-dropdown {

                margin: 10px 0;

                padding: 0;

                width: 100%;

                display: block;

                background: #f8fafc;

                border-radius: 8px;

                border: 1px solid #e2e8f0;

                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

                transition: all 0.3s ease;

            }



            .useful-links-dropdown:hover {

                border-color: #6366f1;

                box-shadow: 0 4px 10px rgba(99, 102, 241, 0.12);

            }



            .useful-links-content {

                padding: 10px;

            }



            .useful-links-content select {

                width: 100%;

                padding: 10px 14px;

                border: 1px solid #6366f1;

                border-radius: 6px;

                background: white;

                color: #374151;

                font-size: 13px;

                font-weight: 500;

                font-family: 'DM Sans', sans-serif;

                cursor: pointer;

                transition: all 0.3s ease;

                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

                appearance: none;

                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");

                background-position: right 10px center;

                background-repeat: no-repeat;

                background-size: 14px;

                padding-right: 35px;

            }



            .useful-links-content select:focus {

                outline: 3px solid #4f46e5 !important;

                outline-offset: 2px !important;

                border-color: #4f46e5;

                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15);

                transform: translateY(-1px);

            }



            .useful-links-content select:hover {

                border-color: #4f46e5;

                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

                transform: translateY(-1px);

            }



            .useful-links-content select option {

                padding: 12px 16px;

                background: white;

                color: #374151;

                font-weight: 500;

                border: none;

            }



            .useful-links-content select option:hover {

                background: #f3f4f6;

                color: #1f2937;

            }



            .useful-links-content select option:selected {

                background: #6366f1;

                color: white;

            }

            /* Big Black Cursor - Proper Arrow Headed - MAXIMUM SPECIFICITY */
body.big-black-cursor,
html body.big-black-cursor,
body.big-black-cursor *,
html body.big-black-cursor * {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 0 L0 40 L12 28 L20 36 L24 32 L16 24 L40 24" fill="black" stroke="white" stroke-width="2"/></svg>') 0 0, auto !important;
}

/* Big White Cursor - Proper Arrow Headed - MAXIMUM SPECIFICITY */
body.big-white-cursor,
html body.big-white-cursor,
body.big-white-cursor *,
html body.big-white-cursor * {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 0 L0 40 L12 28 L20 36 L24 32 L16 24 L40 24" fill="white" stroke="black" stroke-width="2"/></svg>') 0 0, auto !important;
}
            /* Hide Interface Modal Styles */
            .hide-interface-modal {
                position: sticky !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100001;
                /* Keep modal in panel viewport when scrolling */
                width: 100% !important;
                height: 100% !important;
                min-height: 100% !important;
                /* Ensure overlay covers full scrollable area */
                max-height: none;
                overflow: hidden;
            }

            .hide-interface-modal .modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 12px rgba(0, 0, 0, 0.3);
                /* Position the modal dialog in the center of viewable area */
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                /* Ensure it stays within the panel bounds */
                max-width: 400px;
                width: 90%;
                max-height: 80%;
                overflow: hidden;
            }

            .hide-interface-modal .modal-header {
                padding: 20px 20px 10px 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .hide-interface-modal .modal-header h3 {
                margin: 0;
                color: #1f2937;
                font-size: 18px;
                font-weight: 600;
            }

            .hide-interface-modal .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #6b7280;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .hide-interface-modal .modal-close:hover {
                color: #374151;
            }

            .hide-interface-modal .modal-body {
                padding: 20px;
            }

            .hide-interface-modal .modal-body p {
                margin: 0;
                color: #374151;
                line-height: 1.5;
                font-size: 14px;
            }

            .hide-interface-modal .modal-footer {
                padding: 10px 20px 20px 20px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .hide-interface-modal .modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .hide-interface-modal .accept-btn {
                background: #3b82f6;
                color: white;
            }

            .hide-interface-modal .accept-btn:hover {
                background: #2563eb;
            }

            .hide-interface-modal .cancel-btn {
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .hide-interface-modal .cancel-btn:hover {
                background: #f9fafb;
            }

        `;

    }



    getPanelHTML() {

        return `

            <div class="panel-header">

                <div class="close-btn" id="close-panel">

                    ×
                </div>

                <div class="header-content">

                    <h2>Accessibility Adjustments</h2>

                    <div class="action-buttons">

                        <div class="button-row">

                            <button id="reset-settings" class="action-btn">

                                <i class="fas fa-redo"></i>

                                Reset Settings

                            </button>

                            <button id="statement" class="action-btn">

                                <i class="fas fa-file-alt"></i>

                                Statement

                            </button>

                        </div>

                        <div class="button-row">

                            <button id="hide-interface" class="action-btn">

                                <i class="fas fa-eye-slash"></i>

                                Hide Interface

                            </button>

                        </div>

                    </div>

                </div>

                <div class="language-selector-header" id="language-selector-header">

                    <span id="current-language-header">ENGLISH</span>

                    <i class="fas fa-chevron-down"></i>

                </div>

            </div>



            <div class="white-content-section">

                <h3>Choose the right accessibility profile for you</h3>

                

                <!-- Module 1: Seizure Safe Profile -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="seizure-safe" aria-label="Seizure Safe Profile - Clear flashes and reduces color" aria-describedby="seizure-safe-desc">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Seizure Safe Profile</h4>

                            <p id="seizure-safe-desc">Clear flashes & reduces color</p>

                        </div>

                    </div>

                </div>



                <!-- Module 2: Vision Impaired Profile -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="vision-impaired" aria-label="Vision Impaired Profile - Enhances website's visuals" aria-describedby="vision-impaired-desc">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Vision Impaired Profile</h4>

                            <p id="vision-impaired-desc">Enhances website's visuals</p>

                        </div>

                    </div>

                </div>



                <!-- Module 3: ADHD Friendly Profile -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="adhd-friendly">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>ADHD Friendly Profile</h4>

                            <p>More focus & fewer distractions</p>

                        </div>

                    </div>

                </div>



                <!-- Module 4: Cognitive Disability Profile -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="cognitive-disability">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Cognitive Disability Profile</h4>

                            <p>Assists with reading & focusing</p>

                        </div>

                    </div>

                </div>



                <!-- Module 5: Keyboard Navigation -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="keyboard-nav">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Keyboard Navigation (Motor)</h4>

                            <p>Use website with the keyboard</p>

                            <div class="profile-description">

                                <p>This profile enables motor-impaired persons to operate the website using keyboard keys and shortcuts</p>


                            </div>

                            <small style="color: #6366f1; font-style: italic;">Activates with Screen Reader</small>

                        </div>

                    </div>

                </div>



                <!-- Module 6: Blind Users Screen Reader -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="screen-reader">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Blind Users (Screen Reader)</h4>

                            <p>Optimize website for screen-readers</p>

                            <div class="profile-description">

                                <p>This profile adjusts the website to be compatible with screen-readers such as JAWS, NVDA, VoiceOver, and TalkBack. Screen-reader software is installed on the blind user's computer and smartphone, and websites should ensure compatibility.</p>

                                

                            </div>

                            <small style="color: #6366f1; font-style: italic;">Activates with Keyboard Navigation</small>

                        </div>

                    </div>

                </div>



                <!-- Module 7: Content Scaling -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="content-scaling">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Content Scaling</h4>

                            <p>Scale content with arrow controls</p>

                            <div class="scaling-controls" id="content-scaling-controls" style="display: none; margin-top: 10px;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <button class="scaling-btn" id="decrease-content-scale-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-down"></i> -5%

                                    </button>

                                    <span id="content-scale-value" style="font-weight: bold; min-width: 60px; text-align: center;">100%</span>

                                    <button class="scaling-btn" id="increase-content-scale-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-up"></i> +5%

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Module 8: Readable Font -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="readable-font">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Readable Font</h4>

                            <p>High-legibility fonts</p>

                        </div>

                    </div>

                </div>



                <!-- Module 9: Highlight Titles -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="highlight-titles">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Highlight Titles</h4>

                            <p>Add boxes around headings</p>

                        </div>

                    </div>

                </div>



                <!-- Module 10: Highlight Links -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="highlight-links">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Highlight Links</h4>

                            <p>Add boxes around links</p>

                        </div>

                    </div>

                </div>



                <!-- Module 11: Text Magnifier -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="text-magnifier">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Text Magnifier</h4>

                            <p>Floating magnifying glass tool</p>

                        </div>

                    </div>

                </div>



                <!-- Module 12: Adjust Font Sizing -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="font-sizing" aria-label="Adjust Font Sizing - Font size with arrow controls" aria-describedby="font-sizing-desc">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Font Sizing</h4>

                            <p id="font-sizing-desc">Font size with arrow controls</p>

                            <div class="scaling-controls" id="font-sizing-controls" style="display: none; margin-top: 10px;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <button class="scaling-btn" id="decrease-font-size-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-down"></i> -10%

                                    </button>

                                    <span id="font-size-value" style="font-weight: bold; min-width: 60px; text-align: center;">100%</span>

                                    <button class="scaling-btn" id="increase-font-size-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-up"></i> +10%

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Module 13: Align Center -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="align-center">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Align Center</h4>

                            <p>Center-aligns all text content</p>

                        </div>

                    </div>

                </div>



                <!-- Module 15: Adjust Line Height -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="adjust-line-height">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Line Height</h4>

                            <p>Line height with arrow controls</p>

                            <div class="scaling-controls" id="line-height-controls" style="display: none; margin-top: 10px;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <button class="scaling-btn" id="decrease-line-height-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-down"></i> -10%

                                    </button>

                                    <span id="line-height-value" style="font-weight: bold; min-width: 60px; text-align: center;">100%</span>

                                    <button class="scaling-btn" id="increase-line-height-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-up"></i> +10%

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Module 16: Adjust Letter Spacing -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="adjust-letter-spacing">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Letter Spacing</h4>

                            <p>Letter spacing with arrow controls</p>

                            <div class="scaling-controls" id="letter-spacing-controls" style="display: none; margin-top: 10px;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <button class="scaling-btn" id="decrease-letter-spacing-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-down"></i> -10%

                                    </button>

                                    <span id="letter-spacing-value" style="font-weight: bold; min-width: 60px; text-align: center;">100%</span>

                                    <button class="scaling-btn" id="increase-letter-spacing-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">

                                        <i class="fas fa-chevron-up"></i> +10%

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Module 17: Align Left -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="align-left">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Align Left</h4>

                            <p>Left-aligns text content</p>

                        </div>

                    </div>

                </div>



                <!-- Module 18: Align Right -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="align-right">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Align Right</h4>

                            <p>Right-aligns text content</p>

                        </div>

                    </div>

                </div>



                <!-- Module 19: Dark Contrast -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="dark-contrast">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Dark Contrast</h4>

                            <p>Dark background with light text</p>

                        </div>

                    </div>

                </div>



                <!-- Module 20: Light Contrast -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="light-contrast">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Light Contrast</h4>

                            <p>Light background with dark text</p>

                        </div>

                    </div>

                </div>



                <!-- Module 20: High Contrast -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="high-contrast">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>High Contrast</h4>

                            <p>Maximum contrast implementation</p>

                        </div>

                    </div>

                </div>



                <!-- Module 21: High Saturation -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="high-saturation">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>High Saturation</h4>

                            <p>Increases color intensity</p>

                        </div>

                    </div>

                </div>



                <!-- Module 22: Adjust Text Colors -->

                <div class="profile-item">

                    <label class="toggle-switch">

                        <input type="checkbox" id="adjust-text-colors">

                        <span class="slider"></span>

                    </label>

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Text Colors</h4>

                            <p>Color picker functionality</p>

                        </div>

                    </div>

                </div>



                <!-- Module 23: Monochrome -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Monochrome</h4>

                            <p>Removes all colors except black, white, grays</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="monochrome">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 24: Adjust Title Colors -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Title Colors</h4>

                            <p>Color customization for headings</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="adjust-title-colors">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 25: Low Saturation -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Low Saturation</h4>

                            <p>Reduces color intensity</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="low-saturation">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 26: Adjust Background Colors -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Adjust Background Colors</h4>

                            <p>Background color customization</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="adjust-bg-colors">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 27: Mute Sound -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Mute Sound</h4>

                            <p>Disables all audio content</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="mute-sound">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 28: Hide Images -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Hide Images</h4>

                            <p>Toggle to hide all images</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="hide-images">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 29: Read Mode -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Read Mode</h4>

                            <p>Removes navigation elements</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="read-mode">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 30: Reading Guide -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Reading Guide</h4>

                            <p id="reading-guide-desc">Movable highlight bar</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="reading-guide" aria-label="Reading Guide - Movable highlight bar" aria-describedby="reading-guide-desc">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 31: Useful Links -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Useful Links</h4>

                            <p id="useful-links-desc">Accessibility resources and links</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="useful-links" aria-label="Useful Links - Accessibility resources and links" aria-describedby="useful-links-desc">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 32: Stop Animation -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Stop Animation</h4>

                            <p>Pauses all CSS animations</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="stop-animation">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 33: Reading Mask -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Reading Mask</h4>

                            <p>Semi-transparent overlay</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="reading-mask">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 34: Highlight Hover -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Highlight Hover</h4>

                            <p>Visual feedback on hover</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="highlight-hover">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 35: Highlight Focus -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Highlight Focus</h4>

                            <p>Prominent focus indicators</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="highlight-focus">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 36: Big Black Cursor -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Big Black Cursor</h4>

                            <p>Increases cursor size</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="big-black-cursor">

                        <span class="slider"></span>

                    </label>

                </div>



                <!-- Module 37: Big White Cursor -->

                <div class="profile-item">

                    <div class="profile-info">

                        <div>

                            <h4>Big White Cursor</h4>

                            <p>Increases cursor size</p>

                        </div>

                    </div>

                    <label class="toggle-switch">

                        <input type="checkbox" id="big-white-cursor">

                        <span class="slider"></span>

                    </label>

                </div>

            </div>



            <div class="panel-footer">

                <div>

                    <i class="fas fa-check"></i>

                    

                </div>

            </div>

            <!-- Hide Interface Confirmation Modal -->
            <div id="hide-interface-modal" class="hide-interface-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="hide-modal-title">Hide Accessibility Interface?</h3>
                        <button class="modal-close" id="hide-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p id="hide-modal-text">Please note: If you choose to hide the accessibility interface, you won't be able to see it anymore, unless you clear your browsing history and data. Are you sure that you wish to hide the interface?</p>
                    </div>
                    <div class="modal-footer">
                        <button id="hide-modal-accept" class="modal-btn accept-btn">Accept</button>
                        <button id="hide-modal-cancel" class="modal-btn cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>

        `;

    }



    getLanguageDropdownContent() {

        return `

            <div class="language-dropdown-content">

                <!-- Available languages -->

                <button class="language-option" data-lang="en" data-flag="🇺🇸">

                    <span class="flag">🇺🇸</span>

                    <span class="language-name">English</span>

                </button>

                <button class="language-option" data-lang="de" data-flag="🇩🇪">

                    <span class="flag">🇩🇪</span>

                    <span class="language-name">Deutsch</span>

                </button>

                <button class="language-option" data-lang="fr" data-flag="🇫🇷">

                    <span class="flag">🇫🇷</span>

                    <span class="language-name">Français</span>

                </button>

                <button class="language-option" data-lang="he" data-flag="🇮🇱">

                    <span class="flag">🇮🇱</span>

                    <span class="language-name">עברית</span>

                </button>

                <button class="language-option" data-lang="ru" data-flag="🇷🇺">

                    <span class="flag">🇷🇺</span>

                    <span class="language-name">Русский</span>

                </button>

                <button class="language-option" data-lang="ar" data-flag="🇦🇪">

                    <span class="flag">🇦🇪</span>

                    <span class="language-name">العربية</span>

                </button>

                <button class="language-option" data-lang="es" data-flag="🇪🇸">

                    <span class="flag">🇪🇸</span>

                    <span class="language-name">Español</span>

                </button>

                <button class="language-option" data-lang="pt" data-flag="🇵🇹">

                    <span class="flag">🇵🇹</span>

                    <span class="language-name">Português</span>

                </button>

                <button class="language-option" data-lang="it" data-flag="🇮🇹">

                    <span class="flag">🇮🇹</span>

                    <span class="language-name">Italiano</span>

                </button>

                <button class="language-option" data-lang="tw" data-flag="🇹🇼">

                    <span class="flag">🇹🇼</span>

                    <span class="language-name">繁體中文</span>

                </button>

            </div>

        `;

    }



    getTranslations() {

        return {

            en: {

                title: "Accessibility Adjustments",

                profilesTitle: "Choose the right accessibility profile for you",

                seizureSafe: "Seizure Safe Profile",

                seizureSafeDesc: "Clear flashes & reduces color",

                visionImpaired: "Vision Impaired Profile", 

                visionImpairedDesc: "Enhances website's visuals",

                adhdFriendly: "ADHD Friendly Profile",

                adhdFriendlyDesc: "More focus & fewer distractions",

                cognitiveDisability: "Cognitive Disability Profile",

                cognitiveDisabilityDesc: "Assists with reading & focusing",

                keyboardNav: "Keyboard Navigation (Motor)",

                keyboardNavDesc: "Use website with the keyboard",

                screenReader: "Blind Users (Screen Reader)",

                screenReaderDesc: "Optimize website for screen-readers",

                contentScaling: "Content Scaling",

                contentScalingDesc: "Scale content with arrow controls",

                readableFont: "Readable Font",

                readableFontDesc: "High-legibility fonts",

                highlightTitles: "Highlight Titles",

                highlightTitlesDesc: "Add boxes around headings",

                highlightLinks: "Highlight Links",

                highlightLinksDesc: "Add boxes around links",

                textMagnifier: "Text Magnifier",

                textMagnifierDesc: "Floating magnifying glass tool",

                fontSizing: "Adjust Font Sizing",

                fontSizingDesc: "Font size with arrow controls",

                alignCenter: "Align Center",

                alignCenterDesc: "Center-aligns all text content",

                adjustLineHeight: "Adjust Line Height",

                adjustLineHeightDesc: "Line height with arrow controls",

                adjustLetterSpacing: "Adjust Letter Spacing",

                adjustLetterSpacingDesc: "Letter spacing with arrow controls",

                alignLeft: "Align Left",

                alignLeftDesc: "Left-aligns text content",

                alignRight: "Align Right",

                alignRightDesc: "Right-aligns text content",

                darkContrast: "Dark Contrast",

                darkContrastDesc: "Dark background with light text",

                lightContrast: "Light Contrast",

                lightContrastDesc: "Light background with dark text",

                highContrast: "High Contrast",

                highContrastDesc: "Maximum contrast implementation",

                highSaturation: "High Saturation",

                highSaturationDesc: "Increases color intensity",

                adjustTextColors: "Adjust Text Colors",

                adjustTextColorsDesc: "Color picker functionality",

                monochrome: "Monochrome",

                monochromeDesc: "Removes all colors except black, white, grays",

                adjustTitleColors: "Adjust Title Colors",

                adjustTitleColorsDesc: "Color customization for headings",

                lowSaturation: "Low Saturation",

                lowSaturationDesc: "Reduces color intensity",

                adjustBgColors: "Adjust Background Colors",

                adjustBgColorsDesc: "Background color customization",

                muteSound: "Mute Sound",

                muteSoundDesc: "Disables all audio content",

                hideImages: "Hide Images",

                hideImagesDesc: "Toggle to hide all images",

                readMode: "Read Mode",

                readModeDesc: "Removes navigation elements",

                readingGuide: "Reading Guide",

                readingGuideDesc: "Movable highlight bar",

                usefulLinks: "Useful Links",

                usefulLinksDesc: "Accessibility resources and links",

                stopAnimation: "Stop Animation",

                stopAnimationDesc: "Pauses all CSS animations",

                readingMask: "Reading Mask",

                readingMaskDesc: "Semi-transparent overlay",

                highlightHover: "Highlight Hover",

                highlightHoverDesc: "Visual feedback on hover",

                highlightFocus: "Highlight Focus",

                highlightFocusDesc: "Prominent focus indicators",

                bigBlackCursor: "Big Black Cursor",

                bigBlackCursorDesc: "Increases cursor size",

                bigWhiteCursor: "Big White Cursor",

                bigWhiteCursorDesc: "Increases cursor size",

                resetSettings: "Reset Settings",

                statement: "Statement",

                hideInterface: "Hide Interface",

                accessibilityFeatures: "Accessibility Features",

                // Additional detailed descriptions

                keyboardNavDetailed: "This profile enables motor-impaired persons to operate the website using keyboard keys (Tab, Shift+Tab, Enter) and shortcuts (e.g., \"M\" for menus, \"H\" for headings, \"F\" for forms, \"B\" for buttons, \"G\" for graphics).",

                keyboardNavNote: "Note: This profile prompts automatically for keyboard users.",

                screenReaderDetailed: "This profile adjusts the website to be compatible with screen-readers such as JAWS, NVDA, VoiceOver, and TalkBack. Screen-reader software is installed on the blind user's computer and smartphone, and websites should ensure compatibility.",

                screenReaderNote: "Note: This profile prompts automatically to screen-readers.",

                activatesWithScreenReader: "Activates with Screen Reader",

                activatesWithKeyboardNav: "Activates with Keyboard Navigation",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "Hide Accessibility Interface?",
                hideInterfaceModalText: "Please note: If you choose to hide the accessibility interface, you won't be able to see it anymore, unless you clear your browsing history and data. Are you sure that you wish to hide the interface?",
                hideInterfaceModalAccept: "Accept",
                hideInterfaceModalCancel: "Cancel",

                // Toggle switch text
                toggleOn: "ON",
                toggleOff: "OFF"

            },

            es: {
                title: "Ajustes de Accesibilidad",
                profilesTitle: "Elige el perfil de accesibilidad adecuado para ti",
    seizureSafe: "Perfil Anti-Convulsiones",
                seizureSafeDesc: "Elimina destellos y reduce colores",
    visionImpaired: "Perfil de Deficiencia Visual",
    visionImpairedDesc: "Mejora los elementos visuales del sitio web",
                adhdFriendly: "Perfil Amigable para TDAH",
                adhdFriendlyDesc: "Más enfoque y menos distracciones",
                cognitiveDisability: "Perfil de Discapacidad Cognitiva",
    cognitiveDisabilityDesc: "Ayuda con la lectura y concentración",
    keyboardNav: "Navegación por Teclado (Motora)",
                keyboardNavDesc: "Usar el sitio web con el teclado",
                screenReader: "Usuarios Ciegos (Lector de Pantalla)",
                screenReaderDesc: "Optimizar el sitio web para lectores de pantalla",
                contentScaling: "Escalado de Contenido",
    contentScalingDesc: "Escalar contenido con controles de flechas",
                readableFont: "Fuente Legible",
                readableFontDesc: "Fuentes de alta legibilidad",
                highlightTitles: "Resaltar Títulos",
    highlightTitlesDesc: "Agregar marcos alrededor de los títulos",
                highlightLinks: "Resaltar Enlaces",
    highlightLinksDesc: "Agregar marcos alrededor de los enlaces",
                textMagnifier: "Lupa de Texto",
                textMagnifierDesc: "Herramienta de lupa flotante",
                fontSizing: "Ajustar Tamaño de Fuente",
    fontSizingDesc: "Tamaño de fuente con controles de flechas",
    alignCenter: "Alinear al Centro",
    alignCenterDesc: "Centra todo el contenido de texto",
                adjustLineHeight: "Ajustar Altura de Línea",
    adjustLineHeightDesc: "Altura de línea con controles de flechas",
                adjustLetterSpacing: "Ajustar Espaciado de Letras",
    adjustLetterSpacingDesc: "Espaciado de letras con controles de flechas",
    alignLeft: "Alinear a la Izquierda",
                alignLeftDesc: "Alinea el contenido de texto a la izquierda",
    alignRight: "Alinear a la Derecha",
                alignRightDesc: "Alinea el contenido de texto a la derecha",
                darkContrast: "Contraste Oscuro",
                darkContrastDesc: "Fondo oscuro con texto claro",
                lightContrast: "Contraste Claro",
                lightContrastDesc: "Fondo claro con texto oscuro",
                highContrast: "Alto Contraste",
                highContrastDesc: "Implementación de contraste máximo",
                highSaturation: "Alta Saturación",
    highSaturationDesc: "Aumenta la intensidad de colores",
                adjustTextColors: "Ajustar Colores de Texto",
                adjustTextColorsDesc: "Funcionalidad de selector de color",
                monochrome: "Monocromo",
    monochromeDesc: "Elimina todos los colores excepto negro, blanco, gris",
                adjustTitleColors: "Ajustar Colores de Títulos",
    adjustTitleColorsDesc: "Personalización de colores para títulos",
                lowSaturation: "Baja Saturación",
    lowSaturationDesc: "Reduce la intensidad de colores",
                adjustBgColors: "Ajustar Colores de Fondo",
    adjustBgColorsDesc: "Personalización de colores de fondo",
                muteSound: "Silenciar Sonido",
                muteSoundDesc: "Desactiva todo el contenido de audio",
                hideImages: "Ocultar Imágenes",
                hideImagesDesc: "Alternar para ocultar todas las imágenes",
                readMode: "Modo de Lectura",
                readModeDesc: "Elimina elementos de navegación",
                readingGuide: "Guía de Lectura",
                readingGuideDesc: "Barra de resaltado móvil",
                usefulLinks: "Enlaces Útiles",
                usefulLinksDesc: "Recursos y enlaces de accesibilidad",
                stopAnimation: "Detener Animación",
                stopAnimationDesc: "Pausa todas las animaciones CSS",
                readingMask: "Máscara de Lectura",
                readingMaskDesc: "Superposición semi-transparente",
    highlightHover: "Resaltar al Pasar",
                highlightHoverDesc: "Retroalimentación visual al pasar el mouse",
                highlightFocus: "Resaltar Enfoque",
                highlightFocusDesc: "Indicadores de enfoque prominentes",
                bigBlackCursor: "Cursor Negro Grande",
                bigBlackCursorDesc: "Aumenta el tamaño del cursor",
                bigWhiteCursor: "Cursor Blanco Grande",
                bigWhiteCursorDesc: "Aumenta el tamaño del cursor",
                resetSettings: "Restablecer Configuración",
                statement: "Declaración",
                hideInterface: "Ocultar Interfaz",
                accessibilityFeatures: "Características de Accesibilidad",

    // Descripciones detalladas adicionales
    keyboardNavDetailed: "Este perfil permite a las personas con discapacidades motoras operar el sitio web usando teclas del teclado (Tab, Shift+Tab, Enter) y atajos (ej: \"M\" para menús, \"H\" para títulos, \"F\" para formularios, \"B\" para botones, \"G\" para gráficos).",
                keyboardNavNote: "Nota: Este perfil se activa automáticamente para usuarios de teclado.",
                screenReaderDetailed: "Este perfil ajusta el sitio web para ser compatible con lectores de pantalla como JAWS, NVDA, VoiceOver y TalkBack. El software lector de pantalla está instalado en la computadora y smartphone del usuario ciego, y los sitios web deben asegurar compatibilidad.",
    screenReaderNote: "Nota: Este perfil se activa automáticamente con lectores de pantalla.",
                activatesWithScreenReader: "Se activa con Lector de Pantalla",
                activatesWithKeyboardNav: "Se activa con Navegación por Teclado",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "¿Ocultar Interfaz de Accesibilidad?",
                hideInterfaceModalText: "Tenga en cuenta: Si elige ocultar la interfaz de accesibilidad, no podrá verla más, a menos que borre el historial de navegación y los datos. ¿Está seguro de que desea ocultar la interfaz?",
                hideInterfaceModalAccept: "Aceptar",
                hideInterfaceModalCancel: "Cancelar",

                // Toggle switch text
                toggleOn: "SÍ",
                toggleOff: "NO"
            },

            de: {

                title: "Barrierefreiheitseinstellungen",

                profilesTitle: "Wählen Sie das richtige Barrierefreiheitsprofil für Sie",

                seizureSafe: "Anfallssicheres Profil",

                seizureSafeDesc: "Entfernt Blitze und reduziert Farben",

                visionImpaired: "Profil für Sehbehinderte",

                visionImpairedDesc: "Verbessert die visuellen Elemente der Website",

                adhdFriendly: "ADHS-freundliches Profil",

                adhdFriendlyDesc: "Mehr Fokus und weniger Ablenkungen",

                cognitiveDisability: "Kognitives Behinderungsprofil",

                cognitiveDisabilityDesc: "Hilft beim Lesen und Fokussieren",

                keyboardNav: "Tastaturnavigation (Motor)",

                keyboardNavDesc: "Website mit der Tastatur verwenden",

                screenReader: "Blinde Benutzer (Bildschirmleser)",

                screenReaderDesc: "Website für Bildschirmleser optimieren",

                contentScaling: "Inhaltsskalierung",

                contentScalingDesc: "Inhalt mit Pfeilsteuerungen skalieren",

                readableFont: "Lesbare Schriftart",

                readableFontDesc: "Hochlegible Schriftarten",

                highlightTitles: "Überschriften hervorheben",

                highlightTitlesDesc: "Kästen um Überschriften hinzufügen",

                highlightLinks: "Links hervorheben",

                highlightLinksDesc: "Kästen um Links hinzufügen",

                textMagnifier: "Textlupe",

                textMagnifierDesc: "Schwebendes Lupenwerkzeug",

                fontSizing: "Schriftgröße anpassen",

                fontSizingDesc: "Schriftgröße mit Pfeilsteuerungen",

                alignCenter: "Zentrieren",

                alignCenterDesc: "Zentriert allen Textinhalt",

                adjustLineHeight: "Zeilenhöhe anpassen",

                adjustLineHeightDesc: "Zeilenhöhe mit Pfeilsteuerungen",

                adjustLetterSpacing: "Buchstabenabstand anpassen",

                adjustLetterSpacingDesc: "Buchstabenabstand mit Pfeilsteuerungen",

                alignLeft: "Links ausrichten",

                alignLeftDesc: "Richtet Textinhalt links aus",

                alignRight: "Rechts ausrichten",

                alignRightDesc: "Richtet Textinhalt rechts aus",

                darkContrast: "Dunkler Kontrast",

                darkContrastDesc: "Dunkler Hintergrund mit hellem Text",

                lightContrast: "Heller Kontrast",

                lightContrastDesc: "Heller Hintergrund mit dunklem Text",

                highContrast: "Hoher Kontrast",

                highContrastDesc: "Maximale Kontrastimplementierung",

                highSaturation: "Hohe Sättigung",

                highSaturationDesc: "Erhöht die Farbintensität",

                adjustTextColors: "Textfarben anpassen",

                adjustTextColorsDesc: "Farbauswahl-Funktionalität",

                monochrome: "Monochrom",

                monochromeDesc: "Entfernt alle Farben außer Schwarz, Weiß, Grau",

                adjustTitleColors: "Titelfarben anpassen",

                adjustTitleColorsDesc: "Farbanpassung für Überschriften",

                lowSaturation: "Niedrige Sättigung",

                lowSaturationDesc: "Reduziert die Farbintensität",

                adjustBgColors: "Hintergrundfarben anpassen",

                adjustBgColorsDesc: "Hintergrundfarbanpassung",

                muteSound: "Ton stummschalten",

                muteSoundDesc: "Deaktiviert alle Audioinhalte",

                hideImages: "Bilder ausblenden",

                hideImagesDesc: "Umschalten zum Ausblenden aller Bilder",

                readMode: "Lesemodus",

                readModeDesc: "Entfernt Navigationselemente",

                readingGuide: "Lesehilfe",

                readingGuideDesc: "Bewegliche Hervorhebungsleiste",

                usefulLinks: "Nützliche Links",

                usefulLinksDesc: "Barrierefreiheitsressourcen und Links",

                stopAnimation: "Animation stoppen",

                stopAnimationDesc: "Pausiert alle CSS-Animationen",

                readingMask: "Lesemaske",

                readingMaskDesc: "Halbdurchsichtige Überlagerung",

                highlightHover: "Hover hervorheben",

                highlightHoverDesc: "Visuelles Feedback beim Überfahren",

                highlightFocus: "Fokus hervorheben",

                highlightFocusDesc: "Prominente Fokusindikatoren",

                bigBlackCursor: "Großer schwarzer Cursor",

                bigBlackCursorDesc: "Erhöht die Cursorgröße",

                bigWhiteCursor: "Großer weißer Cursor",

                bigWhiteCursorDesc: "Erhöht die Cursorgröße",

                resetSettings: "Einstellungen zurücksetzen",

                statement: "Erklärung",

                hideInterface: "Schnittstelle ausblenden",

                accessibilityFeatures: "Barrierefreiheitsfunktionen",

                // Additional detailed descriptions

                keyboardNavDetailed: "Dieses Profil ermöglicht es motorisch beeinträchtigten Personen, die Website mit Tastaturtasten (Tab, Shift+Tab, Enter) und Tastenkombinationen zu bedienen (z.B. \"M\" für Menüs, \"H\" für Überschriften, \"F\" für Formulare, \"B\" für Schaltflächen, \"G\" für Grafiken).",

                keyboardNavNote: "Hinweis: Dieses Profil wird automatisch für Tastaturnutzer aktiviert.",

                screenReaderDetailed: "Dieses Profil passt die Website für die Kompatibilität mit Bildschirmlesern wie JAWS, NVDA, VoiceOver und TalkBack an. Die Bildschirmleser-Software ist auf dem Computer und Smartphone des blinden Benutzers installiert, und Websites sollten die Kompatibilität sicherstellen.",

                screenReaderNote: "Hinweis: Dieses Profil wird automatisch für Bildschirmleser aktiviert.",

                activatesWithScreenReader: "Aktiviert sich mit Bildschirmleser",

                activatesWithKeyboardNav: "Aktiviert sich mit Tastaturnavigation",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "Barrierefreiheits-Interface ausblenden?",
                hideInterfaceModalText: "Bitte beachten Sie: Wenn Sie sich entscheiden, das Barrierefreiheits-Interface auszublenden, können Sie es nicht mehr sehen, es sei denn, Sie löschen Ihren Browserverlauf und Ihre Daten. Sind Sie sicher, dass Sie das Interface ausblenden möchten?",
                hideInterfaceModalAccept: "Akzeptieren",
                hideInterfaceModalCancel: "Abbrechen",

                // Toggle switch text
                toggleOn: "EIN",
                toggleOff: "AUS"

            },

            fr: {
    title: "Ajustements d'accessibilité",
    profilesTitle: "Choisissez le bon profil d'accessibilité pour vous",
    seizureSafe: "Profil Anti-Épilepsie",
    seizureSafeDesc: "Élimine les flashs et réduit les couleurs",
    visionImpaired: "Profil Déficience Visuelle",
    visionImpairedDesc: "Améliore les visuels du site web",
    adhdFriendly: "Profil TDAH",
    adhdFriendlyDesc: "Plus de concentration et moins de distractions",
    cognitiveDisability: "Profil Déficience Cognitive",
    cognitiveDisabilityDesc: "Aide à la lecture et à la concentration",
    keyboardNav: "Navigation Clavier (Moteur)",
    keyboardNavDesc: "Utiliser le site web avec le clavier",
    screenReader: "Utilisateurs Aveugles (Lecteur d'écran)",
    screenReaderDesc: "Optimiser le site web pour les lecteurs d'écran",
    contentScaling: "Mise à l'échelle du contenu",
    contentScalingDesc: "Mettre à l'échelle le contenu avec les contrôles fléchés",
    readableFont: "Police Lisible",
    readableFontDesc: "Polices à haute lisibilité",
    highlightTitles: "Surligner les Titres",
    highlightTitlesDesc: "Ajouter des encadrés autour des titres",
    highlightLinks: "Surligner les Liens",
    highlightLinksDesc: "Ajouter des encadrés autour des liens",
    textMagnifier: "Loupe de Texte",
    textMagnifierDesc: "Outil de loupe flottant",
    fontSizing: "Ajuster la Taille de Police",
    fontSizingDesc: "Taille de police avec les contrôles fléchés",
    alignCenter: "Centrer",
    alignCenterDesc: "Centre tout le contenu texte",
    adjustLineHeight: "Ajuster l'Interlignage",
    adjustLineHeightDesc: "Interlignage avec les contrôles fléchés",
    adjustLetterSpacing: "Ajuster l'Espacement des Lettres",
    adjustLetterSpacingDesc: "Espacement des lettres avec les contrôles fléchés",
    alignLeft: "Aligner à Gauche",
    alignLeftDesc: "Aligne le contenu texte à gauche",
    alignRight: "Aligner à Droite",
    alignRightDesc: "Aligne le contenu texte à droite",
    darkContrast: "Contraste Sombre",
    darkContrastDesc: "Arrière-plan sombre avec texte clair",
    lightContrast: "Contraste Clair",
    lightContrastDesc: "Arrière-plan clair avec texte sombre",
    highContrast: "Contraste Élevé",
    highContrastDesc: "Implémentation de contraste maximum",
    highSaturation: "Saturation Élevée",
    highSaturationDesc: "Augmente l'intensité des couleurs",
    adjustTextColors: "Ajuster les Couleurs du Texte",
    adjustTextColorsDesc: "Fonctionnalité de sélecteur de couleur",
    monochrome: "Monochrome",
    monochromeDesc: "Supprime toutes les couleurs sauf noir, blanc, gris",
    adjustTitleColors: "Ajuster les Couleurs des Titres",
    adjustTitleColorsDesc: "Personnalisation des couleurs pour les titres",
    lowSaturation: "Saturation Faible",
    lowSaturationDesc: "Réduit l'intensité des couleurs",
    adjustBgColors: "Ajuster les Couleurs d'Arrière-plan",
    adjustBgColorsDesc: "Personnalisation des couleurs d'arrière-plan",
    muteSound: "Couper le Son",
    muteSoundDesc: "Désactive tout le contenu audio",
    hideImages: "Masquer les Images",
    hideImagesDesc: "Basculer pour masquer toutes les images",
    readMode: "Mode Lecture",
    readModeDesc: "Supprime les éléments de navigation",
    readingGuide: "Guide de Lecture",
    readingGuideDesc: "Barre de surlignage mobile",
    usefulLinks: "Liens Utiles",
    usefulLinksDesc: "Ressources et liens d'accessibilité",
    stopAnimation: "Arrêter l'Animation",
    stopAnimationDesc: "Met en pause toutes les animations CSS",
    readingMask: "Masque de Lecture",
    readingMaskDesc: "Superposition semi-transparente",
    highlightHover: "Surligner au Survol",
    highlightHoverDesc: "Retour visuel au survol",
    highlightFocus: "Surligner le Focus",
    highlightFocusDesc: "Indicateurs de focus proéminents",
    bigBlackCursor: "Gros Curseur Noir",
    bigBlackCursorDesc: "Augmente la taille du curseur",
    bigWhiteCursor: "Gros Curseur Blanc",
    bigWhiteCursorDesc: "Augmente la taille du curseur",
    resetSettings: "Réinitialiser les Paramètres",
    statement: "Déclaration",
    hideInterface: "Masquer l'Interface",
    accessibilityFeatures: "Fonctionnalités d'Accessibilité",
    
    // Descriptions détaillées supplémentaires
    keyboardNavDetailed: "Ce profil permet aux personnes ayant des déficiences motrices d'utiliser le site web avec les touches du clavier (Tab, Shift+Tab, Entrée) et les raccourcis (ex: \"M\" pour les menus, \"H\" pour les titres, \"F\" pour les formulaires, \"B\" pour les boutons, \"G\" pour les graphiques).",
    keyboardNavNote: "Note: Ce profil se déclenche automatiquement pour les utilisateurs de clavier.",
    screenReaderDetailed: "Ce profil ajuste le site web pour être compatible avec les lecteurs d'écran comme JAWS, NVDA, VoiceOver et TalkBack. Le logiciel de lecteur d'écran est installé sur l'ordinateur et le smartphone de l'utilisateur aveugle, et les sites web doivent assurer la compatibilité.",
    screenReaderNote: "Note: Ce profil se déclenche automatiquement avec les lecteurs d'écran.",
    activatesWithScreenReader: "S'active avec le Lecteur d'écran",
    activatesWithKeyboardNav: "S'active avec la Navigation Clavier",
    
    // Hide Interface Modal
    hideInterfaceModalTitle: "Masquer l'Interface d'Accessibilité?",
    hideInterfaceModalText: "Veuillez noter: Si vous choisissez de masquer l'interface d'accessibilité, vous ne pourrez plus la voir, sauf si vous effacez votre historique de navigation et vos données. Êtes-vous sûr de vouloir masquer l'interface?",
    hideInterfaceModalAccept: "Accepter",
    hideInterfaceModalCancel: "Annuler",

    // Toggle switch text
    toggleOn: "OUI",
    toggleOff: "NON"
},

            pt: {
                title: "Ajustes de Acessibilidade",
    profilesTitle: "Escolha o perfil de acessibilidade certo para você",
    seizureSafe: "Perfil Anti-Convulsões",
    seizureSafeDesc: "Elimina flashes e reduz cores",
    visionImpaired: "Perfil de Deficiência Visual",
                visionImpairedDesc: "Melhora os elementos visuais do site",
                adhdFriendly: "Perfil Amigável para TDAH",
    adhdFriendlyDesc: "Mais foco e menos distrações",
                cognitiveDisability: "Perfil de Deficiência Cognitiva",
    cognitiveDisabilityDesc: "Ajuda com leitura e concentração",
    keyboardNav: "Navegação por Teclado (Motora)",
                keyboardNavDesc: "Usar o site com o teclado",
                screenReader: "Usuários Cegos (Leitor de Tela)",
                screenReaderDesc: "Otimizar o site para leitores de tela",
                contentScaling: "Escala de Conteúdo",
    contentScalingDesc: "Escalar conteúdo com controles de setas",
                readableFont: "Fonte Legível",
                readableFontDesc: "Fontes de alta legibilidade",
                highlightTitles: "Destacar Títulos",
    highlightTitlesDesc: "Adicionar molduras ao redor dos títulos",
                highlightLinks: "Destacar Links",
    highlightLinksDesc: "Adicionar molduras ao redor dos links",
                textMagnifier: "Lupa de Texto",
                textMagnifierDesc: "Ferramenta de lupa flutuante",
    fontSizing: "Ajustar Tamanho da Fonte",
    fontSizingDesc: "Tamanho da fonte com controles de setas",
    alignCenter: "Alinhar ao Centro",
                alignCenterDesc: "Centraliza todo o conteúdo de texto",
                adjustLineHeight: "Ajustar Altura da Linha",
    adjustLineHeightDesc: "Altura da linha com controles de setas",
                adjustLetterSpacing: "Ajustar Espaçamento das Letras",
    adjustLetterSpacingDesc: "Espaçamento das letras com controles de setas",
    alignLeft: "Alinhar à Esquerda",
                alignLeftDesc: "Alinha o conteúdo de texto à esquerda",
    alignRight: "Alinhar à Direita",
                alignRightDesc: "Alinha o conteúdo de texto à direita",
                darkContrast: "Contraste Escuro",
                darkContrastDesc: "Fundo escuro com texto claro",
                lightContrast: "Contraste Claro",
                lightContrastDesc: "Fundo claro com texto escuro",
                highContrast: "Alto Contraste",
                highContrastDesc: "Implementação de contraste máximo",
                highSaturation: "Alta Saturação",
    highSaturationDesc: "Aumenta a intensidade das cores",
                adjustTextColors: "Ajustar Cores do Texto",
                adjustTextColorsDesc: "Funcionalidade de seletor de cor",
                monochrome: "Monocromático",
    monochromeDesc: "Remove todas as cores exceto preto, branco, cinza",
                adjustTitleColors: "Ajustar Cores dos Títulos",
    adjustTitleColorsDesc: "Personalização de cores para títulos",
                lowSaturation: "Baixa Saturação",
    lowSaturationDesc: "Reduz a intensidade das cores",
                adjustBgColors: "Ajustar Cores de Fundo",
    adjustBgColorsDesc: "Personalização de cores de fundo",
                muteSound: "Silenciar Som",
                muteSoundDesc: "Desativa todo o conteúdo de áudio",
                hideImages: "Ocultar Imagens",
                hideImagesDesc: "Alternar para ocultar todas as imagens",
                readMode: "Modo de Leitura",
                readModeDesc: "Remove elementos de navegação",
                readingGuide: "Guia de Leitura",
                readingGuideDesc: "Barra de destaque móvel",
                usefulLinks: "Links Úteis",
                usefulLinksDesc: "Recursos e links de acessibilidade",
                stopAnimation: "Parar Animação",
                stopAnimationDesc: "Pausa todas as animações CSS",
                readingMask: "Máscara de Leitura",
                readingMaskDesc: "Sobreposição semi-transparente",
    highlightHover: "Destacar ao Passar",
                highlightHoverDesc: "Feedback visual ao passar o mouse",
                highlightFocus: "Destacar Foco",
                highlightFocusDesc: "Indicadores de foco proeminentes",
                bigBlackCursor: "Cursor Preto Grande",
                bigBlackCursorDesc: "Aumenta o tamanho do cursor",
                bigWhiteCursor: "Cursor Branco Grande",
                bigWhiteCursorDesc: "Aumenta o tamanho do cursor",
                resetSettings: "Redefinir Configurações",
                statement: "Declaração",
                hideInterface: "Ocultar Interface",
                accessibilityFeatures: "Recursos de Acessibilidade",

    // Descrições detalhadas adicionais
    keyboardNavDetailed: "Este perfil permite que pessoas com deficiências motoras operem o site usando teclas do teclado (Tab, Shift+Tab, Enter) e atalhos (ex: \"M\" para menus, \"H\" para títulos, \"F\" para formulários, \"B\" para botões, \"G\" para gráficos).",
                keyboardNavNote: "Nota: Este perfil é ativado automaticamente para usuários de teclado.",
                screenReaderDetailed: "Este perfil ajusta o site para ser compatível com leitores de tela como JAWS, NVDA, VoiceOver e TalkBack. O software leitor de tela está instalado no computador e smartphone do usuário cego, e os sites devem garantir compatibilidade.",
    screenReaderNote: "Nota: Este perfil é ativado automaticamente com leitores de tela.",
                activatesWithScreenReader: "Ativa com Leitor de Tela",
                activatesWithKeyboardNav: "Ativa com Navegação por Teclado",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "Ocultar Interface de Acessibilidade?",
                hideInterfaceModalText: "Por favor, note: Se você escolher ocultar a interface de acessibilidade, não conseguirá vê-la novamente, a menos que limpe o histórico de navegação e os dados. Tem certeza de que deseja ocultar a interface?",
                hideInterfaceModalAccept: "Aceitar",
                hideInterfaceModalCancel: "Cancelar",

                // Toggle switch text
                toggleOn: "SIM",
                toggleOff: "NÃO"
            },

            it: {
    title: "Impostazioni di Accessibilità",
                profilesTitle: "Scegli il profilo di accessibilità giusto per te",
    seizureSafe: "Profilo Anti-Epilettico",
    seizureSafeDesc: "Elimina i flash e riduce i colori",
                visionImpaired: "Profilo per Ipovedenti",
    visionImpairedDesc: "Migliora gli elementi visivi del sito web",
                adhdFriendly: "Profilo Amichevole per ADHD",
    adhdFriendlyDesc: "Più concentrazione e meno distrazioni",
    cognitiveDisability: "Profilo per Disabilità Cognitive",
                cognitiveDisabilityDesc: "Aiuta con la lettura e la concentrazione",
    keyboardNav: "Navigazione da Tastiera (Motoria)",
                keyboardNavDesc: "Usare il sito web con la tastiera",
                screenReader: "Utenti Ciechi (Lettore di Schermo)",
                screenReaderDesc: "Ottimizzare il sito web per i lettori di schermo",
    contentScaling: "Ridimensionamento Contenuto",
    contentScalingDesc: "Ridimensionare il contenuto con controlli frecce",
    readableFont: "Font Leggibile",
    readableFontDesc: "Font ad alta leggibilità",
    highlightTitles: "Evidenziare Titoli",
    highlightTitlesDesc: "Aggiungere cornici attorno ai titoli",
    highlightLinks: "Evidenziare Link",
    highlightLinksDesc: "Aggiungere cornici attorno ai link",
                textMagnifier: "Lente di Ingrandimento Testo",
                textMagnifierDesc: "Strumento lente di ingrandimento flottante",
    fontSizing: "Regolare Dimensione Font",
    fontSizingDesc: "Dimensione font con controlli frecce",
    alignCenter: "Allineare al Centro",
                alignCenterDesc: "Centra tutto il contenuto di testo",
    adjustLineHeight: "Regolare Altezza Riga",
    adjustLineHeightDesc: "Altezza riga con controlli frecce",
    adjustLetterSpacing: "Regolare Spaziatura Lettere",
    adjustLetterSpacingDesc: "Spaziatura lettere con controlli frecce",
    alignLeft: "Allineare a Sinistra",
                alignLeftDesc: "Allinea il contenuto di testo a sinistra",
    alignRight: "Allineare a Destra",
                alignRightDesc: "Allinea il contenuto di testo a destra",
                darkContrast: "Contrasto Scuro",
                darkContrastDesc: "Sfondo scuro con testo chiaro",
                lightContrast: "Contrasto Chiaro",
                lightContrastDesc: "Sfondo chiaro con testo scuro",
                highContrast: "Alto Contrasto",
                highContrastDesc: "Implementazione di contrasto massimo",
                highSaturation: "Alta Saturazione",
    highSaturationDesc: "Aumenta l'intensità dei colori",
    adjustTextColors: "Regolare Colori Testo",
    adjustTextColorsDesc: "Funzionalità selettore colori",
                monochrome: "Monocromatico",
    monochromeDesc: "Rimuove tutti i colori eccetto nero, bianco, grigio",
    adjustTitleColors: "Regolare Colori Titoli",
    adjustTitleColorsDesc: "Personalizzazione colori per i titoli",
                lowSaturation: "Bassa Saturazione",
    lowSaturationDesc: "Riduce l'intensità dei colori",
    adjustBgColors: "Regolare Colori Sfondo",
    adjustBgColorsDesc: "Personalizzazione colori di sfondo",
                muteSound: "Disattiva Suono",
                muteSoundDesc: "Disabilita tutto il contenuto audio",
    hideImages: "Nascondere Immagini",
                hideImagesDesc: "Attiva/disattiva per nascondere tutte le immagini",
                readMode: "Modalità Lettura",
                readModeDesc: "Rimuove elementi di navigazione",
                readingGuide: "Guida alla Lettura",
                readingGuideDesc: "Barra di evidenziazione mobile",
                usefulLinks: "Link Utili",
                usefulLinksDesc: "Risorse e link di accessibilità",
    stopAnimation: "Fermare Animazione",
                stopAnimationDesc: "Mette in pausa tutte le animazioni CSS",
                readingMask: "Maschera di Lettura",
                readingMaskDesc: "Sovrapposizione semi-trasparente",
    highlightHover: "Evidenziare al Passaggio",
                highlightHoverDesc: "Feedback visivo al passaggio del mouse",
    highlightFocus: "Evidenziare Focus",
                highlightFocusDesc: "Indicatori di focus prominenti",
                bigBlackCursor: "Cursore Nero Grande",
                bigBlackCursorDesc: "Aumenta la dimensione del cursore",
                bigWhiteCursor: "Cursore Bianco Grande",
                bigWhiteCursorDesc: "Aumenta la dimensione del cursore",
                resetSettings: "Ripristina Impostazioni",
                statement: "Dichiarazione",
    hideInterface: "Nascondere Interfaccia",
                accessibilityFeatures: "Funzionalità di Accessibilità",

    // Descrizioni dettagliate aggiuntive
    keyboardNavDetailed: "Questo profilo consente alle persone con disabilità motorie di operare il sito web usando i tasti della tastiera (Tab, Shift+Tab, Enter) e scorciatoie (es: \"M\" per i menu, \"H\" per i titoli, \"F\" per i moduli, \"B\" per i pulsanti, \"G\" per i grafici).",
                keyboardNavNote: "Nota: Questo profilo si attiva automaticamente per gli utenti della tastiera.",
                screenReaderDetailed: "Questo profilo regola il sito web per essere compatibile con i lettori di schermo come JAWS, NVDA, VoiceOver e TalkBack. Il software lettore di schermo è installato sul computer e smartphone dell'utente cieco, e i siti web devono garantire la compatibilità.",
    screenReaderNote: "Nota: Questo profilo si attiva automaticamente con i lettori di schermo.",
                activatesWithScreenReader: "Si attiva con Lettore di Schermo",
                activatesWithKeyboardNav: "Si attiva con Navigazione da Tastiera",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "Nascondere l'Interfaccia di Accessibilità?",
                hideInterfaceModalText: "Si prega di notare: Se scegli di nascondere l'interfaccia di accessibilità, non potrai più vederla, a meno che non cancelli la cronologia di navigazione e i dati. Sei sicuro di voler nascondere l'interfaccia?",
                hideInterfaceModalAccept: "Accetta",
                hideInterfaceModalCancel: "Annulla",

                // Toggle switch text
                toggleOn: "SÌ",
                toggleOff: "NO"
},

            il: {
    title: "התאמות נגישות",
    profilesTitle: "בחרו את פרופיל הנגישות הנכון עבורכם",
    seizureSafe: "פרופיל בטוח מפני התקפים",
    seizureSafeDesc: "מבטל הבזקים ומפחית צבעים",
    visionImpaired: "פרופיל לקויי ראייה",
    visionImpairedDesc: "משפר את המראה החזותי של האתר",
    adhdFriendly: "פרופיל ידידותי ל-ADHD",
    adhdFriendlyDesc: "יותר ריכוז ופחות הסחות דעת",
    cognitiveDisability: "פרופיל לקות קוגניטיבית",
    cognitiveDisabilityDesc: "עוזר בקריאה ובהתמקדות",
    keyboardNav: "ניווט במקלדת (מוטורי)",
    keyboardNavDesc: "שימוש באתר עם המקלדת",
    screenReader: "משתמשים עיוורים (קורא מסך)",
    screenReaderDesc: "אופטימיזציה של האתר לקוראי מסך",
    contentScaling: "הגדלת תוכן",
    contentScalingDesc: "הגדלת תוכן עם בקרות חצים",
    readableFont: "גופן קריא",
    readableFontDesc: "גופנים בעלי קריאות גבוהה",
    highlightTitles: "הדגשת כותרות",
    highlightTitlesDesc: "הוספת מסגרות סביב כותרות",
    highlightLinks: "הדגשת קישורים",
    highlightLinksDesc: "הוספת מסגרות סביב קישורים",
    textMagnifier: "זכוכית מגדלת לטקסט",
    textMagnifierDesc: "כלי זכוכית מגדלת צף",
    fontSizing: "התאמת גודל גופן",
    fontSizingDesc: "גודל גופן עם בקרות חצים",
    alignCenter: "יישור למרכז",
    alignCenterDesc: "מרכז את כל תוכן הטקסט",
    adjustLineHeight: "התאמת גובה שורה",
    adjustLineHeightDesc: "גובה שורה עם בקרות חצים",
    adjustLetterSpacing: "התאמת רווח בין אותיות",
    adjustLetterSpacingDesc: "רווח בין אותיות עם בקרות חצים",
    alignLeft: "יישור לשמאל",
    alignLeftDesc: "מיישר תוכן טקסט לשמאל",
    alignRight: "יישור לימין",
    alignRightDesc: "מיישר תוכן טקסט לימין",
    darkContrast: "ניגודיות כהה",
    darkContrastDesc: "רקע כהה עם טקסט בהיר",
    lightContrast: "ניגודיות בהירה",
    lightContrastDesc: "רקע בהיר עם טקסט כהה",
    highContrast: "ניגודיות גבוהה",
    highContrastDesc: "יישום ניגודיות מקסימלית",
    highSaturation: "רוויה גבוהה",
    highSaturationDesc: "מגביר עוצמת צבעים",
    adjustTextColors: "התאמת צבעי טקסט",
    adjustTextColorsDesc: "פונקציונליות בוחר צבעים",
    monochrome: "מונוכרום",
    monochromeDesc: "מסיר את כל הצבעים מלבד שחור, לבן, אפור",
    adjustTitleColors: "התאמת צבעי כותרות",
    adjustTitleColorsDesc: "התאמה אישית של צבעים לכותרות",
    lowSaturation: "רוויה נמוכה",
    lowSaturationDesc: "מפחית עוצמת צבעים",
    adjustBgColors: "התאמת צבעי רקע",
    adjustBgColorsDesc: "התאמה אישית של צבעי רקע",
    muteSound: "השתקת קול",
    muteSoundDesc: "מבטל את כל התוכן האודיו",
    hideImages: "הסתרת תמונות",
    hideImagesDesc: "מעבר להסתרת כל התמונות",
    readMode: "מצב קריאה",
    readModeDesc: "מסיר אלמנטי ניווט",
    readingGuide: "מדריך קריאה",
    readingGuideDesc: "סרגל הדגשה נייד",
    usefulLinks: "קישורים שימושיים",
    usefulLinksDesc: "משאבים וקישורי נגישות",
    stopAnimation: "עצירת אנימציה",
    stopAnimationDesc: "משה את כל אנימציות ה-CSS",
    readingMask: "מסכת קריאה",
    readingMaskDesc: "שכבת כיסוי שקופה למחצה",
    highlightHover: "הדגשת מעבר עכבר",
    highlightHoverDesc: "משוב חזותי במעבר עכבר",
    highlightFocus: "הדגשת פוקוס",
    highlightFocusDesc: "אינדיקטורי פוקוס בולטים",
    bigBlackCursor: "סמן שחור גדול",
    bigBlackCursorDesc: "מגדיל את גודל הסמן",
    bigWhiteCursor: "סמן לבן גדול",
    bigWhiteCursorDesc: "מגדיל את גודל הסמן",
    resetSettings: "איפוס הגדרות",
    statement: "הצהרה",
    hideInterface: "הסתרת ממשק",
    accessibilityFeatures: "תכונות נגישות",
    
    // תיאורים מפורטים נוספים
    keyboardNavDetailed: "פרופיל זה מאפשר לאנשים עם לקויות מוטוריות להפעיל את האתר באמצעות מקשי המקלדת (Tab, Shift+Tab, Enter) וקיצורי דרך (למשל \"M\" לתפריטים, \"H\" לכותרות, \"F\" לטופסים, \"B\" לכפתורים, \"G\" לגרפיקה).",
    keyboardNavNote: "הערה: פרופיל זה מופעל אוטומטית למשתמשי מקלדת.",
    screenReaderDetailed: "פרופיל זה מתאים את האתר להיות תואם לקוראי מסך כמו JAWS, NVDA, VoiceOver ו-TalkBack. תוכנת קורא מסך מותקנת במחשב ובסמארטפון של המשתמש העיוור, ואתרים צריכים להבטיח תאימות.",
    screenReaderNote: "הערה: פרופיל זה מופעל אוטומטית עם קוראי מסך.",
    activatesWithScreenReader: "מופעל עם קורא מסך",
    activatesWithKeyboardNav: "מופעל עם ניווט במקלדת",
    
    // Hide Interface Modal
    hideInterfaceModalTitle: "להסתיר את ממשק הנגישות?",
    hideInterfaceModalText: "שימו לב: אם תבחרו להסתיר את ממשק הנגישות, לא תוכלו לראות אותו יותר, אלא אם תמחקו את היסטוריית הגלישה והנתונים. האם אתם בטוחים שברצונכם להסתיר את הממשק?",
    hideInterfaceModalAccept: "קבל",
    hideInterfaceModalCancel: "בטל",

    // Toggle switch text
    toggleOn: "כן",
    toggleOff: "לא"
            },

            he: {

                title: "התאמות נגישות",

                profilesTitle: "בחר את פרופיל הנגישות המתאים עבורך",

                seizureSafe: "פרופיל בטוח להתקפים",

                seizureSafeDesc: "מסיר הבזקים ומפחית צבעים",

                visionImpaired: "פרופיל לבעלי לקות ראייה",

                visionImpairedDesc: "משפר את האלמנטים הוויזואליים של האתר",

                adhdFriendly: "פרופיל ידידותי ל-ADHD",

                adhdFriendlyDesc: "מפחית הסחות דעת ועוזר להתמקד",

                cognitiveDisability: "פרופיל לקות קוגניטיבית",

                cognitiveDisabilityDesc: "עוזר עם קריאה ומיקוד",

                keyboardNav: "ניווט במקלדת (מוטורי)",

                keyboardNavDesc: "השתמש באתר עם המקלדת",

                screenReader: "משתמשים עיוורים (קורא מסך)",

                screenReaderDesc: "מטב את האתר לקוראי מסך",

                contentScaling: "התאמת גודל תוכן",

                contentScalingDesc: "הגדל או הקטן את גודל התוכן",

                readableFont: "גופן קריא",

                readableFontDesc: "גופנים בעלי קריאות גבוהה",

                highlightTitles: "הדגש כותרות",

                highlightTitlesDesc: "הוסף תיבות סביב כותרות",

                highlightLinks: "הדגש קישורים",

                highlightLinksDesc: "הוסף תיבות סביב קישורים",

                textMagnifier: "זכוכית מגדלת לטקסט",

                textMagnifierDesc: "כלי זכוכית מגדלת צף",

                fontSizing: "גודל גופן",

                fontSizingDesc: "הגדל או הקטן את גודל הגופן",

                alignCenter: "יישור למרכז",

                alignCenterDesc: "מרכז את כל תוכן הטקסט",

                adjustLineHeight: "התאם גובה שורה",

                adjustLineHeightDesc: "הגדל או הקטן את גובה השורה",

                adjustLetterSpacing: "התאם רווח בין אותיות",

                adjustLetterSpacingDesc: "הגדל או הקטן את הרווח בין האותיות",

                alignLeft: "יישור לשמאל",

                alignLeftDesc: "מעביר את תוכן הטקסט לשמאל",

                alignRight: "יישור לימין",

                alignRightDesc: "מעביר את תוכן הטקסט לימין",

                darkContrast: "ניגודיות כהה",

                darkContrastDesc: "רקע כהה עם טקסט בהיר",

                lightContrast: "ניגודיות בהירה",

                lightContrastDesc: "רקע בהיר עם טקסט כהה",

                highContrast: "ניגודיות גבוהה",

                highContrastDesc: "יישום ניגודיות מקסימלי",

                highSaturation: "רוויה גבוהה",

                highSaturationDesc: "מגביר את עוצמת הצבע",

                adjustTextColors: "התאם צבעי טקסט",

                adjustTextColorsDesc: "פונקציונליות בוחר צבעים",

                monochrome: "מונוכרום",

                monochromeDesc: "מסיר את כל הצבעים מלבד שחור, לבן, אפורים",

                adjustTitleColors: "התאם צבעי כותרות",

                adjustTitleColorsDesc: "התאמה אישית של צבע לכותרות",

                lowSaturation: "רוויה נמוכה",

                lowSaturationDesc: "מפחית את עוצמת הצבע",

                adjustBgColors: "התאם צבעי רקע",

                adjustBgColorsDesc: "התאמה אישית של צבע רקע",

                muteSound: "השתק צליל",

                muteSoundDesc: "מבטל את כל תוכן האודיו",

                hideImages: "הסתר תמונות",

                hideImagesDesc: "החלף להסתיר את כל התמונות",

                readMode: "מצב קריאה",

                readModeDesc: "מסיר אלמנטי ניווט",

                readingGuide: "מדריך קריאה",

                readingGuideDesc: "סרגל הדגשה נייד",

                usefulLinks: "קישורים שימושיים",

                usefulLinksDesc: "משאבים וקישורי נגישות",

                stopAnimation: "עצור אנימציה",

                stopAnimationDesc: "משה את כל אנימציות CSS",

                readingMask: "מסכת קריאה",

                readingMaskDesc: "שכבת כיסוי שקופה למחצה",

                highlightHover: "הדגש hover",

                highlightHoverDesc: "משוב ויזואלי בעת מעבר עכבר",

                highlightFocus: "הדגש פוקוס",

                highlightFocusDesc: "אינדיקטורי פוקוס בולטים",

                bigBlackCursor: "סמן שחור גדול",

                bigBlackCursorDesc: "מגדיל את גודל הסמן",

                bigWhiteCursor: "סמן לבן גדול",

                bigWhiteCursorDesc: "מגדיל את גודל הסמן",

                resetSettings: "איפוס הגדרות",

                statement: "הצהרה",

                hideInterface: "הסתר ממשק",

                accessibilityFeatures: "תכונות נגישות",

                // Additional detailed descriptions

                keyboardNavDetailed: "פרופיל זה מאפשר לאנשים עם מוגבלות מוטורית להפעיל את האתר באמצעות מקשי המקלדת (Tab, Shift+Tab, Enter) וקיצורי דרך (למשל \"M\" לתפריטים, \"H\" לכותרות, \"F\" לטופסים, \"B\" לכפתורים, \"G\" לגרפיקה).",

                keyboardNavNote: "הערה: פרופיל זה מופעל אוטומטית למשתמשי מקלדת.",

                screenReaderDetailed: "פרופיל זה מתאים את האתר להיות תואם לקוראי מסך כמו JAWS, NVDA, VoiceOver ו-TalkBack. תוכנת קורא המסך מותקנת במחשב ובסמארטפון של המשתמש העיוור, ואתרים צריכים להבטיח תאימות.",

                screenReaderNote: "הערה: פרופיל זה מופעל אוטומטית לקוראי מסך.",

                activatesWithScreenReader: "מופעל עם קורא מסך",

                activatesWithKeyboardNav: "מופעל עם ניווט במקלדת",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "להסתיר את ממשק הנגישות?",
                hideInterfaceModalText: "שימו לב: אם תבחרו להסתיר את ממשק הנגישות, לא תוכלו לראות אותו יותר, אלא אם תמחקו את היסטוריית הגלישה והנתונים. האם אתם בטוחים שברצונכם להסתיר את הממשק?",
                hideInterfaceModalAccept: "קבל",
                hideInterfaceModalCancel: "בטל",

                // Toggle switch text
                toggleOn: "כן",
                toggleOff: "לא"

            },

            ru: {
                title: "Настройки доступности",
    profilesTitle: "Выберите подходящий профиль доступности",
    seizureSafe: "Профиль против эпилепсии",
    seizureSafeDesc: "Устраняет вспышки и снижает цвета",
                visionImpaired: "Профиль для слабовидящих",
                visionImpairedDesc: "Улучшает визуальные элементы сайта",
                adhdFriendly: "Профиль для СДВГ",
    adhdFriendlyDesc: "Больше концентрации и меньше отвлекающих факторов",
                cognitiveDisability: "Профиль когнитивных нарушений",
                cognitiveDisabilityDesc: "Помогает с чтением и концентрацией",
    keyboardNav: "Навигация с клавиатуры (моторная)",
    keyboardNavDesc: "Использование сайта с клавиатуры",
    screenReader: "Слепые пользователи (скрин-ридер)",
    screenReaderDesc: "Оптимизация сайта для скрин-ридеров",
                contentScaling: "Масштабирование контента",
    contentScalingDesc: "Масштабирование контента с помощью стрелок",
                readableFont: "Читаемый шрифт",
                readableFontDesc: "Шрифты с высокой читаемостью",
    highlightTitles: "Выделение заголовков",
    highlightTitlesDesc: "Добавление рамок вокруг заголовков",
    highlightLinks: "Выделение ссылок",
    highlightLinksDesc: "Добавление рамок вокруг ссылок",
                textMagnifier: "Увеличительное стекло для текста",
                textMagnifierDesc: "Плавающий инструмент увеличения",
    fontSizing: "Настройка размера шрифта",
    fontSizingDesc: "Размер шрифта с помощью стрелок",
    alignCenter: "Выравнивание по центру",
                alignCenterDesc: "Центрирует весь текстовый контент",
    adjustLineHeight: "Настройка межстрочного интервала",
    adjustLineHeightDesc: "Межстрочный интервал с помощью стрелок",
    adjustLetterSpacing: "Настройка межбуквенного интервала",
    adjustLetterSpacingDesc: "Межбуквенный интервал с помощью стрелок",
    alignLeft: "Выравнивание по левому краю",
                alignLeftDesc: "Выравнивает текстовый контент по левому краю",
    alignRight: "Выравнивание по правому краю",
                alignRightDesc: "Выравнивает текстовый контент по правому краю",
                darkContrast: "Темный контраст",
                darkContrastDesc: "Темный фон со светлым текстом",
                lightContrast: "Светлый контраст",
                lightContrastDesc: "Светлый фон с темным текстом",
                highContrast: "Высокий контраст",
                highContrastDesc: "Максимальная реализация контраста",
                highSaturation: "Высокая насыщенность",
    highSaturationDesc: "Увеличивает интенсивность цветов",
    adjustTextColors: "Настройка цветов текста",
                adjustTextColorsDesc: "Функциональность выбора цвета",
    monochrome: "Монохром",
                monochromeDesc: "Удаляет все цвета кроме черного, белого, серого",
    adjustTitleColors: "Настройка цветов заголовков",
    adjustTitleColorsDesc: "Настройка цветов для заголовков",
                lowSaturation: "Низкая насыщенность",
    lowSaturationDesc: "Снижает интенсивность цветов",
    adjustBgColors: "Настройка цветов фона",
    adjustBgColorsDesc: "Настройка цветов фона",
                muteSound: "Отключить звук",
                muteSoundDesc: "Отключает весь аудио контент",
                hideImages: "Скрыть изображения",
    hideImagesDesc: "Переключение для скрытия всех изображений",
                readMode: "Режим чтения",
                readModeDesc: "Удаляет элементы навигации",
                readingGuide: "Руководство по чтению",
                readingGuideDesc: "Подвижная полоса выделения",
                usefulLinks: "Полезные ссылки",
                usefulLinksDesc: "Ресурсы и ссылки доступности",
                stopAnimation: "Остановить анимацию",
                stopAnimationDesc: "Приостанавливает все CSS анимации",
                readingMask: "Маска для чтения",
                readingMaskDesc: "Полупрозрачное наложение",
    highlightHover: "Выделение при наведении",
                highlightHoverDesc: "Визуальная обратная связь при наведении",
    highlightFocus: "Выделение фокуса",
    highlightFocusDesc: "Выделенные индикаторы фокуса",
                bigBlackCursor: "Большой черный курсор",
                bigBlackCursorDesc: "Увеличивает размер курсора",
                bigWhiteCursor: "Большой белый курсор",
                bigWhiteCursorDesc: "Увеличивает размер курсора",
                resetSettings: "Сбросить настройки",
                statement: "Заявление",
                hideInterface: "Скрыть интерфейс",
                accessibilityFeatures: "Функции доступности",

    // Дополнительные подробные описания
    keyboardNavDetailed: "Этот профиль позволяет людям с моторными нарушениями управлять сайтом с помощью клавиш клавиатуры (Tab, Shift+Tab, Enter) и горячих клавиш (например, \"M\" для меню, \"H\" для заголовков, \"F\" для форм, \"B\" для кнопок, \"G\" для графики).",
                keyboardNavNote: "Примечание: Этот профиль автоматически активируется для пользователей клавиатуры.",
    screenReaderDetailed: "Этот профиль настраивает сайт для совместимости со скрин-ридерами, такими как JAWS, NVDA, VoiceOver и TalkBack. Программное обеспечение скрин-ридера установлено на компьютере и смартфоне слепого пользователя, и веб-сайты должны обеспечивать совместимость.",
    screenReaderNote: "Примечание: Этот профиль автоматически активируется со скрин-ридерами.",
    activatesWithScreenReader: "Активируется со скрин-ридером",
    activatesWithKeyboardNav: "Активируется с навигацией по клавиатуре",
    
    // Hide Interface Modal
    hideInterfaceModalTitle: "Скрыть интерфейс доступности?",
    hideInterfaceModalText: "Обратите внимание: Если вы решите скрыть интерфейс доступности, вы больше не сможете его видеть, если только не очистите историю браузера и данные. Вы уверены, что хотите скрыть интерфейс?",
    hideInterfaceModalAccept: "Принять",
    hideInterfaceModalCancel: "Отмена",

    // Toggle switch text
    toggleOn: "ВКЛ",
    toggleOff: "ВЫКЛ"
},
            tw: {
    title: "無障礙調整",
    profilesTitle: "為您選擇合適的無障礙設定檔",
    seizureSafe: "防癲癇設定檔",
    seizureSafeDesc: "消除閃爍並減少顏色",
    visionImpaired: "視力受損設定檔",
    visionImpairedDesc: "增強網站的視覺效果",
    adhdFriendly: "ADHD友善設定檔",
    adhdFriendlyDesc: "更多專注，更少分心",
    cognitiveDisability: "認知障礙設定檔",
    cognitiveDisabilityDesc: "協助閱讀和專注",
    keyboardNav: "鍵盤導航（運動功能）",
    keyboardNavDesc: "使用鍵盤操作網站",
    screenReader: "盲人用戶（螢幕閱讀器）",
    screenReaderDesc: "為螢幕閱讀器優化網站",
    contentScaling: "內容縮放",
    contentScalingDesc: "使用箭頭控制縮放內容",
    readableFont: "易讀字體",
    readableFontDesc: "高可讀性字體",
    highlightTitles: "突出標題",
    highlightTitlesDesc: "在標題周圍添加框線",
    highlightLinks: "突出連結",
    highlightLinksDesc: "在連結周圍添加框線",
    textMagnifier: "文字放大鏡",
    textMagnifierDesc: "浮動放大工具",
    fontSizing: "調整字體大小",
    fontSizingDesc: "使用箭頭控制字體大小",
    alignCenter: "置中對齊",
    alignCenterDesc: "將所有文字內容置中",
    adjustLineHeight: "調整行高",
    adjustLineHeightDesc: "使用箭頭控制行高",
    adjustLetterSpacing: "調整字母間距",
    adjustLetterSpacingDesc: "使用箭頭控制字母間距",
    alignLeft: "左對齊",
    alignLeftDesc: "將文字內容左對齊",
    alignRight: "右對齊",
    alignRightDesc: "將文字內容右對齊",
    darkContrast: "深色對比",
    darkContrastDesc: "深色背景配淺色文字",
    lightContrast: "淺色對比",
    lightContrastDesc: "淺色背景配深色文字",
    highContrast: "高對比",
    highContrastDesc: "最大對比度實施",
    highSaturation: "高飽和度",
    highSaturationDesc: "增加顏色強度",
    adjustTextColors: "調整文字顏色",
    adjustTextColorsDesc: "顏色選擇器功能",
    monochrome: "單色",
    monochromeDesc: "移除除黑、白、灰以外的所有顏色",
    adjustTitleColors: "調整標題顏色",
    adjustTitleColorsDesc: "標題顏色自訂",
    lowSaturation: "低飽和度",
    lowSaturationDesc: "降低顏色強度",
    adjustBgColors: "調整背景顏色",
    adjustBgColorsDesc: "背景顏色自訂",
    muteSound: "靜音",
    muteSoundDesc: "停用所有音訊內容",
    hideImages: "隱藏圖片",
    hideImagesDesc: "切換隱藏所有圖片",
    readMode: "閱讀模式",
    readModeDesc: "移除導航元素",
    readingGuide: "閱讀指南",
    readingGuideDesc: "可移動的突出顯示條",
    usefulLinks: "有用連結",
    usefulLinksDesc: "無障礙資源和連結",
    stopAnimation: "停止動畫",
    stopAnimationDesc: "暫停所有CSS動畫",
    readingMask: "閱讀遮罩",
    readingMaskDesc: "半透明覆蓋層",
    highlightHover: "懸停突出",
    highlightHoverDesc: "懸停時的視覺回饋",
    highlightFocus: "焦點突出",
    highlightFocusDesc: "突出的焦點指示器",
    bigBlackCursor: "大黑色游標",
    bigBlackCursorDesc: "增加游標大小",
    bigWhiteCursor: "大白色游標",
    bigWhiteCursorDesc: "增加游標大小",
    resetSettings: "重設設定",
    statement: "聲明",
    hideInterface: "隱藏介面",
    accessibilityFeatures: "無障礙功能",
    
    // 額外的詳細描述
    keyboardNavDetailed: "此設定檔讓運動功能受損的人士能夠使用鍵盤按鍵（Tab、Shift+Tab、Enter）和快捷鍵（例如「M」代表選單、「H」代表標題、「F」代表表單、「B」代表按鈕、「G」代表圖形）操作網站。",
    keyboardNavNote: "注意：此設定檔會自動為鍵盤用戶啟用。",
    screenReaderDetailed: "此設定檔調整網站以與JAWS、NVDA、VoiceOver和TalkBack等螢幕閱讀器相容。螢幕閱讀器軟體安裝在盲人用戶的電腦和智慧型手機上，網站應確保相容性。",
    screenReaderNote: "注意：此設定檔會自動與螢幕閱讀器一起啟用。",
    activatesWithScreenReader: "與螢幕閱讀器一起啟用",
    activatesWithKeyboardNav: "與鍵盤導航一起啟用",
    
    // Hide Interface Modal
    hideInterfaceModalTitle: "隱藏無障礙介面？",
    hideInterfaceModalText: "請注意：如果您選擇隱藏無障礙介面，除非清除瀏覽歷史記錄和數據，否則將無法再看到它。您確定要隱藏介面嗎？",
    hideInterfaceModalAccept: "接受",
    hideInterfaceModalCancel: "取消",

    // Toggle switch text
    toggleOn: "開啟",
    toggleOff: "關閉"
},
            ar: {

                title: "إعدادات إمكانية الوصول",

                profilesTitle: "اختر ملف إمكانية الوصول المناسب لك",

                seizureSafe: "ملف آمن للنوبات",

                seizureSafeDesc: "يزيل الومضات ويقلل الألوان",

                visionImpaired: "ملف للمعاقين بصرياً",

                visionImpairedDesc: "يحسن العناصر البصرية للموقع",

                adhdFriendly: "ملف صديق لاضطراب فرط الحركة",

                adhdFriendlyDesc: "يقلل المشتتات ويساعد على التركيز",

                cognitiveDisability: "ملف الإعاقة المعرفية",

                cognitiveDisabilityDesc: "يساعد في القراءة والتركيز",

                keyboardNav: "التنقل بلوحة المفاتيح (الحركي)",

                keyboardNavDesc: "استخدم الموقع بلوحة المفاتيح",

                screenReader: "المستخدمون المكفوفون (قارئ الشاشة)",

                screenReaderDesc: "تحسين الموقع لقارئات الشاشة",

                contentScaling: "تحجيم المحتوى",

                contentScalingDesc: "زيادة أو تقليل حجم المحتوى",

                readableFont: "خط مقروء",

                readableFontDesc: "خطوط عالية الوضوح",

                highlightTitles: "تمييز العناوين",

                highlightTitlesDesc: "إضافة صناديق حول العناوين",

                highlightLinks: "تمييز الروابط",

                highlightLinksDesc: "إضافة صناديق حول الروابط",

                textMagnifier: "مكبر النص",

                textMagnifierDesc: "أداة مكبر عائمة",

                fontSizing: "حجم الخط",

                fontSizingDesc: "زيادة أو تقليل حجم الخط",

                alignCenter: "محاذاة الوسط",

                alignCenterDesc: "محاذاة كل محتوى النص في الوسط",

                adjustLineHeight: "ضبط ارتفاع السطر",

                adjustLineHeightDesc: "زيادة أو تقليل ارتفاع السطر",

                adjustLetterSpacing: "ضبط المسافة بين الحروف",

                adjustLetterSpacingDesc: "زيادة أو تقليل المسافة بين الحروف",

                alignLeft: "محاذاة اليسار",

                alignLeftDesc: "محاذاة محتوى النص إلى اليسار",

                alignRight: "محاذاة اليمين",

                alignRightDesc: "محاذاة محتوى النص إلى اليمين",

                darkContrast: "تباين داكن",

                darkContrastDesc: "خلفية داكنة مع نص فاتح",

                lightContrast: "تباين فاتح",

                lightContrastDesc: "خلفية فاتحة مع نص داكن",

                highContrast: "تباين عالي",

                highContrastDesc: "تنفيذ أقصى تباين",

                highSaturation: "تشبع عالي",

                highSaturationDesc: "يزيد من كثافة اللون",

                adjustTextColors: "ضبط ألوان النص",

                adjustTextColorsDesc: "وظيفة منتقي الألوان",

                monochrome: "أحادي اللون",

                monochromeDesc: "يزيل جميع الألوان ما عدا الأسود والأبيض والرمادي",

                adjustTitleColors: "ضبط ألوان العناوين",

                adjustTitleColorsDesc: "تخصيص لون للعناوين",

                lowSaturation: "تشبع منخفض",

                lowSaturationDesc: "يقلل من كثافة اللون",

                adjustBgColors: "ضبط ألوان الخلفية",

                adjustBgColorsDesc: "تخصيص لون الخلفية",

                muteSound: "كتم الصوت",

                muteSoundDesc: "يعطل كل محتوى الصوت",

                hideImages: "إخفاء الصور",

                hideImagesDesc: "تبديل لإخفاء جميع الصور",

                readMode: "وضع القراءة",

                readModeDesc: "يزيل عناصر التنقل",

                readingGuide: "دليل القراءة",

                readingGuideDesc: "شريط تمييز متحرك",

                usefulLinks: "روابط مفيدة",

                usefulLinksDesc: "موارد وروابط إمكانية الوصول",

                stopAnimation: "إيقاف الرسوم المتحركة",

                stopAnimationDesc: "يوقف جميع رسوم CSS المتحركة",

                readingMask: "قناع القراءة",

                readingMaskDesc: "تراكب شبه شفاف",

                highlightHover: "تمييز التمرير",

                highlightHoverDesc: "ردود فعل بصرية عند التمرير",

                highlightFocus: "تمييز التركيز",

                highlightFocusDesc: "مؤشرات تركيز بارزة",

                bigBlackCursor: "مؤشر أسود كبير",

                bigBlackCursorDesc: "يزيد من حجم المؤشر",

                bigWhiteCursor: "مؤشر أبيض كبير",

                bigWhiteCursorDesc: "يزيد من حجم المؤشر",

                resetSettings: "إعادة تعيين الإعدادات",

                statement: "بيان",

                hideInterface: "إخفاء الواجهة",

                accessibilityFeatures: "ميزات إمكانية الوصول",

                // Additional detailed descriptions

                keyboardNavDetailed: "هذا الملف يتيح للأشخاص ذوي الإعاقة الحركية تشغيل الموقع باستخدام مفاتيح لوحة المفاتيح (Tab, Shift+Tab, Enter) والاختصارات (مثل \"M\" للقوائم، \"H\" للعناوين، \"F\" للنماذج، \"B\" للأزرار، \"G\" للرسوم).",

                keyboardNavNote: "ملاحظة: يتم تفعيل هذا الملف تلقائياً لمستخدمي لوحة المفاتيح.",

                screenReaderDetailed: "هذا الملف يعدل الموقع ليكون متوافقاً مع قارئات الشاشة مثل JAWS و NVDA و VoiceOver و TalkBack. برنامج قارئ الشاشة مثبت على حاسوب وهاتف المستخدم المكفوف، ويجب على المواقع ضمان التوافق.",

                screenReaderNote: "ملاحظة: يتم تفعيل هذا الملف تلقائياً لقارئات الشاشة.",

                activatesWithScreenReader: "يتفعل مع قارئ الشاشة",

                activatesWithKeyboardNav: "يتفعل مع التنقل بلوحة المفاتيح",
                
                // Hide Interface Modal
                hideInterfaceModalTitle: "إخفاء واجهة إمكانية الوصول؟",
                hideInterfaceModalText: "يرجى ملاحظة: إذا اخترت إخفاء واجهة إمكانية الوصول، لن تتمكن من رؤيتها مرة أخرى، إلا إذا قمت بمسح سجل التصفح والبيانات. هل أنت متأكد من أنك تريد إخفاء الواجهة؟",
                hideInterfaceModalAccept: "قبول",
                hideInterfaceModalCancel: "إلغاء",

                // Toggle switch text
                toggleOn: "نعم",
                toggleOff: "لا"

            },
            ae: {
    title: "تعديلات إمكانية الوصول",
    profilesTitle: "اختر ملف إمكانية الوصول المناسب لك",
    seizureSafe: "ملف آمن من النوبات",
    seizureSafeDesc: "يزيل الومضات ويقلل الألوان",
    visionImpaired: "ملف ضعاف البصر",
    visionImpairedDesc: "يحسن العناصر البصرية للموقع",
    adhdFriendly: "ملف صديق لاضطراب فرط الحركة",
    adhdFriendlyDesc: "مزيد من التركيز وأقل تشتيت",
    cognitiveDisability: "ملف الإعاقة المعرفية",
    cognitiveDisabilityDesc: "يساعد في القراءة والتركيز",
    keyboardNav: "التنقل بلوحة المفاتيح (حركي)",
    keyboardNavDesc: "استخدام الموقع بلوحة المفاتيح",
    screenReader: "المستخدمون المكفوفون (قارئ الشاشة)",
    screenReaderDesc: "تحسين الموقع لقارئات الشاشة",
    contentScaling: "تحجيم المحتوى",
    contentScalingDesc: "تحجيم المحتوى بأزرار الأسهم",
    readableFont: "خط مقروء",
    readableFontDesc: "خطوط عالية الوضوح",
    highlightTitles: "تمييز العناوين",
    highlightTitlesDesc: "إضافة إطارات حول العناوين",
    highlightLinks: "تمييز الروابط",
    highlightLinksDesc: "إضافة إطارات حول الروابط",
    textMagnifier: "مكبر النص",
    textMagnifierDesc: "أداة تكبير عائمة",
    fontSizing: "ضبط حجم الخط",
    fontSizingDesc: "حجم الخط بأزرار الأسهم",
    alignCenter: "محاذاة للوسط",
    alignCenterDesc: "يوسط كل محتوى النص",
    adjustLineHeight: "ضبط ارتفاع السطر",
    adjustLineHeightDesc: "ارتفاع السطر بأزرار الأسهم",
    adjustLetterSpacing: "ضبط المسافة بين الحروف",
    adjustLetterSpacingDesc: "المسافة بين الحروف بأزرار الأسهم",
    alignLeft: "محاذاة لليسار",
    alignLeftDesc: "يحاذي محتوى النص لليسار",
    alignRight: "محاذاة لليمين",
    alignRightDesc: "يحاذي محتوى النص لليمين",
    darkContrast: "تباين داكن",
    darkContrastDesc: "خلفية داكنة مع نص فاتح",
    lightContrast: "تباين فاتح",
    lightContrastDesc: "خلفية فاتحة مع نص داكن",
    highContrast: "تباين عالي",
    highContrastDesc: "تطبيق أقصى تباين",
    highSaturation: "تشبع عالي",
    highSaturationDesc: "يزيد من كثافة الألوان",
    adjustTextColors: "ضبط ألوان النص",
    adjustTextColorsDesc: "وظيفة منتقي الألوان",
    monochrome: "أحادي اللون",
    monochromeDesc: "يزيل كل الألوان عدا الأسود والأبيض والرمادي",
    adjustTitleColors: "ضبط ألوان العناوين",
    adjustTitleColorsDesc: "تخصيص الألوان للعناوين",
    lowSaturation: "تشبع منخفض",
    lowSaturationDesc: "يقلل من كثافة الألوان",
    adjustBgColors: "ضبط ألوان الخلفية",
    adjustBgColorsDesc: "تخصيص ألوان الخلفية",
    muteSound: "كتم الصوت",
    muteSoundDesc: "يعطل كل المحتوى الصوتي",
    hideImages: "إخفاء الصور",
    hideImagesDesc: "تبديل لإخفاء كل الصور",
    readMode: "وضع القراءة",
    readModeDesc: "يزيل عناصر التنقل",
    readingGuide: "دليل القراءة",
    readingGuideDesc: "شريط تمييز متحرك",
    usefulLinks: "روابط مفيدة",
    usefulLinksDesc: "مصادر وروابط إمكانية الوصول",
    stopAnimation: "إيقاف الرسوم المتحركة",
    stopAnimationDesc: "يوقف كل رسوم CSS المتحركة",
    readingMask: "قناع القراءة",
    readingMaskDesc: "طبقة شفافة جزئياً",
    highlightHover: "تمييز عند التمرير",
    highlightHoverDesc: "ردود فعل بصرية عند التمرير",
    highlightFocus: "تمييز التركيز",
    highlightFocusDesc: "مؤشرات تركيز بارزة",
    bigBlackCursor: "مؤشر أسود كبير",
    bigBlackCursorDesc: "يزيد من حجم المؤشر",
    bigWhiteCursor: "مؤشر أبيض كبير",
    bigWhiteCursorDesc: "يزيد من حجم المؤشر",
    resetSettings: "إعادة تعيين الإعدادات",
    statement: "بيان",
    hideInterface: "إخفاء الواجهة",
    accessibilityFeatures: "ميزات إمكانية الوصول",
    
    // أوصاف مفصلة إضافية
    keyboardNavDetailed: "هذا الملف يتيح للأشخاص ذوي الإعاقات الحركية تشغيل الموقع باستخدام مفاتيح لوحة المفاتيح (Tab، Shift+Tab، Enter) والاختصارات (مثل \"M\" للقوائم، \"H\" للعناوين، \"F\" للنماذج، \"B\" للأزرار، \"G\" للرسوم).",
    keyboardNavNote: "ملاحظة: هذا الملف يُفعل تلقائياً لمستخدمي لوحة المفاتيح.",
    screenReaderDetailed: "هذا الملف يعدل الموقع ليكون متوافقاً مع قارئات الشاشة مثل JAWS وNVDA وVoiceOver وTalkBack. برنامج قارئ الشاشة مثبت على حاسوب وهاتف المستخدم المكفوف، والمواقع يجب أن تضمن التوافق.",
    screenReaderNote: "ملاحظة: هذا الملف يُفعل تلقائياً مع قارئات الشاشة.",
    activatesWithScreenReader: "يُفعل مع قارئ الشاشة",
    activatesWithKeyboardNav: "يُفعل مع التنقل بلوحة المفاتيح",
    
    // Hide Interface Modal
    hideInterfaceModalTitle: "إخفاء واجهة إمكانية الوصول؟",
    hideInterfaceModalText: "يرجى ملاحظة: إذا اخترت إخفاء واجهة إمكانية الوصول، لن تتمكن من رؤيتها مرة أخرى، إلا إذا قمت بمسح سجل التصفح والبيانات. هل أنت متأكد من أنك تريد إخفاء الواجهة؟",
    hideInterfaceModalAccept: "قبول",
    hideInterfaceModalCancel: "إلغاء",

    // Toggle switch text
    toggleOn: "نعم",
    toggleOff: "لا"
},
            zh: { title: "无障碍调整", seizureSafe: "癫痫安全配置文件", seizureSafeDesc: "清除闪烁并减少颜色", visionImpaired: "视力障碍配置文件", visionImpairedDesc: "增强网站的视觉效果", adhdFriendly: "多动症友好配置文件", adhdFriendlyDesc: "减少干扰并帮助集中注意力", fontSizing: "字体大小", fontSizingDesc: "增加或减少字体大小", adjustLineHeight: "调整行高", adjustLineHeightDesc: "增加或减少行高", adjustLetterSpacing: "调整字母间距", adjustLetterSpacingDesc: "增加或减少字母间距", contentScaling: "内容缩放", contentScalingDesc: "增加或减少内容大小", resetSettings: "重置设置", statement: "声明", hideInterface: "隐藏界面", accessibilityFeatures: "无障碍功能", toggleOn: "开启", toggleOff: "关闭" },

            ja: { title: "アクセシビリティ調整", seizureSafe: "発作安全プロファイル", seizureSafeDesc: "フラッシュを除去し、色を減らします", visionImpaired: "視覚障害者プロファイル", visionImpairedDesc: "ウェブサイトの視覚要素を向上させます", adhdFriendly: "ADHDフレンドリープロファイル", adhdFriendlyDesc: "注意散漫を減らし、集中力を高めます", fontSizing: "フォントサイズ", fontSizingDesc: "フォントサイズを増減します", adjustLineHeight: "行の高さを調整", adjustLineHeightDesc: "行の高さを増減します", adjustLetterSpacing: "文字間隔を調整", adjustLetterSpacingDesc: "文字間隔を増減します", contentScaling: "コンテンツスケーリング", contentScalingDesc: "コンテンツサイズを増減します", resetSettings: "設定をリセット", statement: "ステートメント", hideInterface: "インターフェースを非表示", accessibilityFeatures: "アクセシビリティ機能", toggleOn: "オン", toggleOff: "オフ" },

            pl: { title: "Ustawienia dostępności", seizureSafe: "Profil bezpieczny dla napadów", seizureSafeDesc: "Usuwa błyski i zmniejsza kolory", visionImpaired: "Profil dla osób niedowidzących", visionImpairedDesc: "Poprawia elementy wizualne strony", adhdFriendly: "Profil przyjazny dla ADHD", adhdFriendlyDesc: "Zmniejsza rozpraszanie i pomaga się skupić", fontSizing: "Rozmiar czcionki", fontSizingDesc: "Zwiększ lub zmniejsz rozmiar czcionki", adjustLineHeight: "Dostosuj wysokość linii", adjustLineHeightDesc: "Zwiększ lub zmniejsz wysokość linii", adjustLetterSpacing: "Dostosuj odstępy między literami", adjustLetterSpacingDesc: "Zwiększ lub zmniejsz odstępy między literami", contentScaling: "Skalowanie treści", contentScalingDesc: "Zwiększ lub zmniejsz rozmiar treści", resetSettings: "Resetuj ustawienia", statement: "Oświadczenie", hideInterface: "Ukryj interfejs", accessibilityFeatures: "Funkcje dostępności" },

            tr: { title: "Erişilebilirlik Ayarları", seizureSafe: "Nöbet Güvenli Profil", seizureSafeDesc: "Flaşları temizler ve renkleri azaltır", visionImpaired: "Görme Engelli Profil", visionImpairedDesc: "Web sitesinin görsel öğelerini geliştirir", adhdFriendly: "DEHB Dostu Profil", adhdFriendlyDesc: "Dikkat dağınıklığını azaltır ve odaklanmaya yardımcı olur", fontSizing: "Yazı Tipi Boyutu", fontSizingDesc: "Yazı tipi boyutunu artır veya azalt", adjustLineHeight: "Satır Yüksekliğini Ayarla", adjustLineHeightDesc: "Satır yüksekliğini artır veya azalt", adjustLetterSpacing: "Harf Aralığını Ayarla", adjustLetterSpacingDesc: "Harf aralığını artır veya azalt", contentScaling: "İçerik Ölçeklendirme", contentScalingDesc: "İçerik boyutunu artır veya azalt", resetSettings: "Ayarları Sıfırla", statement: "Beyan", hideInterface: "Arayüzü Gizle", accessibilityFeatures: "Erişilebilirlik Özellikleri" },

            // Add new language codes from screenshots

            ps: { title: "إعدادات إمكانية الوصول", profilesTitle: "اختر ملف إمكانية الوصول المناسب لك", seizureSafe: "ملف آمن للنوبات", seizureSafeDesc: "يزيل الومضات ويقلل الألوان", visionImpaired: "ملف للمعاقين بصرياً", visionImpairedDesc: "يحسن العناصر البصرية للموقع", adhdFriendly: "ملف صديق لاضطراب فرط الحركة", adhdFriendlyDesc: "يقلل المشتتات ويساعد على التركيز", fontSizing: "حجم الخط", fontSizingDesc: "زيادة أو تقليل حجم الخط", adjustLineHeight: "ضبط ارتفاع السطر", adjustLineHeightDesc: "زيادة أو تقليل ارتفاع السطر", adjustLetterSpacing: "ضبط المسافة بين الحروف", adjustLetterSpacingDesc: "زيادة أو تقليل المسافة بين الحروف", contentScaling: "تحجيم المحتوى", contentScalingDesc: "زيادة أو تقليل حجم المحتوى", resetSettings: "إعادة تعيين الإعدادات", statement: "بيان", hideInterface: "إخفاء الواجهة", accessibilityFeatures: "ميزات إمكانية الوصول" },

            cz: { title: "Nastavení přístupnosti", profilesTitle: "Vyberte správný profil přístupnosti pro vás", seizureSafe: "Profil bezpečný pro záchvaty", seizureSafeDesc: "Odstraňuje blikání a snižuje barvy", visionImpaired: "Profil pro zrakově postižené", visionImpairedDesc: "Zlepšuje vizuální prvky webu", adhdFriendly: "Profil vhodný pro ADHD", adhdFriendlyDesc: "Snižuje rozptylování a pomáhá se soustředit", fontSizing: "Velikost písma", fontSizingDesc: "Zvětšit nebo zmenšit velikost písma", adjustLineHeight: "Upravit výšku řádku", adjustLineHeightDesc: "Zvětšit nebo zmenšit výšku řádku", adjustLetterSpacing: "Upravit mezery mezi písmeny", adjustLetterSpacingDesc: "Zvětšit nebo zmenšit mezery mezi písmeny", contentScaling: "Škálování obsahu", contentScalingDesc: "Zvětšit nebo zmenšit velikost obsahu", resetSettings: "Obnovit nastavení", statement: "Prohlášení", hideInterface: "Skrýt rozhraní", accessibilityFeatures: "Funkce přístupnosti" },

            si: { title: "Nastavitve dostopnosti", profilesTitle: "Izberite pravilen profil dostopnosti za vas", seizureSafe: "Profil varen za napade", seizureSafeDesc: "Odstrani utripanje in zmanjša barve", visionImpaired: "Profil za slabovidne", visionImpairedDesc: "Izboljša vizualne elemente spletne strani", adhdFriendly: "Profil prijazen za ADHD", adhdFriendlyDesc: "Zmanjša motnje in pomaga pri osredotočanju", fontSizing: "Velikost pisave", fontSizingDesc: "Povečaj ali zmanjšaj velikost pisave", adjustLineHeight: "Prilagodi višino vrstice", adjustLineHeightDesc: "Povečaj ali zmanjšaj višino vrstice", adjustLetterSpacing: "Prilagodi razmik med črkami", adjustLetterSpacingDesc: "Povečaj ali zmanjšaj razmik med črkami", contentScaling: "Povečevanje vsebine", contentScalingDesc: "Povečaj ali zmanjšaj velikost vsebine", resetSettings: "Ponastavi nastavitve", statement: "Izjava", hideInterface: "Skrij vmesnik", accessibilityFeatures: "Funkcije dostopnosti" },

            no: { title: "Tilgjengelighetsjusteringer", profilesTitle: "Velg riktig tilgjengelighetsprofil for deg", seizureSafe: "Anfallssikker profil", seizureSafeDesc: "Fjerner blitser og reduserer farger", visionImpaired: "Profil for synshemmede", visionImpairedDesc: "Forbedrer nettstedets visuelle elementer", adhdFriendly: "ADHD-vennlig profil", adhdFriendlyDesc: "Reduserer distraksjoner og hjelper med fokus", fontSizing: "Skriftstørrelse", fontSizingDesc: "Øk eller reduser skriftstørrelse", adjustLineHeight: "Juster linjehøyde", adjustLineHeightDesc: "Øk eller reduser linjehøyde", adjustLetterSpacing: "Juster bokstavavstand", adjustLetterSpacingDesc: "Øk eller reduser bokstavavstand", contentScaling: "Innholdsskalering", contentScalingDesc: "Øk eller reduser innholdsstørrelse", resetSettings: "Tilbakestill innstillinger", statement: "Erklæring", hideInterface: "Skjul grensesnitt", accessibilityFeatures: "Tilgjengelighetsfunksjoner" },

            fi: { title: "Saavutettavuusasetukset", profilesTitle: "Valitse oikea saavutettavuusprofiili sinulle", seizureSafe: "Kohtausvakaa profiili", seizureSafeDesc: "Poistaa välähdyksiä ja vähentää värejä", visionImpaired: "Näkövammaisten profiili", visionImpairedDesc: "Parantaa verkkosivuston visuaalisia elementtejä", adhdFriendly: "ADHD-ystävällinen profiili", adhdFriendlyDesc: "Vähentää häiriötekijöitä ja auttaa keskittymisessä", fontSizing: "Fonttikoko", fontSizingDesc: "Kasvata tai pienennä fonttikokoa", adjustLineHeight: "Säädä rivikorkeutta", adjustLineHeightDesc: "Kasvata tai pienennä rivikorkeutta", adjustLetterSpacing: "Säädä kirjainvälistä", adjustLetterSpacingDesc: "Kasvata tai pienennä kirjainvälistä", contentScaling: "Sisällön skaalaus", contentScalingDesc: "Kasvata tai pienennä sisällön kokoa", resetSettings: "Nollaa asetukset", statement: "Lausunto", hideInterface: "Piilota käyttöliittymä", accessibilityFeatures: "Saavutettavuustoiminnot" },

            ro: { title: "Setări de accesibilitate", profilesTitle: "Alege profilul de accesibilitate potrivit pentru tine", seizureSafe: "Profil sigur pentru crize", seizureSafeDesc: "Elimină flash-urile și reduce culorile", visionImpaired: "Profil pentru persoane cu deficiențe de vedere", visionImpairedDesc: "Îmbunătățește elementele vizuale ale site-ului", adhdFriendly: "Profil prietenos cu ADHD", adhdFriendlyDesc: "Reduce distragerile și ajută la concentrare", fontSizing: "Dimensiunea fontului", fontSizingDesc: "Mărește sau micșorează dimensiunea fontului", adjustLineHeight: "Ajustează înălțimea liniei", adjustLineHeightDesc: "Mărește sau micșorează înălțimea liniei", adjustLetterSpacing: "Ajustează spațierea literelor", adjustLetterSpacingDesc: "Mărește sau micșorează spațierea literelor", contentScaling: "Scalarea conținutului", contentScalingDesc: "Mărește sau micșorează dimensiunea conținutului", resetSettings: "Resetează setările", statement: "Declarație", hideInterface: "Ascunde interfața", accessibilityFeatures: "Funcții de accesibilitate" },

            gr: { title: "Ρυθμίσεις προσβασιμότητας", profilesTitle: "Επιλέξτε το σωστό προφίλ προσβασιμότητας για εσάς", seizureSafe: "Ασφαλές προφίλ για κρίσεις", seizureSafeDesc: "Αφαιρεί τις αναβοσβήσεις και μειώνει τα χρώματα", visionImpaired: "Προφίλ για άτομα με προβλήματα όρασης", visionImpairedDesc: "Βελτιώνει τα οπτικά στοιχεία του ιστότοπου", adhdFriendly: "Φιλικό προφίλ για ADHD", adhdFriendlyDesc: "Μειώνει τις περισπασμούς και βοηθά στην εστίαση", fontSizing: "Μέγεθος γραμματοσειράς", fontSizingDesc: "Αύξηση ή μείωση μεγέθους γραμματοσειράς", adjustLineHeight: "Προσαρμογή ύψους γραμμής", adjustLineHeightDesc: "Αύξηση ή μείωση ύψους γραμμής", adjustLetterSpacing: "Προσαρμογή διαστήματος γραμμάτων", adjustLetterSpacingDesc: "Αύξηση ή μείωση διαστήματος γραμμάτων", contentScaling: "Κλιμάκωση περιεχομένου", contentScalingDesc: "Αύξηση ή μείωση μεγέθους περιεχομένου", resetSettings: "Επαναφορά ρυθμίσεων", statement: "Δήλωση", hideInterface: "Απόκρυψη διεπαφής", accessibilityFeatures: "Λειτουργίες προσβασιμότητας" },

            // Add remaining language codes from screenshots

            ba: { title: "Postavke pristupačnosti", profilesTitle: "Odaberite odgovarajući profil pristupačnosti za vas", seizureSafe: "Siguran profil za napade", seizureSafeDesc: "Uklanja bljeskanje i smanjuje boje", visionImpaired: "Profil za osobe s oštećenjem vida", visionImpairedDesc: "Poboljšava vizualne elemente web stranice", adhdFriendly: "Profil prijateljski za ADHD", adhdFriendlyDesc: "Smanjuje ometanja i pomaže u fokusiranju", fontSizing: "Veličina fonta", fontSizingDesc: "Povećaj ili smanji veličinu fonta", adjustLineHeight: "Prilagodi visinu linije", adjustLineHeightDesc: "Povećaj ili smanji visinu linije", adjustLetterSpacing: "Prilagodi razmak između slova", adjustLetterSpacingDesc: "Povećaj ili smanji razmak između slova", contentScaling: "Skaliranje sadržaja", contentScalingDesc: "Povećaj ili smanji veličinu sadržaja", resetSettings: "Resetuj postavke", statement: "Izjava", hideInterface: "Sakrij interfejs", accessibilityFeatures: "Funkcije pristupačnosti" },

            lu: { title: "Zougangsastellungen", profilesTitle: "Wielt de richtegen Zougangsprofil fir Iech", seizureSafe: "Sécheren Profil fir Kriise", seizureSafeDesc: "Ewechhëlt Blitzen a reduzéiert Faarwen", visionImpaired: "Profil fir Leit mat Gesiichtsschwäch", visionImpairedDesc: "Verbessert d'visuell Elementer vun der Websäit", adhdFriendly: "ADHD-frëndlechen Profil", adhdFriendlyDesc: "Reduzéiert Ofleedungen an hëlleft beim Fokusséieren", fontSizing: "Schrëftgréisst", fontSizingDesc: "Erhéicht oder reduzéiert Schrëftgréisst", adjustLineHeight: "Linnenhéicht upassen", adjustLineHeightDesc: "Erhéicht oder reduzéiert Linnenhéicht", adjustLetterSpacing: "Buschtawenofstand upassen", adjustLetterSpacingDesc: "Erhéicht oder reduzéiert Buschtawenofstand", contentScaling: "Inhalts-Skaléierung", contentScalingDesc: "Erhéicht oder reduzéiert Inhaltsgréisst", resetSettings: "Astellungen zrécksetzen", statement: "Deklaratioun", hideInterface: "Interface verstoppen", accessibilityFeatures: "Zougangsfunktiounen" },

            dk: { title: "Tilgængelighedsindstillinger", profilesTitle: "Vælg den rigtige tilgængelighedsprofil til dig", seizureSafe: "Anfaldssikker profil", seizureSafeDesc: "Fjerner blink og reducerer farver", visionImpaired: "Profil for synshandicappede", visionImpairedDesc: "Forbedrer webstedets visuelle elementer", adhdFriendly: "ADHD-venlig profil", adhdFriendlyDesc: "Reducerer distraktioner og hjælper med fokus", fontSizing: "Skriftstørrelse", fontSizingDesc: "Øg eller reducer skriftstørrelse", adjustLineHeight: "Juster linjehøjde", adjustLineHeightDesc: "Øg eller reducer linjehøjde", adjustLetterSpacing: "Juster bogstavafstand", adjustLetterSpacingDesc: "Øg eller reducer bogstavafstand", contentScaling: "Indholdsskalering", contentScalingDesc: "Øg eller reducer indholdsstørrelse", resetSettings: "Nulstil indstillinger", statement: "Erklæring", hideInterface: "Skjul interface", accessibilityFeatures: "Tilgængelighedsfunktioner" },

            sk: { title: "Nastavenia dostupnosti", profilesTitle: "Vyberte správny profil dostupnosti pre vás", seizureSafe: "Bezpečný profil pre záchvaty", seizureSafeDesc: "Odstraňuje blikanie a znižuje farby", visionImpaired: "Profil pre zrakovo postihnutých", visionImpairedDesc: "Zlepšuje vizuálne prvky webu", adhdFriendly: "Profil vhodný pre ADHD", adhdFriendlyDesc: "Znižuje rozptyľovanie a pomáha sa sústrediť", fontSizing: "Veľkosť písma", fontSizingDesc: "Zväčšiť alebo zmenšiť veľkosť písma", adjustLineHeight: "Upraviť výšku riadku", adjustLineHeightDesc: "Zväčšiť alebo zmenšiť výšku riadku", adjustLetterSpacing: "Upraviť medzery medzi písmenami", adjustLetterSpacingDesc: "Zväčšiť alebo zmenšiť medzery medzi písmenami", contentScaling: "Škálovanie obsahu", contentScalingDesc: "Zväčšiť alebo zmenšiť veľkosť obsahu", resetSettings: "Obnoviť nastavenia", statement: "Vyhlásenie", hideInterface: "Skryť rozhranie", accessibilityFeatures: "Funkcie dostupnosti" },

            se: { title: "Tillgänglighetsinställningar", profilesTitle: "Välj rätt tillgänglighetsprofil för dig", seizureSafe: "Anfallssäker profil", seizureSafeDesc: "Tar bort blinkningar och minskar färger", visionImpaired: "Profil för synskadade", visionImpairedDesc: "Förbättrar webbplatsens visuella element", adhdFriendly: "ADHD-vänlig profil", adhdFriendlyDesc: "Minskar distraktioner och hjälper med fokus", fontSizing: "Typsnittsstorlek", fontSizingDesc: "Öka eller minska typsnittsstorlek", adjustLineHeight: "Justera radhöjd", adjustLineHeightDesc: "Öka eller minska radhöjd", adjustLetterSpacing: "Justera bokstavavstånd", adjustLetterSpacingDesc: "Öka eller minska bokstavavstånd", contentScaling: "Innehållsskalning", contentScalingDesc: "Öka eller minska innehållsstorlek", resetSettings: "Återställ inställningar", statement: "Förklaring", hideInterface: "Dölj gränssnitt", accessibilityFeatures: "Tillgänglighetsfunktioner" },

            ua: { title: "Налаштування доступності", profilesTitle: "Виберіть правильний профіль доступності для вас", seizureSafe: "Безпечний профіль для нападів", seizureSafeDesc: "Прибирає спалахи та зменшує кольори", visionImpaired: "Профіль для людей з порушенням зору", visionImpairedDesc: "Покращує візуальні елементи веб-сайту", adhdFriendly: "Профіль, дружній до ADHD", adhdFriendlyDesc: "Зменшує відволікання та допомагає зосередитися", fontSizing: "Розмір шрифту", fontSizingDesc: "Збільшити або зменшити розмір шрифту", adjustLineHeight: "Налаштувати висоту рядка", adjustLineHeightDesc: "Збільшити або зменшити висоту рядка", adjustLetterSpacing: "Налаштувати міжбуквений інтервал", adjustLetterSpacingDesc: "Збільшити або зменшити міжбуквений інтервал", contentScaling: "Масштабування контенту", contentScalingDesc: "Збільшити або зменшити розмір контенту", resetSettings: "Скинути налаштування", statement: "Заява", hideInterface: "Приховати інтерфейс", accessibilityFeatures: "Функції доступності" },

            ie: { title: "Socruithe Inrochtaineachta", profilesTitle: "Roghnaigh an próifíl inrochtaineachta ceart duit", seizureSafe: "Próifíl sábhailte do thuitimí", seizureSafeDesc: "Baineann sé lasracha agus laghdaíonn dathanna", visionImpaired: "Próifíl do dhaoine le lagú radhairc", visionImpairedDesc: "Feabhsaíonn eilimintí amhairc an láithreáin ghréasáin", adhdFriendly: "Próifíl cairdiúil ADHD", adhdFriendlyDesc: "Laghdaíonn mearbhall agus cuidíonn le fócas", fontSizing: "Méid cló", fontSizingDesc: "Méadaigh nó laghdaigh méid cló", adjustLineHeight: "Coigeartaigh airde líne", adjustLineHeightDesc: "Méadaigh nó laghdaigh airde líne", adjustLetterSpacing: "Coigeartaigh spásáil litreacha", adjustLetterSpacingDesc: "Méadaigh nó laghdaigh spásáil litreacha", contentScaling: "Scálú ábhair", contentScalingDesc: "Méadaigh nó laghdaigh méid ábhair", resetSettings: "Athshocraigh socruithe", statement: "Ráiteas", hideInterface: "Folaigh comhéadan", accessibilityFeatures: "Gnéithe inrochtaineachta" },

            rs: { title: "Подешавања приступачности", profilesTitle: "Изаберите одговарајући профил приступачности за вас", seizureSafe: "Сигуран профил за нападе", seizureSafeDesc: "Уклања трептање и смањује боје", visionImpaired: "Профил за особе са оштећењем вида", visionImpairedDesc: "Побољшава визуелне елементе веб странице", adhdFriendly: "Профил пријатељски за ADHD", adhdFriendlyDesc: "Смањује ометања и помаже у фокусирању", fontSizing: "Величина фонта", fontSizingDesc: "Повећај или смањи величину фонта", adjustLineHeight: "Прилагоди висину линије", adjustLineHeightDesc: "Повећај или смањи висину линије", adjustLetterSpacing: "Прилагоди размак између слова", adjustLetterSpacingDesc: "Повећај или смањи размак између слова", contentScaling: "Скалирање садржаја", contentScalingDesc: "Повећај или смањи величину садржаја", resetSettings: "Ресетуј подешавања", statement: "Изјава", hideInterface: "Сакриј интерфејс", accessibilityFeatures: "Функције приступачности" },

            al: { title: "Cilësimet e aksesueshmërisë", profilesTitle: "Zgjidhni profilin e duhur të aksesueshmërisë për ju", seizureSafe: "Profil i sigurt për sulmet", seizureSafeDesc: "Heq rrezatimet dhe zvogëlon ngjyrat", visionImpaired: "Profil për personat me probleme shikimi", visionImpairedDesc: "Përmirëson elementet vizuale të faqes së internetit", adhdFriendly: "Profil miqësor për ADHD", adhdFriendlyDesc: "Zvogëlon shpërqendrimet dhe ndihmon në fokusim", fontSizing: "Madhësia e shkronjave", fontSizingDesc: "Rrit ose zvogëlo madhësinë e shkronjave", adjustLineHeight: "Rregullo lartësinë e rreshtit", adjustLineHeightDesc: "Rrit ose zvogëlo lartësinë e rreshtit", adjustLetterSpacing: "Rregullo hapësirën midis shkronjave", adjustLetterSpacingDesc: "Rrit ose zvogëlo hapësirën midis shkronjave", contentScaling: "Shkalla e përmbajtjes", contentScalingDesc: "Rrit ose zvogëlo madhësinë e përmbajtjes", resetSettings: "Rivendos cilësimet", statement: "Deklarata", hideInterface: "Fshih ndërfaqen", accessibilityFeatures: "Funksionet e aksesueshmërisë" }

        };

    }



    togglePanel() {

        console.log('Accessibility Widget: Toggling panel...');

        const panel = this.shadowRoot.getElementById('accessibility-panel');

        

        if (panel) {

            console.log('Accessibility Widget: Panel found, current classes:', panel.className);

            console.log('Accessibility Widget: Panel has active class before toggle:', panel.classList.contains('active'));

            console.log('Accessibility Widget: Panel computed right position before toggle:', window.getComputedStyle(panel).right);

            

            if (panel.classList.contains('active')) {

                panel.classList.remove('active');

                console.log('Accessibility Widget: Panel closed');

            } else {

                panel.classList.add('active');

                console.log('Accessibility Widget: Panel opened');

            }

            

            console.log('Accessibility Widget: Panel has active class after toggle:', panel.classList.contains('active'));

            console.log('Accessibility Widget: Panel computed right position after toggle:', window.getComputedStyle(panel).right);

            

            // Force a repaint

            panel.offsetHeight;

        } else {

            console.error('Accessibility Widget: Panel not found!');

        }

    }



    showStatement() {

        const message = 'Accessibility Statement: This website is committed to providing an accessible experience for all users. We follow WCAG 2.1 guidelines and continuously work to improve accessibility.';

        alert(message);

    }

    

    

    

    

    updatePanelContent() {

        // Panel content is now static in English

        // No language translation needed

    }



    // Language functionality

    setupLanguageDropdownListeners() {

        console.log('Accessibility Widget: Setting up language dropdown listeners');

        // Language options

        const languageOptions = this.shadowRoot.querySelectorAll('.language-option');

        console.log('Accessibility Widget: Found language options:', languageOptions.length);

        

        languageOptions.forEach((option, index) => {

            console.log(`Accessibility Widget: Setting up listener for option ${index}:`, option.dataset.lang);

            option.addEventListener('click', (e) => {

                console.log('Accessibility Widget: Language option clicked:', e.currentTarget.dataset.lang);

                e.preventDefault();

                e.stopPropagation();

                const selectedLang = e.currentTarget.dataset.lang;

                const selectedFlag = e.currentTarget.dataset.flag;

                this.selectLanguage(selectedLang, selectedFlag);

            });

        });



        // Close dropdown when clicking outside

        document.addEventListener('click', (e) => {

            // Don't close if we're currently opening the dropdown

            if (this.isOpeningDropdown) {

                return;

            }

            

            const dropdown = this.shadowRoot.getElementById('language-dropdown');

            const header = this.shadowRoot.getElementById('language-selector-header');

            if (dropdown && header && !header.contains(e.target) && !dropdown.contains(e.target)) {

                console.log('Accessibility Widget: Clicking outside dropdown, hiding it');

                this.hideLanguageDropdown();

            }

        });

        console.log('Accessibility Widget: Language dropdown listeners set up');

    }



    toggleLanguageDropdown() {

        console.log('Accessibility Widget: toggleLanguageDropdown called');

        const dropdown = this.shadowRoot.getElementById('language-dropdown');

        console.log('Accessibility Widget: Dropdown found:', !!dropdown);

        if (dropdown) {

            const currentDisplay = dropdown.style.display;

            const computedDisplay = window.getComputedStyle(dropdown).display;

            console.log('Accessibility Widget: Current display:', currentDisplay, 'Computed display:', computedDisplay);

            

            if (dropdown.style.display === 'none' || dropdown.style.display === '' || window.getComputedStyle(dropdown).display === 'none') {

                console.log('Accessibility Widget: Showing dropdown');

                this.isOpeningDropdown = true;

                this.showLanguageDropdown();

                // Reset flag after a short delay

                setTimeout(() => {

                    this.isOpeningDropdown = false;

                }, 200);

            } else {

                console.log('Accessibility Widget: Hiding dropdown');

                this.hideLanguageDropdown();

            }

        } else {

            console.error('Accessibility Widget: Dropdown not found in toggleLanguageDropdown!');

        }

    }



    showLanguageDropdown() {

        console.log('Accessibility Widget: showLanguageDropdown called');

        const dropdown = this.shadowRoot.getElementById('language-dropdown');

        console.log('Accessibility Widget: Dropdown found for show:', !!dropdown);

        if (dropdown) {

            dropdown.style.display = 'block';

            dropdown.style.visibility = 'visible';

            dropdown.style.opacity = '1';

            dropdown.style.zIndex = '100001';

            

            console.log('Accessibility Widget: Dropdown should now be visible');

            console.log('Accessibility Widget: Dropdown children count:', dropdown.children.length);

            

            // Mark current language as selected
            setTimeout(() => {
            this.updateSelectedLanguage();
            }, 100);

            // Announce to screen reader

            this.announceToScreenReader('Language selection dropdown opened');

        } else {

            console.error('Accessibility Widget: Dropdown not found in showLanguageDropdown!');

        }

    }



    hideLanguageDropdown() {

        const dropdown = this.shadowRoot.getElementById('language-dropdown');

        if (dropdown) {

            dropdown.style.display = 'none';

            // Announce to screen reader

            this.announceToScreenReader('Language selection dropdown closed');

        }

    }



    updateSelectedLanguage() {
        console.log('🎯 [LANGUAGE SELECTION] updateSelectedLanguage() called');

        const currentLang = this.getCurrentLanguage();
        console.log('🎯 [LANGUAGE SELECTION] Current language:', currentLang);

        const languageOptions = this.shadowRoot.querySelectorAll('.language-option');
        console.log('🎯 [LANGUAGE SELECTION] Found language options:', languageOptions.length);

        // Normalize language value to a two-letter code used in data-lang
        const normalizeLang = (lang) => {
            if (!lang) return 'en';
            const lower = String(lang).toLowerCase();
            // Map common name variants to codes
            const map = {
                'english': 'en', 'en': 'en',
                'german': 'de', 'deutsch': 'de', 'de': 'de',
                'french': 'fr', 'français': 'fr', 'fr': 'fr',
                'spanish': 'es', 'español': 'es', 'es': 'es',
                'português': 'pt', 'portuguese': 'pt', 'pt': 'pt',
                'italian': 'it', 'italiano': 'it', 'it': 'it',
                'hebrew': 'he', 'il': 'he', 'he': 'he',
                'russian': 'ru', 'русский': 'ru', 'ru': 'ru',
                'chinese (traditional)': 'tw', '繁體中文': 'tw', 'tw': 'tw',
                'arabic': 'ae', 'ar': 'ae', 'ae': 'ae'
            };
            return map[lower] || (lower.length === 2 ? lower : 'en');
        };

        const normalizedCurrent = normalizeLang(currentLang);

        languageOptions.forEach(option => {
            // clear previous state
            option.classList.remove('selected');
            option.setAttribute('aria-selected', 'false');
            option.setAttribute('data-selected', 'false');
            // clear any inline fallback styles
            option.style.background = '';
            option.style.color = '';

            // apply selected state
            if (normalizeLang(option.dataset.lang) === normalizedCurrent) {
                console.log('🎯 [LANGUAGE SELECTION] Setting option as selected:', option.dataset.lang);
                option.classList.add('selected');
                option.setAttribute('aria-selected', 'true');
                option.setAttribute('data-selected', 'true');
                // Fallback inline styles to guarantee visibility over external CSS
                option.style.background = '#6366f1';
                option.style.color = '#ffffff';
                console.log('🎯 [LANGUAGE SELECTION] Option classes after setting:', option.className);
                console.log('🎯 [LANGUAGE SELECTION] Option aria-selected:', option.getAttribute('aria-selected'));
            } else {
                console.log('🎯 [LANGUAGE SELECTION] Option not selected:', option.dataset.lang);
            }
        });

        // Also reflect the selected state on the header for consistency
        const header = this.shadowRoot.getElementById('language-selector-header');
        if (header) {
            header.setAttribute('data-current-lang', normalizedCurrent);
        }
    }



    selectLanguage(langCode, flag) {
        console.log('🎯 [LANGUAGE SELECTION] selectLanguage() called with:', langCode);

        // Update current language display in header

        const currentLangSpan = this.shadowRoot.getElementById('current-language-header');

        if (currentLangSpan) {

            const languageNames = {

                'en': 'ENGLISH', 'es': 'ESPAÑOL', 'de': 'DEUTSCH', 'pt': 'PORTUGUÊS', 'fr': 'FRANÇAIS',

                'it': 'ITALIANO', 'he': 'עברית', 'tw': '繁體中文', 'ru': 'РУССКИЙ', 'ar': 'العربية',

                'ae': 'العربية', 'nl': 'NEDERLANDS', 'zh-cn': '简体中文', 'ja': '日本語', 'pl': 'POLSKI', 'tr': 'TÜRKÇE',

                'cz': 'ČEŠTINA', 'si': 'SLOVENŠČINA', 'no': 'NORSK BOKMÅL', 'fi': 'SUOMI', 'ro': 'ROMÂNĂ',

                'gr': 'ΕΛΛΗΝΙΚΆ', 'ba': 'BOSANSKI', 'lu': 'LËTZEBUERGESCH', 'dk': 'DANSK', 'hu': 'MAGYAR',

                'sk': 'SLOVENČINA', 'se': 'SVENSKA', 'ua': 'УКРАЇНСЬКА', 'ie': 'GAEILGE', 'rs': 'СРПСКИ',

                'hr': 'HRVATSKI', 'al': 'SHQIP', 'ps': 'العربية'

            };

            currentLangSpan.textContent = languageNames[langCode] || 'ENGLISH';

        }



        // Store selected language

        this.currentLanguage = langCode;

        localStorage.setItem('accessibility-widget-language', langCode);



        // Update panel content with new language - add delay to ensure DOM is ready

        setTimeout(() => {

        this.updatePanelLanguage(langCode);

        }, 100);



        // Update selected state in dropdown
        console.log('🎯 [LANGUAGE SELECTION] About to call updateSelectedLanguage()');
        this.updateSelectedLanguage();
        console.log('🎯 [LANGUAGE SELECTION] updateSelectedLanguage() completed');



        // Hide dropdown

        this.hideLanguageDropdown();



        // Announce language change

        this.announceToScreenReader(`Language changed to ${currentLangSpan.textContent}`);



    }



    updatePanelLanguage(langCode) {

        console.log('Accessibility Widget: Updating panel language to:', langCode);

        const translations = this.translations[langCode] || this.translations['en'];

        

        // If the language doesn't have complete translations, use English as fallback

        const hasCompleteTranslations = this.hasCompleteTranslations(langCode);

        if (!hasCompleteTranslations) {

            console.log('Accessibility Widget: Language', langCode, 'has incomplete translations, using English fallback');

        }

        

        // Update main panel title (h2)

        const panelTitle = this.shadowRoot.querySelector('h2');

        if (panelTitle) {

            panelTitle.textContent = translations.title;

            console.log('Accessibility Widget: Updated panel title to:', translations.title);

        }

        

        // Update white content section title (h3)

        const profilesTitle = this.shadowRoot.querySelector('.white-content-section h3');

        if (profilesTitle) {

            profilesTitle.textContent = translations.profilesTitle || "Choose the right accessibility profile for you";

        }

        

        // Update all profile items - use a more robust approach

        const featureIds = [

            'seizure-safe', 'vision-impaired', 'adhd-friendly', 'cognitive-disability',

            'keyboard-nav', 'screen-reader', 'content-scaling', 'readable-font',

            'highlight-titles', 'highlight-links', 'text-magnifier', 'font-sizing',

            'align-center', 'adjust-line-height', 'adjust-letter-spacing', 'align-left',

            'align-right', 'dark-contrast', 'light-contrast', 'high-contrast',

            'high-saturation', 'adjust-text-colors', 'monochrome', 'adjust-title-colors',

            'low-saturation', 'adjust-bg-colors', 'mute-sound', 'hide-images',

            'read-mode', 'reading-guide', 'useful-links', 'stop-animation',

            'reading-mask', 'highlight-hover', 'highlight-focus', 'big-black-cursor',

            'big-white-cursor'

        ];

        

        console.log('Accessibility Widget: Updating features directly by ID');

        

        featureIds.forEach(featureId => {

            const checkbox = this.shadowRoot.getElementById(featureId);

            if (!checkbox) {

                console.log(`Accessibility Widget: Checkbox not found for ${featureId}`);

                return;

            }

            

            const profileItem = checkbox.closest('.profile-item');

            if (!profileItem) {

                console.log(`Accessibility Widget: Profile item not found for ${featureId}`);

                return;

            }

            

            const title = profileItem.querySelector('h4');

            const desc = profileItem.querySelector('p:not(.profile-description p)');

            

            console.log(`Accessibility Widget: Updating feature ${featureId}:`, {

                hasTitle: !!title,

                hasDesc: !!desc,

                titleText: title ? title.textContent : 'N/A',

                descText: desc ? desc.textContent : 'N/A'

            });

            

            // Force update the elements even if they're not visible

            if (title || desc) {

                console.log(`Accessibility Widget: Found elements for ${featureId}, updating...`);

            }

            

            switch (featureId) {

                case 'seizure-safe':

                    if (title) title.textContent = this.getTranslation(langCode, 'seizureSafe', 'Seizure Safe Profile');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'seizureSafeDesc', 'Clear flashes & reduces color');

                    break;

                case 'vision-impaired':

                    if (title) title.textContent = this.getTranslation(langCode, 'visionImpaired', 'Vision Impaired Profile');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'visionImpairedDesc', 'Enhances website\'s visuals');

                    break;

                case 'adhd-friendly':

                    if (title) title.textContent = this.getTranslation(langCode, 'adhdFriendly', 'ADHD Friendly Profile');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'adhdFriendlyDesc', 'More focus & fewer distractions');

                    break;

                case 'cognitive-disability':

                    if (title) title.textContent = this.getTranslation(langCode, 'cognitiveDisability', 'Cognitive Disability Profile');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'cognitiveDisabilityDesc', 'Assists with reading & focusing');

                    break;

                case 'keyboard-nav':

                    if (title) title.textContent = this.getTranslation(langCode, 'keyboardNav', 'Keyboard Navigation (Motor)');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'keyboardNavDesc', 'Use website with the keyboard');

                    break;

                case 'screen-reader':

                    if (title) title.textContent = this.getTranslation(langCode, 'screenReader', 'Blind Users (Screen Reader)');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'screenReaderDesc', 'Optimize website for screen-readers');

                    break;

                case 'content-scaling':

                    if (title) title.textContent = this.getTranslation(langCode, 'contentScaling', 'Content Scaling');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'contentScalingDesc', 'Scale content with arrow controls');

                    break;

                case 'readable-font':

                    if (title) title.textContent = this.getTranslation(langCode, 'readableFont', 'Readable Font');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'readableFontDesc', 'High-legibility fonts');

                    break;

                case 'highlight-titles':

                    if (title) title.textContent = this.getTranslation(langCode, 'highlightTitles', 'Highlight Titles');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'highlightTitlesDesc', 'Add boxes around headings');

                    break;

                case 'highlight-links':

                    if (title) title.textContent = this.getTranslation(langCode, 'highlightLinks', 'Highlight Links');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'highlightLinksDesc', 'Add boxes around links');

                    break;

                case 'text-magnifier':

                    if (title) title.textContent = this.getTranslation(langCode, 'textMagnifier', 'Text Magnifier');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'textMagnifierDesc', 'Floating magnifying glass tool');

                    break;

                case 'font-sizing':

                    if (title) title.textContent = this.getTranslation(langCode, 'fontSizing', 'Adjust Font Sizing');

                    if (desc) desc.textContent = this.getTranslation(langCode, 'fontSizingDesc', 'Font size with arrow controls');

                    break;

                case 'align-center':

                    if (title) title.textContent = translations.alignCenter || 'Align Center';

                    if (desc) desc.textContent = translations.alignCenterDesc || 'Center-aligns all text content';

                    break;

                case 'adjust-line-height':

                    if (title) title.textContent = translations.adjustLineHeight || 'Adjust Line Height';

                    if (desc) desc.textContent = translations.adjustLineHeightDesc || 'Line height with arrow controls';

                    break;

                case 'adjust-letter-spacing':

                    if (title) title.textContent = translations.adjustLetterSpacing || 'Adjust Letter Spacing';

                    if (desc) desc.textContent = translations.adjustLetterSpacingDesc || 'Letter spacing with arrow controls';

                    break;

                case 'align-left':

                    if (title) title.textContent = translations.alignLeft || 'Align Left';

                    if (desc) desc.textContent = translations.alignLeftDesc || 'Left-aligns text content';

                    break;

                case 'align-right':

                    if (title) title.textContent = translations.alignRight || 'Align Right';

                    if (desc) desc.textContent = translations.alignRightDesc || 'Right-aligns text content';

                    break;

                case 'dark-contrast':

                    if (title) title.textContent = translations.darkContrast || 'Dark Contrast';

                    if (desc) desc.textContent = translations.darkContrastDesc || 'Dark background with light text';

                    break;

                case 'light-contrast':

                    if (title) title.textContent = translations.lightContrast || 'Light Contrast';

                    if (desc) desc.textContent = translations.lightContrastDesc || 'Light background with dark text';

                    break;

                case 'high-contrast':

                    if (title) title.textContent = translations.highContrast || 'High Contrast';

                    if (desc) desc.textContent = translations.highContrastDesc || 'Maximum contrast implementation';

                    break;

                case 'high-saturation':

                    if (title) title.textContent = translations.highSaturation || 'High Saturation';

                    if (desc) desc.textContent = translations.highSaturationDesc || 'Increases color intensity';

                    break;

                case 'adjust-text-colors':

                    if (title) title.textContent = translations.adjustTextColors || 'Adjust Text Colors';

                    if (desc) desc.textContent = translations.adjustTextColorsDesc || 'Color picker functionality';

                    break;

                case 'monochrome':

                    if (title) title.textContent = translations.monochrome || 'Monochrome';

                    if (desc) desc.textContent = translations.monochromeDesc || 'Removes all colors except black, white, grays';

                    break;

                case 'adjust-title-colors':

                    if (title) title.textContent = translations.adjustTitleColors || 'Adjust Title Colors';

                    if (desc) desc.textContent = translations.adjustTitleColorsDesc || 'Color customization for headings';

                    break;

                case 'low-saturation':

                    if (title) title.textContent = translations.lowSaturation || 'Low Saturation';

                    if (desc) desc.textContent = translations.lowSaturationDesc || 'Reduces color intensity';

                    break;

                case 'adjust-bg-colors':

                    if (title) title.textContent = translations.adjustBgColors || 'Adjust Background Colors';

                    if (desc) desc.textContent = translations.adjustBgColorsDesc || 'Background color customization';

                    break;

                case 'mute-sound':

                    if (title) title.textContent = translations.muteSound || 'Mute Sound';

                    if (desc) desc.textContent = translations.muteSoundDesc || 'Disables all audio content';

                    break;

                case 'hide-images':

                    if (title) title.textContent = translations.hideImages || 'Hide Images';

                    if (desc) desc.textContent = translations.hideImagesDesc || 'Toggle to hide all images';

                    break;

                case 'read-mode':

                    if (title) title.textContent = translations.readMode || 'Read Mode';

                    if (desc) desc.textContent = translations.readModeDesc || 'Removes navigation elements';

                    break;

                case 'reading-guide':

                    if (title) title.textContent = translations.readingGuide || 'Reading Guide';

                    if (desc) desc.textContent = translations.readingGuideDesc || 'Movable highlight bar';

                    break;

                case 'useful-links':

                    if (title) title.textContent = translations.usefulLinks || 'Useful Links';

                    if (desc) desc.textContent = translations.usefulLinksDesc || 'Accessibility resources and links';

                    break;

                case 'stop-animation':

                    if (title) title.textContent = translations.stopAnimation || 'Stop Animation';

                    if (desc) desc.textContent = translations.stopAnimationDesc || 'Pauses all CSS animations';

                    break;

                case 'reading-mask':

                    if (title) title.textContent = translations.readingMask || 'Reading Mask';

                    if (desc) desc.textContent = translations.readingMaskDesc || 'Semi-transparent overlay';

                    break;

                case 'highlight-hover':

                    if (title) title.textContent = translations.highlightHover || 'Highlight Hover';

                    if (desc) desc.textContent = translations.highlightHoverDesc || 'Visual feedback on hover';

                    break;

                case 'highlight-focus':

                    if (title) title.textContent = translations.highlightFocus || 'Highlight Focus';

                    if (desc) desc.textContent = translations.highlightFocusDesc || 'Prominent focus indicators';

                    break;

                case 'big-black-cursor':

                    if (title) title.textContent = translations.bigBlackCursor || 'Big Black Cursor';

                    if (desc) desc.textContent = translations.bigBlackCursorDesc || 'Increases cursor size';

                    break;

                case 'big-white-cursor':

                    if (title) title.textContent = translations.bigWhiteCursor || 'Big White Cursor';

                    if (desc) desc.textContent = translations.bigWhiteCursorDesc || 'Increases cursor size';

                    break;

            }

        });

        

        // Update button texts

        const resetBtn = this.shadowRoot.querySelector('#reset-settings');

        const statementBtn = this.shadowRoot.querySelector('#statement');

        const hideBtn = this.shadowRoot.querySelector('#hide-interface');

        

        if (resetBtn) {

            resetBtn.innerHTML = `<i class="fas fa-redo"></i> ${translations.resetSettings || 'Reset Settings'}`;

            console.log('Accessibility Widget: Updated reset button');

        }

        if (statementBtn) {

            statementBtn.innerHTML = `<i class="fas fa-file-alt"></i> ${translations.statement || 'Statement'}`;

            console.log('Accessibility Widget: Updated statement button');

        }

        if (hideBtn) {

            hideBtn.innerHTML = `<i class="fas fa-eye-slash"></i> ${translations.hideInterface || 'Hide Interface'}`;

            console.log('Accessibility Widget: Updated hide button');

        }

        

        // Also update all elements using a more comprehensive approach

        this.updateAllPanelElements(langCode);

        

        console.log('Accessibility Widget: Panel language updated successfully');

    }

    

    updateAllPanelElements(langCode) {

        console.log('Accessibility Widget: Updating all panel elements for language:', langCode);

        

        // Update all h4 elements (feature titles)

        const allTitles = this.shadowRoot.querySelectorAll('.profile-item h4');

        allTitles.forEach((title, index) => {

            const featureId = this.getFeatureIdFromElement(title);

            if (featureId) {

                const translation = this.getTranslation(langCode, featureId, title.textContent);

                if (translation) {

                    title.textContent = translation;

                    console.log(`Accessibility Widget: Updated title for ${featureId}:`, translation);

                }

            }

        });

        

        // Update all p elements (feature descriptions)

        const allDescriptions = this.shadowRoot.querySelectorAll('.profile-item p:not(.profile-description p)');

        allDescriptions.forEach((desc, index) => {

            const featureId = this.getFeatureIdFromElement(desc);

            if (featureId) {

                const translation = this.getTranslation(langCode, featureId + 'Desc', desc.textContent);

                if (translation) {

                    desc.textContent = translation;

                    console.log(`Accessibility Widget: Updated description for ${featureId}:`, translation);

                }

            }

        });

        

        // Also update any small elements with detailed descriptions

        const allSmallElements = this.shadowRoot.querySelectorAll('.profile-item small');

        allSmallElements.forEach((small, index) => {

            const featureId = this.getFeatureIdFromElement(small);

            if (featureId) {

                // Check for detailed description keys

                const detailedKey = featureId + 'Detailed';

                const noteKey = featureId + 'Note';

                const detailedTranslation = this.getTranslation(langCode, detailedKey, '');

                const noteTranslation = this.getTranslation(langCode, noteKey, '');

                

                if (detailedTranslation) {

                    small.textContent = detailedTranslation;

                    console.log(`Accessibility Widget: Updated detailed description for ${featureId}:`, detailedTranslation);

                } else if (noteTranslation) {

                    small.textContent = noteTranslation;

                    console.log(`Accessibility Widget: Updated note for ${featureId}:`, noteTranslation);

                }

            }

        });

        

        console.log('Accessibility Widget: All panel elements updated for language:', langCode);

    }

    

    getFeatureIdFromElement(element) {

        // Find the closest profile item and get its checkbox ID

        const profileItem = element.closest('.profile-item');

        if (profileItem) {

            const checkbox = profileItem.querySelector('input[type="checkbox"]');

            if (checkbox) {

                // Convert hyphenated ID to camelCase for translation keys

                const id = checkbox.id;

                return id.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());

            }

        }

        return null;

    }

    

    hasCompleteTranslations(langCode) {

        const translations = this.translations[langCode];

        if (!translations) return false;

        

        // Check if all essential features have translations

        const essentialFeatures = [

            'title', 'profilesTitle', 'seizureSafe', 'seizureSafeDesc',

            'visionImpaired', 'visionImpairedDesc', 'adhdFriendly', 'adhdFriendlyDesc',

            'cognitiveDisability', 'cognitiveDisabilityDesc', 'keyboardNav', 'keyboardNavDesc',

            'screenReader', 'screenReaderDesc', 'contentScaling', 'contentScalingDesc',

            'readableFont', 'readableFontDesc', 'highlightTitles', 'highlightTitlesDesc',

            'highlightLinks', 'highlightLinksDesc', 'textMagnifier', 'textMagnifierDesc',

            'fontSizing', 'fontSizingDesc', 'alignCenter', 'alignCenterDesc',

            'adjustLineHeight', 'adjustLineHeightDesc', 'adjustLetterSpacing', 'adjustLetterSpacingDesc',

            'alignLeft', 'alignLeftDesc', 'alignRight', 'alignRightDesc',

            'darkContrast', 'darkContrastDesc', 'lightContrast', 'lightContrastDesc',

            'highContrast', 'highContrastDesc', 'highSaturation', 'highSaturationDesc',

            'adjustTextColors', 'adjustTextColorsDesc', 'monochrome', 'monochromeDesc',

            'adjustTitleColors', 'adjustTitleColorsDesc', 'lowSaturation', 'lowSaturationDesc',

            'adjustBgColors', 'adjustBgColorsDesc', 'muteSound', 'muteSoundDesc',

            'hideImages', 'hideImagesDesc', 'readMode', 'readModeDesc',

            'readingGuide', 'readingGuideDesc', 'usefulLinks', 'usefulLinksDesc',

            'stopAnimation', 'stopAnimationDesc', 'readingMask', 'readingMaskDesc',

            'highlightHover', 'highlightHoverDesc', 'highlightFocus', 'highlightFocusDesc',

            'bigBlackCursor', 'bigBlackCursorDesc', 'bigWhiteCursor', 'bigWhiteCursorDesc',

            'resetSettings', 'statement', 'hideInterface', 'accessibilityFeatures',

            // Additional detailed descriptions

            'keyboardNavDetailed', 'keyboardNavNote', 'screenReaderDetailed', 'screenReaderNote',

            'activatesWithScreenReader', 'activatesWithKeyboardNav'

        ];

        

        // Check if at least 80% of essential features have translations

        const translatedFeatures = essentialFeatures.filter(feature => translations[feature]);

        return translatedFeatures.length >= (essentialFeatures.length * 0.8);

    }

    

    getTranslation(langCode, key, fallback = '') {

        // Get translation from current language, fallback to English, then to provided fallback

        const translations = this.translations[langCode] || this.translations['en'];

        return translations[key] || this.translations['en'][key] || fallback;

    }



    getCurrentLanguage() {
        const stored = localStorage.getItem('accessibility-widget-language');
        const current = this.currentLanguage || stored || 'en';
        console.log('🎯 [LANGUAGE SELECTION] getCurrentLanguage() - stored:', stored, 'current:', current);
        return current;
    }



    initializeLanguageDisplay() {

        // Add a small delay to ensure DOM elements are ready

        setTimeout(() => {

            const currentLangSpan = this.shadowRoot.getElementById('current-language-header');

            if (currentLangSpan) {

                const languageNames = {

                    'en': 'ENGLISH', 'es': 'ESPAÑOL', 'de': 'DEUTSCH', 'pt': 'PORTUGUÊS', 'fr': 'FRANÇAIS',

                    'it': 'ITALIANO', 'he': 'עברית', 'tw': '繁體中文', 'ru': 'РУССКИЙ', 'ar': 'العربية',

                    'ar-ae': 'العربية', 'nl': 'NEDERLANDS', 'zh-cn': '简体中文', 'ja': '日本語', 'pl': 'POLSKI', 'tr': 'TÜRKÇE',

                    'cz': 'ČEŠTINA', 'si': 'SLOVENŠČINA', 'no': 'NORSK BOKMÅL', 'fi': 'SUOMI', 'ro': 'ROMÂNĂ',

                    'gr': 'ΕΛΛΗΝΙΚΆ', 'ba': 'BOSANSKI', 'lu': 'LËTZEBUERGESCH', 'dk': 'DANSK', 'hu': 'MAGYAR',

                    'sk': 'SLOVENČINA', 'se': 'SVENSKA', 'ua': 'УКРАЇНСЬКА', 'ie': 'GAEILGE', 'rs': 'СРПСКИ',

                    'hr': 'HRVATSKI', 'al': 'SHQIP', 'ps': 'العربية'

                };

                

                const currentLang = this.getCurrentLanguage();

                currentLangSpan.textContent = languageNames[currentLang] || 'ENGLISH';

                

                console.log('Accessibility Widget: Language display initialized');

            }

        }, 100);

    }



    hideInterface() {

        console.log('[CK] hideInterface() called - showing modal instead of hiding immediately');
        
        // Show the confirmation modal instead of hiding immediately
        this.showHideInterfaceModal();
    }


    handleToggle(feature, enabled) {

        console.log(`Accessibility Widget: Handling toggle for ${feature}, enabled: ${enabled}`);

        

        this.settings[feature] = enabled;

        this.saveSettings();

        

        // Special handling for keyboard navigation and screen reader

        if (feature === 'keyboard-nav' || feature === 'screen-reader') {

            this.handleAccessibilityProfiles(feature, enabled);

        } else {

            this.applyFeature(feature, enabled);

            

            // Announce to screen reader for other features

            const featureNames = {

                'seizure-safe': 'Seizure safe mode',

                'vision-impaired': 'Vision impaired mode',

                'adhd-friendly': 'ADHD friendly mode',

                'cognitive-disability': 'Cognitive disability mode',

                'high-contrast': 'High contrast mode',

                'monochrome': 'Monochrome mode',

                'dark-contrast': 'Dark contrast mode',

                'light-contrast': 'Light contrast mode',

                'high-saturation': 'High saturation mode',

                'low-saturation': 'Low saturation mode'

            };

            

            const featureName = featureNames[feature] || feature;

            const status = enabled ? 'enabled' : 'disabled';

            this.announceToScreenReader(`${featureName} ${status}`);

        }

        

        // Update widget appearance to sync with global features

        this.updateWidgetAppearance();

    }



    handleAccessibilityProfiles(feature, enabled) {

        // Get the toggle elements from Shadow DOM

        const keyboardToggle = this.shadowRoot.getElementById('keyboard-nav');

        const screenReaderToggle = this.shadowRoot.getElementById('screen-reader');

        

        if (enabled) {

            // When either profile is enabled, enable both

            this.settings['keyboard-nav'] = true;

            this.settings['screen-reader'] = true;

            

            // Update both toggles to checked state

            if (keyboardToggle) keyboardToggle.checked = true;

            if (screenReaderToggle) screenReaderToggle.checked = true;

            

            // Apply both features

            this.applyFeature('keyboard-nav', true);

            this.applyFeature('screen-reader', true);

            

            // Initialize keyboard navigation shortcuts

            this.initKeyboardShortcuts();

            

            // Play activation sound

            this.playAccessibilitySound('activate');

            

            // Save updated settings

            this.saveSettings();

            

            console.log('Accessibility Widget: Both keyboard navigation and screen reader profiles activated');

        } else {

            // When either profile is disabled, disable both

            this.settings['keyboard-nav'] = false;

            this.settings['screen-reader'] = false;

            

            // Update both toggles to unchecked state

            if (keyboardToggle) keyboardToggle.checked = false;

            if (screenReaderToggle) screenReaderToggle.checked = false;

            

            // Remove both features

            this.applyFeature('keyboard-nav', false);

            this.applyFeature('screen-reader', false);

            

            // Remove keyboard shortcuts

            this.removeKeyboardShortcuts();

            

            // Play deactivation sound

            this.playAccessibilitySound('deactivate');

            

            // Save updated settings

            this.saveSettings();

            

            console.log('Accessibility Widget: Both keyboard navigation and screen reader profiles deactivated');

        }

    }





    removeKeyboardShortcuts() {

        if (this.keyboardShortcutHandler) {

            document.removeEventListener('keydown', this.keyboardShortcutHandler);

            this.keyboardShortcutHandler = null;

            console.log('Accessibility Widget: Keyboard shortcuts removed');
        }

        if (this.mouseHandler) {

            document.removeEventListener('mousedown', this.mouseHandler);

            document.removeEventListener('click', this.mouseHandler);

            this.mouseHandler = null;

            console.log('Accessibility Widget: Mouse detection removed');

        }

        

        // Remove all highlighted elements

        this.removeAllHighlights();

        

        // Reset element tracking

        this.currentElementIndex = {};

    }



    cycleThroughElements(selector, type) {

        // Remove previous highlights

        this.removeAllHighlights();

        

        // Get all matching elements

        const elements = Array.from(document.querySelectorAll(selector)).filter(element => 

            this.isElementVisible(element) && this.isElementFocusable(element)

        );

        

        if (elements.length === 0) {

            console.log(`Accessibility Widget: No ${type} elements found`);

            return;

        }

        

        // Initialize or increment index for this type

        if (!this.currentElementIndex[type]) {

            this.currentElementIndex[type] = 0;

        } else {

            this.currentElementIndex[type] = (this.currentElementIndex[type] + 1) % elements.length;

        }

        

        // Get current element

        const currentElement = elements[this.currentElementIndex[type]];

        

        // Highlight the current element

        this.highlightElement(currentElement, type);

        

        // Focus and scroll to element

        currentElement.focus();

        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        

        console.log(`Accessibility Widget: Highlighted ${type} ${this.currentElementIndex[type] + 1} of ${elements.length}`);

    }



    highlightElement(element, type) {

        // Create highlight box

        const highlight = document.createElement('div');

        highlight.className = 'keyboard-highlight';

        highlight.setAttribute('data-type', type);

        highlight.style.cssText = `

            position: absolute;

            border: 3px solid #6366f1;

            border-radius: 6px;

            background: transparent;

            pointer-events: none;

            z-index: 1000000;

            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);

            transition: all 0.3s ease;

        `;

        

        // Position the highlight

        const rect = element.getBoundingClientRect();

        highlight.style.top = (rect.top + window.scrollY - 3) + 'px';

        highlight.style.left = (rect.left + window.scrollX - 3) + 'px';

        highlight.style.width = (rect.width + 6) + 'px';

        highlight.style.height = (rect.height + 6) + 'px';

        

        // Add to document

        document.body.appendChild(highlight);

        this.highlightedElements.push(highlight);

        

        // Add label

        const label = document.createElement('div');

        label.className = 'keyboard-highlight-label';

        label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.currentElementIndex[type] + 1}`;

        label.style.cssText = `

            position: absolute;

            top: -30px;

            left: 0;

            background: #6366f1;

            color: white;

            padding: 4px 8px;

            border-radius: 4px;

            font-size: 12px;

            font-weight: bold;

            white-space: nowrap;

            z-index: 1000001;

        `;

        

        highlight.appendChild(label);

        

        // Auto-remove after 3 seconds

        setTimeout(() => {

            if (highlight.parentNode) {

                highlight.remove();

                this.highlightedElements = this.highlightedElements.filter(h => h !== highlight);

            }

        }, 3000);

    }





    focusElement(selector) {

        const elements = document.querySelectorAll(selector);

        if (elements.length > 0) {

            // Find the first visible and focusable element

            for (let element of elements) {

                if (this.isElementVisible(element) && this.isElementFocusable(element)) {

                    element.focus();

                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    

                    // Add temporary highlight

                    element.style.outline = '3px solid var(--primary-color)';

                    element.style.outlineOffset = '2px';

                    

                    setTimeout(() => {

                        element.style.outline = '';

                        element.style.outlineOffset = '';

                    }, 2000);

                    

                    console.log(`Accessibility Widget: Focused on ${selector}`);

                    return;

                }

            }

        }

        console.log(`Accessibility Widget: No focusable elements found for ${selector}`);

    }



    isElementVisible(element) {

        const style = window.getComputedStyle(element);

        return style.display !== 'none' && 

               style.visibility !== 'hidden' && 

               element.offsetWidth > 0 && 

               element.offsetHeight > 0;

    }



    isElementFocusable(element) {

        const tag = element.tagName.toLowerCase();

        const type = element.type;

        

        // Check if element is naturally focusable

        if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'textarea' || tag === 'select') {

            return true;

        }

        

        // Check if element has tabindex

        if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') {

            return true;

        }

        

        // Check if element has role that makes it focusable

        const role = element.getAttribute('role');

        if (role === 'button' || role === 'link' || role === 'menuitem' || role === 'tab') {

            return true;

        }

        

        return false;

    }



    playAccessibilitySound(type = 'activate') {

        try {

            // Create audio context for sound generation

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            const oscillator = audioContext.createOscillator();

            const gainNode = audioContext.createGain();

            

            // Connect nodes

            oscillator.connect(gainNode);

            gainNode.connect(audioContext.destination);

            

            // Configure sound based on type

            oscillator.type = 'sine';

            

            if (type === 'activate') {

                // Pleasant ascending sound for activation

                oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // 600Hz

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1); // Rise to 800Hz

                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2); // Rise to 1000Hz

            } else {

                // Pleasant descending sound for deactivation

                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // 1000Hz

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1); // Fall to 800Hz

                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2); // Fall to 600Hz

            }

            

            // Configure volume envelope

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);

            gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);

            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

            

            // Play the sound

            oscillator.start(audioContext.currentTime);

            oscillator.stop(audioContext.currentTime + 0.4);

            

            console.log(`Accessibility Widget: ${type} sound effect played`);

        } catch (error) {

            console.log('Accessibility Widget: Could not play sound effect', error);

        }

    }



    applyFeature(feature, enabled) {

        console.log(`Accessibility Widget: Applying feature ${feature}: ${enabled}`);

        

        const body = document.body;

        

        if (enabled) {

            body.classList.add(feature);

            

            // Special handling for specific features

            switch(feature) {

                case 'keyboard-nav':

                    this.initKeyboardShortcuts();

                    console.log('Accessibility Widget: Keyboard navigation enabled');

                    break;

                case 'text-magnifier':

                    this.initTextMagnifier(); // Initialize first

                    this.enableTextMagnifier();

                    break;

                case 'font-sizing':

                    // Check if font sizing was actually used before applying
                    const wasFontSizingUsed = localStorage.getItem('font-sizing-used') === 'true';
                    if (!wasFontSizingUsed && this.fontSize === 100) {
                        console.log('[CK] Font sizing was saved but never used, not applying');
                        // Don't apply the feature, just return
                        return;
                    }
                    this.toggleFontSizingControls(true);
                    break;

                case 'content-scaling':

                    // Check if content scaling was actually used before applying
                    const wasContentScalingUsed = localStorage.getItem('content-scaling-used') === 'true';
                    if (!wasContentScalingUsed && this.contentScale === 100) {
                        console.log('[CK] Content scaling was saved but never used, not applying');
                        // Don't apply the feature, just return
                        return;
                    }
                    this.toggleContentScalingControls(true);
                    break;

                case 'adjust-line-height':

                    // Check if line height was actually used before applying
                    const wasLineHeightUsed = localStorage.getItem('line-height-used') === 'true';
                    if (!wasLineHeightUsed && this.lineHeight === 100) {
                        console.log('[CK] Line height was saved but never used, not applying');
                        // Don't apply the feature, just return
                        return;
                    }
                    this.toggleLineHeightControls(true);
                    break;

                case 'adjust-letter-spacing':

                    // Check if letter spacing was actually used before applying
                    const wasLetterSpacingUsed = localStorage.getItem('letter-spacing-used') === 'true';
                    if (!wasLetterSpacingUsed && this.letterSpacing === 100) {
                        console.log('[CK] Letter spacing was saved but never used, not applying');
                        // Don't apply the feature, just return
                        return;
                    }
                    this.toggleLetterSpacingControls(true);
                    break;

                case 'highlight-titles':

                    this.highlightTitles();

                    break;

                case 'highlight-links':

                    this.highlightLinks();

                    break;

                case 'adjust-text-colors':

                    this.showTextColorPicker();

                    break;

                case 'adjust-title-colors':

                    this.showTitleColorPicker();

                    break;

                case 'adjust-bg-colors':

                    this.showBackgroundColorPicker();

                    break;

                case 'mute-sound':

                    this.enableMuteSound();

                    break;

                case 'hide-images':

                    this.enableHideImages();

                    break;

                case 'read-mode':

                    this.enableReadMode();

                    break;

                case 'reading-guide':

                    this.enableReadingGuide();

                    break;

                case 'reading-mask':

                    this.enableReadingMask();

                    break;

                case 'useful-links':

                    this.enableUsefulLinks();

                    break;

                case 'highlight-hover':

                    this.enableHighlightHover();

                    break;

                case 'highlight-focus':

                    this.enableHighlightFocus();

                    break;

                case 'adhd-friendly':

                    this.createADHDSpotlight();

                    break;

                case 'screen-reader':

                    this.enhanceScreenReaderSupport();

                    break;

                case 'high-contrast':

                    this.enableHighContrast();

                    break;

                case 'high-saturation':

                    this.enableHighSaturation();

                    break;

                case 'monochrome':

                    this.enableMonochrome();

                    break;

                case 'dark-contrast':

                    this.enableDarkContrast();

                    break;

                case 'light-contrast':

                    this.enableLightContrast();

                    break;

                case 'seizure-safe':

                    this.enableSeizureSafe();

                    break;

                case 'vision-impaired':

                    this.enableVisionImpaired();

                    break;

                case 'cognitive-disability':

                    this.enableCognitiveDisability();

                    break;

                case 'readable-font':

                    this.enableReadableFont();

                    break;

                case 'align-center':

                    this.enableAlignCenter();

                    break;

                case 'align-left':

                    this.enableAlignLeft();

                    break;

                case 'align-right':

                    this.enableAlignRight();

                    break;

                case 'big-black-cursor':

                    this.enableBigBlackCursor();

                    break;

                case 'big-white-cursor':

                    this.enableBigWhiteCursor();

                    break;

                case 'stop-animation':

                    this.enableStopAnimation();

                    break;

            }

        } else {

            body.classList.remove(feature);

            

            // Special handling for specific features

            switch(feature) {

                case 'keyboard-nav':

                    this.removeKeyboardShortcuts();

                    console.log('Accessibility Widget: Keyboard navigation disabled');

                    break;

                case 'text-magnifier':

                    this.disableTextMagnifier();

                    break;

                case 'font-sizing':

                    this.disableFontSizing();

                    this.hideFontSizingControls();

                    break;

                case 'content-scaling':

                    this.hideContentScalingControls();

                    this.resetContentScale();

                    break;

                case 'adjust-line-height':

                    this.hideLineHeightControls();

                    this.resetLineHeight();

                    break;

                case 'adjust-letter-spacing':

                    this.hideLetterSpacingControls();

                    this.resetLetterSpacing();

                    break;

                case 'highlight-titles':

                    this.removeTitleHighlights();

                    break;

                case 'highlight-links':

                    this.removeLinkHighlights();

                    break;

                case 'adhd-friendly':

                    this.removeADHDSpotlight();

                    break;

                case 'screen-reader':

                    this.removeScreenReaderEnhancements();

                    break;

                case 'high-contrast':

                    this.disableHighContrast();

                    break;

                case 'high-saturation':

                    this.disableHighSaturation();

                    break;

                case 'monochrome':

                    this.disableMonochrome();

                    break;

                case 'dark-contrast':

                    this.disableDarkContrast();

                    break;

                case 'light-contrast':

                    this.disableLightContrast();

                    break;

                case 'seizure-safe':

                    this.disableSeizureSafe();

                    break;

                case 'vision-impaired':

                    this.disableVisionImpaired();

                    break;

                case 'cognitive-disability':

                    this.disableCognitiveDisability();

                    break;

                case 'readable-font':

                    this.disableReadableFont();

                    break;

                case 'align-center':

                    this.disableAlignCenter();

                    break;

                case 'align-left':

                    this.disableAlignLeft();

                    break;

                case 'align-right':

                    this.disableAlignRight();

                    break;

                case 'big-black-cursor':

                    this.disableBigBlackCursor();

                    break;

                case 'big-white-cursor':

                    this.disableBigWhiteCursor();

                    break;

                case 'stop-animation':

                    this.disableStopAnimation();

                    break;

                case 'adjust-text-colors':

                    this.hideTextColorPicker();

                    this.resetTextColors();

                    break;

                case 'adjust-title-colors':

                    this.hideTitleColorPicker();

                    this.resetTitleColors();

                    break;

                case 'adjust-bg-colors':

                    this.hideBackgroundColorPicker();

                    this.resetBackgroundColors();

                    break;

                case 'mute-sound':

                    this.disableMuteSound();

                    break;

                case 'hide-images':

                    this.disableHideImages();

                    break;

                case 'read-mode':

                    this.disableReadMode();

                    break;

                case 'reading-guide':

                    this.disableReadingGuide();

                    break;

                case 'reading-mask':

                    this.disableReadingMask();

                    break;

                case 'useful-links':

                    this.disableUsefulLinks();

                    break;

                case 'highlight-hover':

                    this.disableHighlightHover();

                    break;

                case 'highlight-focus':

                    this.disableHighlightFocus();

                    break;

            }

        }

    }



    enhanceScreenReaderSupport() {

        // Add skip link if it doesn't exist

        if (!document.getElementById('skip-link')) {

            const skipLink = document.createElement('a');

            skipLink.id = 'skip-link';

            skipLink.href = '#main-content';

            skipLink.textContent = 'Skip to main content';

            skipLink.style.cssText = `

                position: absolute;

                top: -40px;

                left: 6px;

                background: var(--primary-color);

                color: white;

                padding: 8px;

                text-decoration: none;

                border-radius: 4px;

                z-index: 1000000;

                transition: top 0.3s;

            `;

            skipLink.addEventListener('focus', () => {

                skipLink.style.top = '6px';

            });

            skipLink.addEventListener('blur', () => {

                skipLink.style.top = '-40px';

            });

            document.body.insertBefore(skipLink, document.body.firstChild);

        }



        // Add ARIA landmarks if they don't exist

        this.addAriaLandmarks();

        

        // Enhance form labels and inputs

        this.enhanceFormAccessibility();

        

        // Add alt text to images without alt

        this.addAltTextToImages();

        

        console.log('Accessibility Widget: Screen reader support enhanced');

    }



    removeScreenReaderEnhancements() {

        // Remove skip link

        const skipLink = document.getElementById('skip-link');

        if (skipLink) {

            skipLink.remove();

        }

        

        // Remove added ARIA attributes

        this.removeAriaEnhancements();

        

        console.log('Accessibility Widget: Screen reader enhancements removed');

    }



    addAriaLandmarks() {

        // Add main landmark if it doesn't exist

        const mainContent = document.querySelector('main, [role="main"], #main, .main');

        if (mainContent && !mainContent.id) {

            mainContent.id = 'main-content';

        }

        

        // Add navigation landmarks

        const navs = document.querySelectorAll('nav');

        navs.forEach((nav, index) => {

            if (!nav.getAttribute('aria-label')) {

                nav.setAttribute('aria-label', `Navigation ${index + 1}`);

            }

        });

        

        // Add banner landmark

        const header = document.querySelector('header');

        if (header && !header.getAttribute('role')) {

            header.setAttribute('role', 'banner');

        }

        

        // Add contentinfo landmark

        const footer = document.querySelector('footer');

        if (footer && !footer.getAttribute('role')) {

            footer.setAttribute('role', 'contentinfo');

        }

    }



    removeAriaEnhancements() {

        // Remove added ARIA attributes (be careful not to remove existing ones)

        const skipLink = document.getElementById('skip-link');

        if (skipLink) {

            skipLink.remove();

        }

    }



    enhanceFormAccessibility() {

        // Add labels to inputs without labels

        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach((input, index) => {

            if (!input.id && !input.getAttribute('aria-label')) {

                const label = input.previousElementSibling;

                if (label && label.tagName === 'LABEL') {

                    input.id = `input-${index}`;

                    label.setAttribute('for', input.id);

                } else {

                    input.setAttribute('aria-label', `Input field ${index + 1}`);

                }

            }

        });

    }



    addAltTextToImages() {

        const images = document.querySelectorAll('img');

        images.forEach((img, index) => {

            if (!img.alt && !img.getAttribute('aria-label')) {

                img.setAttribute('alt', `Image ${index + 1}`);

            }

        });

    }







    initTextMagnifier() {

        // Remove existing magnifier if any

        const existingMagnifier = document.getElementById('text-magnifier');

        if (existingMagnifier) {

            existingMagnifier.remove();

        }

        

        const magnifier = document.createElement('div');

        magnifier.className = 'magnifier';

        magnifier.id = 'text-magnifier';

        magnifier.style.cssText = `

            position: fixed;

            display: none;

            z-index: 1000000;

            pointer-events: none;

            font-family: Arial, sans-serif;

        `;

        document.body.appendChild(magnifier);

        console.log('Accessibility Widget: Text magnifier initialized');

    }



    enableTextMagnifier() {

        // Initialize magnifier if not exists

        this.initTextMagnifier();

        

        const magnifier = document.getElementById('text-magnifier');

        if (!magnifier) {

            console.error('Accessibility Widget: Text magnifier not found');

            return;

        }

        

        // Add hover effects to ALL text elements and interactive elements - comprehensive coverage

        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, label, li, td, th, img, article, section, aside, main, blockquote, pre, code, em, strong, i, b, u, small, sub, sup, mark, del, ins, cite, abbr, acronym, address, time, data, output, progress, meter, details, summary, figcaption, caption, dt, dd, dl, ol, ul, input, textarea, select, option, optgroup, fieldset, legend, form, table, thead, tbody, tfoot, tr, video, audio, canvas, svg, nav, header, footer, main, section, article, aside, figure, figcaption, blockquote, q, cite, abbr, acronym, address, time, data, output, progress, meter, details, summary, .logo, .nav-logo, .nav-menu li, .navbar, .menu, .nav-item, .nav-link, .btn, .button, .link, .text, .content, .title, .subtitle, .caption, .description, .heading, .subheading, .paragraph, .list-item, .table-cell, .form-label, .form-input, .form-button, .card, .card-title, .card-content, .card-text, .hero, .hero-title, .hero-subtitle, .banner, .banner-text, .sidebar, .sidebar-content, .footer, .footer-content, .header, .header-content, .navigation, .navigation-item, .breadcrumb, .breadcrumb-item, .pagination, .pagination-item, .tab, .tab-content, .accordion, .accordion-content, .modal, .modal-content, .tooltip, .tooltip-content, .dropdown, .dropdown-item, .menu, .menu-item, .submenu, .submenu-item, .widget, .widget-content, .panel, .panel-content, .tile, .tile-content, .grid, .grid-item, .flex, .flex-item, .container, .container-content, .wrapper, .wrapper-content, .box, .box-content, .item, .item-content, .element, .element-content, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="option"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="listbox"], [role="tree"], [role="treeitem"], [role="grid"], [role="gridcell"], [role="columnheader"], [role="rowheader"], [role="row"], [role="cell"], [role="table"], [role="rowgroup"], [role="columnheader"], [role="rowheader"], [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], [role="form"], [role="region"], [role="alert"], [role="alertdialog"], [role="dialog"], [role="log"], [role="marquee"], [role="status"], [role="timer"], [role="tooltip"], [role="tabpanel"], [role="tablist"], [role="menubar"], [role="menu"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="separator"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="tabpanel"], [role="textbox"], [role="tree"], [role="treegrid"], [role="treeitem"], [data-testid], [data-test], [data-cy], [data-qa], [aria-label], [aria-labelledby], [title], [alt], *[class*="text"], *[class*="content"], *[class*="title"], *[class*="heading"], *[class*="label"], *[class*="button"], *[class*="link"], *[class*="item"], *[class*="card"], *[class*="panel"], *[class*="widget"], *[class*="tile"], *[class*="box"], *[class*="element"]');

        

        textElements.forEach(element => {

            // Skip accessibility widget elements (check both shadow DOM and regular DOM)

            if (element.closest('.accessibility-panel') || 

                element.closest('#accessibility-icon') ||

                element.closest('accessibility-widget') ||

                element.tagName === 'ACCESSIBILITY-WIDGET' ||

                element.id === 'accessibility-icon' ||

                element.id === 'accessibility-panel') {

                return;

            }

            

            // Create named event handlers that can be removed later

            const mouseEnterHandler = (e) => {

                // Show magnified text in semi-transparent black box

                if (magnifier) {

                    // Get the full text content, including nested elements

                    let fullText = '';

                    

                    // Handle different types of elements with comprehensive text extraction

                    if (element.tagName === 'IMG') {

                        // For images, use alt text, title, or aria-label

                        fullText = element.alt || element.title || element.getAttribute('aria-label') || 'Image';

                    } else if (element.hasAttribute('aria-label')) {

                        // For elements with aria-label (highest priority for accessibility)

                        fullText = element.getAttribute('aria-label');

                    } else if (element.hasAttribute('aria-labelledby')) {

                        // For elements with aria-labelledby, get text from referenced element

                        const labelledBy = element.getAttribute('aria-labelledby');

                        const labelElement = document.getElementById(labelledBy);

                        if (labelElement) {

                            fullText = labelElement.textContent || labelElement.innerText;

                        }

                    } else if (element.hasAttribute('title')) {

                        // For elements with title attribute

                        fullText = element.getAttribute('title');

                    } else if (element.hasAttribute('placeholder')) {

                        // For input elements with placeholder

                        fullText = element.getAttribute('placeholder');

                    } else if (element.hasAttribute('value') && (element.tagName === 'INPUT' || element.tagName === 'BUTTON')) {

                        // For input/button elements with value

                        fullText = element.getAttribute('value');

                    } else if (element.children.length > 0) {

                        // If element has children, get text from all child elements

                        // Use innerText for better formatting, fallback to textContent

                        fullText = element.innerText || element.textContent;

                    } else {

                        // If it's a simple text element

                        fullText = element.textContent || element.innerText;

                    }

                    

                    // Clean up the text (remove extra whitespace and normalize)

                    fullText = fullText ? fullText.replace(/\s+/g, ' ').trim() : '';

                    

                    // Show magnifier for any text content

                    if (!fullText) {

                        return;

                    }

                    

                    // Final fallback: try to get any visible text from the element

                    if (!fullText) {

                        const computedStyle = window.getComputedStyle(element);

                        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {

                            fullText = element.textContent || element.innerText;

                        }

                    }

                    

                    if (fullText) {

                        // Calculate position to keep popup within viewport

                        const viewportWidth = window.innerWidth;

                        const viewportHeight = window.innerHeight;

                        

                        // Set initial position

                        let left = e.clientX + 20;

                        let top = e.clientY - 50;

                        

                        // After setting content, we'll adjust position if needed

                        magnifier.style.left = left + 'px';

                        magnifier.style.top = top + 'px';

                        magnifier.style.fontSize = '24px'; // Increased font size

                        magnifier.style.fontWeight = 'bold';

                        magnifier.style.background = 'rgba(0, 0, 0, 0.8)';

                        magnifier.style.color = 'white';

                        magnifier.style.padding = '16px 20px'; // Increased padding

                        magnifier.style.borderRadius = '8px';

                        magnifier.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';

                        magnifier.style.zIndex = '1000000';

                        magnifier.style.width = 'auto'; // Auto width based on content

                        magnifier.style.maxWidth = '600px'; // Maximum width limit

                        magnifier.style.wordWrap = 'break-word';

                        magnifier.style.lineHeight = '1.4';

                        magnifier.style.whiteSpace = 'normal'; // Allow text to wrap naturally

                        magnifier.style.overflow = 'visible'; // No scroll, let it grow

                        magnifier.style.height = 'auto'; // Auto height based on content

                        magnifier.textContent = fullText; // Show complete text

                        magnifier.style.display = 'block';

                        

                        // Now adjust position based on actual popup size

                        setTimeout(() => {

                            const popupRect = magnifier.getBoundingClientRect();

                            const popupWidth = popupRect.width;

                            const popupHeight = popupRect.height;

                            

                            // Adjust left position if popup goes off right edge

                            if (left + popupWidth > viewportWidth) {

                                left = e.clientX - popupWidth - 20; // Show to the left of cursor

                                magnifier.style.left = left + 'px';

                            }

                            

                            // Adjust top position if popup goes off bottom

                            if (top + popupHeight > viewportHeight) {

                                top = viewportHeight - popupHeight - 10;

                                magnifier.style.top = top + 'px';

                            }

                        }, 10);

                        

                        // Check if popup goes off top edge

                        if (top < 10) {

                            top = e.clientY + 20; // Show below cursor if too close to top

                            magnifier.style.top = top + 'px';

                        }

                        console.log('Accessibility Widget: Showing full magnified text:', fullText);

                    }

                }

            };

            

            const mouseLeaveHandler = (e) => {

                // Hide magnifier

                if (magnifier) {

                    magnifier.style.display = 'none';

                }

            };

            

            // Store handlers for later removal

            this.textMagnifierHandlers.set(element, {

                mouseenter: mouseEnterHandler,

                mouseleave: mouseLeaveHandler

            });

            

            // Add event listeners

            element.addEventListener('mouseenter', mouseEnterHandler);

            element.addEventListener('mouseleave', mouseLeaveHandler);

        });

        

        console.log('Accessibility Widget: Text magnifier enabled with hover effects on', textElements.length, 'elements');

        

        // Add a global mouseover listener as a fallback to catch any elements that might have been missed

        const globalMouseOverHandler = (e) => {

            const target = e.target;

            

            // Skip if target is the magnifier itself or accessibility widget

            if (target.id === 'text-magnifier' || 

                target.closest('.accessibility-panel') || 

                target.closest('#accessibility-icon') ||

                target.closest('accessibility-widget') ||

                target.tagName === 'ACCESSIBILITY-WIDGET' ||

                target.id === 'accessibility-icon' ||

                target.id === 'accessibility-panel') {

                return;

            }

            

            // Check if this element already has a magnifier handler

            if (this.textMagnifierHandlers.has(target)) {

                return; // Already handled

            }

            

            // Only add magnifier to elements that have text content or are interactive

            const hasText = target.textContent && target.textContent.trim();

            const isInteractive = target.tagName === 'A' || target.tagName === 'BUTTON' || 

                                target.tagName === 'INPUT' || target.tagName === 'SELECT' || 

                                target.tagName === 'TEXTAREA' || target.hasAttribute('role') ||

                                target.hasAttribute('onclick') || target.hasAttribute('onmouseover');

            const hasAriaLabel = target.hasAttribute('aria-label') || target.hasAttribute('aria-labelledby');

            const hasTitle = target.hasAttribute('title');

            const hasAlt = target.tagName === 'IMG' && target.hasAttribute('alt');

            

            if (hasText || isInteractive || hasAriaLabel || hasTitle || hasAlt) {

                // Add magnifier to this element

                const mouseEnterHandler = (e) => {

                    if (magnifier) {

                        let fullText = '';

                        

                        // Use the same comprehensive text extraction logic

                        if (target.tagName === 'IMG') {

                            fullText = target.alt || target.title || target.getAttribute('aria-label') || 'Image';

                        } else if (target.hasAttribute('aria-label')) {

                            fullText = target.getAttribute('aria-label');

                        } else if (target.hasAttribute('aria-labelledby')) {

                            const labelledBy = target.getAttribute('aria-labelledby');

                            const labelElement = document.getElementById(labelledBy);

                            if (labelElement) {

                                fullText = labelElement.textContent || labelElement.innerText;

                            }

                        } else if (target.hasAttribute('title')) {

                            fullText = target.getAttribute('title');

                        } else if (target.hasAttribute('placeholder')) {

                            fullText = target.getAttribute('placeholder');

                        } else if (target.hasAttribute('value') && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) {

                            fullText = target.getAttribute('value');

                        } else {

                            fullText = target.innerText || target.textContent;

                        }

                        

                        fullText = fullText ? fullText.replace(/\s+/g, ' ').trim() : '';

                        

                        if (fullText) {

                            // Use the same positioning and styling logic

                            const viewportWidth = window.innerWidth;

                            const viewportHeight = window.innerHeight;

                            let left = e.clientX + 20;

                            let top = e.clientY - 50;

                            

                            magnifier.style.left = left + 'px';

                            magnifier.style.top = top + 'px';

                            magnifier.style.fontSize = '24px';

                            magnifier.style.fontWeight = 'bold';

                            magnifier.style.background = 'rgba(0, 0, 0, 0.8)';

                            magnifier.style.color = 'white';

                            magnifier.style.padding = '16px 20px';

                            magnifier.style.borderRadius = '8px';

                            magnifier.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';

                            magnifier.style.zIndex = '1000000';

                            magnifier.style.width = 'auto';

                            magnifier.style.maxWidth = '600px';

                            magnifier.style.wordWrap = 'break-word';

                            magnifier.style.lineHeight = '1.4';

                            magnifier.style.whiteSpace = 'normal';

                            magnifier.style.overflow = 'visible';

                            magnifier.style.height = 'auto';

                            magnifier.textContent = fullText;

                            magnifier.style.display = 'block';

                            

                            // Adjust position if needed

                            setTimeout(() => {

                                const popupRect = magnifier.getBoundingClientRect();

                                const popupWidth = popupRect.width;

                                const popupHeight = popupRect.height;

                                

                                if (left + popupWidth > viewportWidth) {

                                    left = e.clientX - popupWidth - 20;

                                    magnifier.style.left = left + 'px';

                                }

                                

                                if (top + popupHeight > viewportHeight) {

                                    top = viewportHeight - popupHeight - 10;

                                    magnifier.style.top = top + 'px';

                                }

                            }, 10);

                            

                            if (top < 10) {

                                top = e.clientY + 20;

                                magnifier.style.top = top + 'px';

                            }

                        }

                    }

                };

                

                const mouseLeaveHandler = (e) => {

                    if (magnifier) {

                        magnifier.style.display = 'none';

                    }

                };

                

                // Store handlers for later removal

                this.textMagnifierHandlers.set(target, {

                    mouseenter: mouseEnterHandler,

                    mouseleave: mouseLeaveHandler

                });

                

                // Add event listeners

                target.addEventListener('mouseenter', mouseEnterHandler);

                target.addEventListener('mouseleave', mouseLeaveHandler);

            }

        };

        

        // Add global mouseover listener

        document.addEventListener('mouseover', globalMouseOverHandler);

        

        // Store the global handler for cleanup

        this.globalMouseOverHandler = globalMouseOverHandler;

    }



    disableTextMagnifier() {

        console.log('Accessibility Widget: Disabling text magnifier...');

        

        const magnifier = document.getElementById('text-magnifier');

        if (magnifier) {

            magnifier.style.display = 'none';

        }

        

        // Check if accessibility widget is still visible

        const widgetContainer = document.getElementById('accessibility-widget-container');

        const widgetIcon = document.getElementById('accessibility-icon');

        console.log('Accessibility Widget: Widget container exists:', !!widgetContainer);

        console.log('Accessibility Widget: Widget icon exists:', !!widgetIcon);

        

        if (widgetContainer) {

            console.log('Accessibility Widget: Widget container display:', window.getComputedStyle(widgetContainer).display);

            console.log('Accessibility Widget: Widget container visibility:', window.getComputedStyle(widgetContainer).visibility);

        }

        

        // Remove hover effects from ALL text elements and interactive elements - comprehensive coverage

        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, label, li, td, th, img, article, section, aside, main, blockquote, pre, code, em, strong, i, b, u, small, sub, sup, mark, del, ins, cite, abbr, acronym, address, time, data, output, progress, meter, details, summary, figcaption, caption, dt, dd, dl, ol, ul, input, textarea, select, option, optgroup, fieldset, legend, form, table, thead, tbody, tfoot, tr, video, audio, canvas, svg, nav, header, footer, main, section, article, aside, figure, figcaption, blockquote, q, cite, abbr, acronym, address, time, data, output, progress, meter, details, summary, .logo, .nav-logo, .nav-menu li, .navbar, .menu, .nav-item, .nav-link, .btn, .button, .link, .text, .content, .title, .subtitle, .caption, .description, .heading, .subheading, .paragraph, .list-item, .table-cell, .form-label, .form-input, .form-button, .card, .card-title, .card-content, .card-text, .hero, .hero-title, .hero-subtitle, .banner, .banner-text, .sidebar, .sidebar-content, .footer, .footer-content, .header, .header-content, .navigation, .navigation-item, .breadcrumb, .breadcrumb-item, .pagination, .pagination-item, .tab, .tab-content, .accordion, .accordion-content, .modal, .modal-content, .tooltip, .tooltip-content, .dropdown, .dropdown-item, .menu, .menu-item, .submenu, .submenu-item, .widget, .widget-content, .panel, .panel-content, .tile, .tile-content, .grid, .grid-item, .flex, .flex-item, .container, .container-content, .wrapper, .wrapper-content, .box, .box-content, .item, .item-content, .element, .element-content, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="option"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="listbox"], [role="tree"], [role="treeitem"], [role="grid"], [role="gridcell"], [role="columnheader"], [role="rowheader"], [role="row"], [role="cell"], [role="table"], [role="rowgroup"], [role="columnheader"], [role="rowheader"], [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], [role="form"], [role="region"], [role="alert"], [role="alertdialog"], [role="dialog"], [role="log"], [role="marquee"], [role="status"], [role="timer"], [role="tooltip"], [role="tabpanel"], [role="tablist"], [role="menubar"], [role="menu"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="separator"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="tabpanel"], [role="textbox"], [role="tree"], [role="treegrid"], [role="treeitem"], [data-testid], [data-test], [data-cy], [data-qa], [aria-label], [aria-labelledby], [title], [alt], *[class*="text"], *[class*="content"], *[class*="title"], *[class*="heading"], *[class*="label"], *[class*="button"], *[class*="link"], *[class*="item"], *[class*="card"], *[class*="panel"], *[class*="widget"], *[class*="tile"], *[class*="box"], *[class*="element"]');

        

        textElements.forEach(element => {

            // Skip accessibility widget elements (check both shadow DOM and regular DOM)

            if (element.closest('.accessibility-panel') || 

                element.closest('#accessibility-icon') ||

                element.closest('accessibility-widget') ||

                element.tagName === 'ACCESSIBILITY-WIDGET' ||

                element.id === 'accessibility-icon' ||

                element.id === 'accessibility-panel') {

                return;

            }

            

            // Remove highlight effects

            element.style.background = '';

            element.style.border = '';

            element.style.borderRadius = '';

            element.style.padding = '';

            element.style.boxShadow = '';

            element.style.transform = '';

            element.style.transition = '';

            

            // Remove event listeners using stored handlers

            const handlers = this.textMagnifierHandlers.get(element);

            if (handlers) {

                element.removeEventListener('mouseenter', handlers.mouseenter);

                element.removeEventListener('mouseleave', handlers.mouseleave);

                this.textMagnifierHandlers.delete(element);

            }

        });

        

        // Remove global mouseover listener if it exists

        if (this.globalMouseOverHandler) {

            document.removeEventListener('mouseover', this.globalMouseOverHandler);

            this.globalMouseOverHandler = null;

        }

        

        // Check widget visibility again after cleanup

        if (widgetContainer) {

            console.log('Accessibility Widget: After cleanup - Widget container display:', window.getComputedStyle(widgetContainer).display);

            console.log('Accessibility Widget: After cleanup - Widget container visibility:', window.getComputedStyle(widgetContainer).visibility);

        }

        

        console.log('Accessibility Widget: Text magnifier disabled');

    }



    enableFontSizing() {

        // Use the inline controls instead of creating separate panel

        this.showFontSizingControls();

        console.log('Accessibility Widget: Font sizing enabled');

        

        // Test if controls exist

        const controls = this.shadowRoot.getElementById('font-sizing-controls');

        if (controls) {

            console.log('Accessibility Widget: Font sizing controls found');

        } else {

            console.error('Accessibility Widget: Font sizing controls not found');

        }

    }



    disableFontSizing() {

        // Reset font size to normal when disabling

        this.fontSize = 100;

        this.resetFontSize();

        

        // Hide the controls

        const controls = this.shadowRoot.getElementById('font-sizing-controls');

        if (controls) {

            controls.style.display = 'none';

        }

        

        console.log('Accessibility Widget: Font sizing disabled and reset to normal');

    }



    changeFontSize(factor) {

        const currentSize = parseFloat(getComputedStyle(document.body).fontSize);

        document.body.style.fontSize = (currentSize * factor) + 'px';

    }



    resetFontSize() {

        // Reset body font size

        document.body.style.fontSize = '';

        

        // Remove any inline font-size styles that were applied to individual elements

        const elements = document.querySelectorAll('*');

        let resetCount = 0;

        elements.forEach(element => {

            if (element.style.fontSize) {

                element.style.fontSize = '';

                resetCount++;

            }

        });

        

        // Clear stored original font sizes

        this.originalFontSizes.clear();

        

        // Reset the internal value

        this.fontSize = 100;

        this.settings['font-size'] = 100; // Save to settings

        

        // Force update the display

        this.updateFontSizeDisplay();

        this.saveSettings(); // Persist the reset

        

        console.log('Accessibility Widget: Font size reset to original website styling. Reset', resetCount, 'elements.');

        

        // Additional safety: ensure no font-size styles remain

        setTimeout(() => {

            const remainingElements = document.querySelectorAll('[style*="font-size"]');

            if (remainingElements.length > 0) {

                console.log('Accessibility Widget: Found remaining font-size styles, clearing them...');

                remainingElements.forEach(element => {

                    element.style.fontSize = '';

                });

            }

        }, 100);

    }





    // Content Scaling Methods

    increaseContentScale() {

        this.contentScale = Math.min(this.contentScale + 5, 200); // 5% increment

        this.settings['content-scale'] = this.contentScale; // Save to settings

        // Mark that content scaling was actually used
        localStorage.setItem('content-scaling-used', 'true');

        this.updateContentScale();

        this.updateContentScaleDisplay();

        this.saveSettings(); // Persist to localStorage

    }



    decreaseContentScale() {

        this.contentScale = Math.max(this.contentScale - 5, 50); // 5% decrement, minimum 50%

        this.settings['content-scale'] = this.contentScale; // Save to settings

        // Mark that content scaling was actually used
        localStorage.setItem('content-scaling-used', 'true');

        this.updateContentScale();

        this.updateContentScaleDisplay();

        this.saveSettings(); // Persist to localStorage

    }



    updateContentScale() {

        // If content scale is 100%, reset to normal and don't apply any scaling

        if (this.contentScale === 100) {

            console.log('Accessibility Widget: Content scale is 100%, resetting to normal');

            const body = document.body;

            const html = document.documentElement;

            

            // Reset all scaling styles

            body.style.transform = '';

            body.style.transformOrigin = '';

            body.style.width = '';

            body.style.height = '';

            body.style.position = '';

            body.style.left = '';

            body.style.top = '';

            

            html.style.overflow = '';

            html.style.maxWidth = '';

            html.style.maxHeight = '';

            

            // Reset accessibility widget container

            const widgetContainer = document.getElementById('accessibility-widget-container');

            if (widgetContainer) {

                widgetContainer.style.transform = '';

                widgetContainer.style.transformOrigin = '';

            }

            

            return;

        }

        

        const scale = this.contentScale / 100;

        

        // Apply scaling to the entire website body

        const body = document.body;

        const html = document.documentElement;

        

        // Skip accessibility widget container from scaling

        const widgetContainer = document.getElementById('accessibility-widget-container');

        if (widgetContainer) {

            widgetContainer.style.transform = 'scale(1)'; // Keep accessibility widget at normal size

            widgetContainer.style.transformOrigin = 'center center';

        }

        

        // Scale the entire body

        body.style.transform = `scale(${scale})`;

        body.style.transformOrigin = 'top left';

        body.style.width = `${100 / scale}%`;

        body.style.height = `${100 / scale}%`;

        

        // Allow scrolling but adjust viewport to accommodate scaling

        html.style.overflow = 'auto'; // Allow scrolling instead of hidden

        html.style.maxWidth = 'none'; // Remove width restriction

        html.style.maxHeight = 'none'; // Remove height restriction

        

        // Adjust body positioning to account for scaling

        body.style.position = 'relative';

        body.style.left = '0';

        body.style.top = '0';

        

        console.log('Accessibility Widget: Content scaled to', this.contentScale + '%');

    }



    updateContentScaleDisplay() {

        const display = this.shadowRoot.getElementById('content-scale-value');

        if (display) {

            display.textContent = this.contentScale + '%';

            console.log('Accessibility Widget: Updated content scale display to', this.contentScale + '%');

        } else {

            console.log('Accessibility Widget: Content scale display element not found');

        }

    }



    toggleContentScalingControls(enabled) {

        console.log('🎛️ [CONTENT SCALING] toggleContentScalingControls called with enabled:', enabled);

        const controls = this.shadowRoot.getElementById('content-scaling-controls');

        console.log('🎛️ [CONTENT SCALING] Controls element found:', !!controls);
        console.log('🎛️ [CONTENT SCALING] Shadow root exists:', !!this.shadowRoot);
        console.log('🎛️ [CONTENT SCALING] Controls element:', controls);

        if (controls) {

            controls.style.display = enabled ? 'block' : 'none';

            console.log('🎛️ [CONTENT SCALING] Controls display set to:', enabled ? 'block' : 'none');

            // Force the display with !important
            if (enabled) {
                controls.style.setProperty('display', 'block', 'important');
                console.log('🎛️ [CONTENT SCALING] Forced display: block with !important');
            } else {
                controls.style.setProperty('display', 'none', 'important');
                console.log('🎛️ [CONTENT SCALING] Forced display: none with !important');
            }

        }

        

        if (enabled) {
            // Check if content scaling was actually used (not just toggled on)
            const wasContentScalingUsed = localStorage.getItem('content-scaling-used') === 'true';
            
            if (!wasContentScalingUsed && this.contentScale === 100) {
                // If toggled on but never used, don't save the state and return
                console.log('[CK] Content scaling toggled on but never used, not saving state');
                return;
            }
        }

        // Save the toggle state

        this.settings['content-scaling'] = enabled;

        this.saveSettings();

        

        if (enabled) {

            // Always show the current percentage, even if it's 100%
            this.updateContentScaleDisplay();

            // Show the current percentage in the display
            const scaleDisplay = this.shadowRoot.getElementById('content-scale-display');
            if (scaleDisplay) {
                scaleDisplay.textContent = `${this.contentScale}%`;
            }
            
            // Only apply scaling if the current scale is not 100%
            if (this.contentScale !== 100) {
                this.updateContentScale();
            }
        } else {

                    // Reset content scale when disabled

        this.contentScale = 100;

            this.settings['content-scale'] = 100;

        this.updateContentScale();

            this.saveSettings();

        

        // Reset line height when disabled

        this.lineHeight = 100;

        this.resetLineHeight();

        }

    }



    toggleFontSizingControls(enabled) {

        console.log('🔤 [FONT SIZING] toggleFontSizingControls called with enabled:', enabled);

        const controls = this.shadowRoot.getElementById('font-sizing-controls');

        console.log('🔤 [FONT SIZING] Controls element found:', !!controls);
        console.log('🔤 [FONT SIZING] Shadow root exists:', !!this.shadowRoot);
        console.log('🔤 [FONT SIZING] Controls element:', controls);

        if (controls) {

            controls.style.display = enabled ? 'block' : 'none';

            console.log('🔤 [FONT SIZING] Controls display set to:', enabled ? 'block' : 'none');

            // Force the display with !important
            if (enabled) {
                controls.style.setProperty('display', 'block', 'important');
                console.log('🔤 [FONT SIZING] Forced display: block with !important');
            } else {
                controls.style.setProperty('display', 'none', 'important');
                console.log('🔤 [FONT SIZING] Forced display: none with !important');
            }

        }

        

        if (enabled) {
            // Check if font sizing was actually used (not just toggled on)
            const wasFontSizingUsed = localStorage.getItem('font-sizing-used') === 'true';
            
            if (!wasFontSizingUsed && this.fontSize === 100) {
                // If toggled on but never used, don't save the state and return
                console.log('[CK] Font sizing toggled on but never used, not saving state');
                return;
            }
        }

        // Save the toggle state

        this.settings['font-sizing'] = enabled;

        this.saveSettings();

        

        if (enabled) {

            console.log('Accessibility Widget: Font sizing enabled, current fontSize:', this.fontSize);

            // Always update display to show current percentage
            this.updateFontSizeDisplay();

            // Show the current percentage in the display
            const fontSizeDisplay = this.shadowRoot.getElementById('font-size-display');
            if (fontSizeDisplay) {
                fontSizeDisplay.textContent = `${this.fontSize}%`;
            }

            // Only process font sizes if font size is not 100%
            if (this.fontSize !== 100) {
                console.log('Accessibility Widget: Font size is not 100%, applying font size changes');
                // Store original font sizes when feature is enabled (only if not already stored)
                this.storeOriginalFontSizes();

                this.updateFontSizeEnhanced();

            } else {

                // If font size is 100%, ensure no font size processing happens

                console.log('Accessibility Widget: Font size is 100%, no font size processing');

                // Don't call storeOriginalFontSizes() or updateFontSizeEnhanced() at all

            }

        } else {

            // Reset font size when disabled

            this.fontSize = 100;

            this.settings['font-size'] = 100;

            this.resetFontSize();

            this.saveSettings();

        }

    }



    toggleLineHeightControls(enabled) {

        console.log('Accessibility Widget: toggleLineHeightControls called with enabled:', enabled);

        console.log('Accessibility Widget: this context in toggleLineHeightControls:', this);

        

        const controls = this.shadowRoot.getElementById('line-height-controls');

        console.log('Accessibility Widget: Line height controls found:', !!controls);
        console.log('Accessibility Widget: Shadow root exists:', !!this.shadowRoot);
        console.log('Accessibility Widget: Controls element:', controls);

        if (controls) {

            controls.style.display = enabled ? 'block' : 'none';

            console.log('Accessibility Widget: Controls display set to:', enabled ? 'block' : 'none');

            // Force the display with !important
            if (enabled) {
                controls.style.setProperty('display', 'block', 'important');
                console.log('📏 [LINE HEIGHT] Forced display: block with !important');
            } else {
                controls.style.setProperty('display', 'none', 'important');
                console.log('📏 [LINE HEIGHT] Forced display: none with !important');
            }

        }

        

        if (enabled) {
            console.log('📏 [TOGGLE CONTROLS] Enabling line height controls, binding events...');
            // Bind the line height events when controls are enabled
            this.bindLineHeightEvents();
            
            // Check if line height was actually used (not just toggled on)
            const wasLineHeightUsed = localStorage.getItem('line-height-used') === 'true';
            
            if (!wasLineHeightUsed && this.lineHeight === 100) {
                // If toggled on but never used, don't save the state and return
                console.log('[CK] Line height toggled on but never used, not saving state');
                return;
            }
        }

        // Save the toggle state

        this.settings['adjust-line-height'] = enabled;

        this.saveSettings();

        

        if (enabled) {

            // Show controls and restore current line height value
            this.updateLineHeightDisplay();
            
            // Show the current percentage in the display
            const lineHeightDisplay = this.shadowRoot.getElementById('line-height-display');
            if (lineHeightDisplay) {
                lineHeightDisplay.textContent = `${this.lineHeight}%`;
            }

            

            console.log('Accessibility Widget: About to call bindLineHeightEvents...');

            console.log('Accessibility Widget: this.bindLineHeightEvents exists:', typeof this.bindLineHeightEvents);

            

            // Bind events to the line height buttons when they become visible

            this.bindLineHeightEvents();
            this.bindLineHeightEventsDirect();
            
            // Test the functionality
            setTimeout(() => {
                this.testLineHeight();
            }, 1000);

            

            console.log('Accessibility Widget: Line height controls shown, value set to 100% (normal)');

        } else {

            // Reset line height when disabled

            this.lineHeight = 100;

            this.settings['line-height'] = 100;

            this.resetLineHeight();

            this.saveSettings();

            console.log('Accessibility Widget: Line height reset to original website styling');

        }

    }



    showLineHeightControls() {

        const controls = this.shadowRoot.getElementById('line-height-controls');

        if (controls) {

            controls.style.display = 'block';
            
            // Bind events when controls are shown
            this.bindLineHeightEvents();
            this.bindLineHeightEventsDirect();

        }

    }



    hideLineHeightControls() {

        const controls = this.shadowRoot.getElementById('line-height-controls');

        if (controls) {

            controls.style.display = 'none';

        }

    }



    bindLineHeightEvents() {

        console.log('Accessibility Widget: Binding line height events...');

        console.log('Accessibility Widget: this context in bindLineHeightEvents:', this);

        console.log('Accessibility Widget: this.shadowRoot exists:', !!this.shadowRoot);
        
        // Prevent duplicate event binding
        if (this.lineHeightEventsBound) {
            console.log('Accessibility Widget: Line height events already bound, skipping...');
            return;
        }

        

        // Wait a bit for the DOM to be ready

        setTimeout(() => {

            // Check if controls are visible first
            const controls = this.shadowRoot.getElementById('line-height-controls');
            console.log('Accessibility Widget: Line height controls element:', controls);
            console.log('Accessibility Widget: Controls display style:', controls ? controls.style.display : 'not found');
            
            if (!controls) {
                console.log('Accessibility Widget: Controls not found, retrying in 200ms...');
                setTimeout(() => this.bindLineHeightEvents(), 200);
                return;
            }
            
            // Force controls to be visible if they exist
            if (controls.style.display === 'none') {
                controls.style.display = 'block';
                console.log('Accessibility Widget: Forced controls to be visible');
            }

            // Line height control buttons - using Shadow DOM

            const decreaseLineHeightBtn = this.shadowRoot.getElementById('decrease-line-height-btn');

            console.log('Accessibility Widget: Decrease line height button found:', !!decreaseLineHeightBtn);
            console.log('Accessibility Widget: Shadow root exists:', !!this.shadowRoot);
            console.log('Accessibility Widget: All buttons in shadow root:', this.shadowRoot.querySelectorAll('button'));

            if (decreaseLineHeightBtn) {

                console.log('Accessibility Widget: Decrease button HTML:', decreaseLineHeightBtn.outerHTML);

                

                // Create a bound handler

                this.decreaseLineHeightHandler = (e) => {

                    e.preventDefault();

                    e.stopPropagation();

                    console.log('Accessibility Widget: DECREASE line height button clicked');

                    console.log('Accessibility Widget: Button ID:', e.target.id);

                    console.log('Accessibility Widget: Button text:', e.target.textContent);

                    console.log('Accessibility Widget: Current lineHeight before decrease:', this.lineHeight);

                    console.log('Accessibility Widget: this context in click handler:', this);

                    console.log('Accessibility Widget: this.decreaseLineHeight exists:', typeof this.decreaseLineHeight);

                    this.decreaseLineHeight();

                };

                

                // Add event listener

                decreaseLineHeightBtn.addEventListener('click', this.decreaseLineHeightHandler);

                console.log('Accessibility Widget: Decrease line height event listener attached');

            } else {

                console.error('Accessibility Widget: Decrease line height button NOT found!');

            }



            const increaseLineHeightBtn = this.shadowRoot.getElementById('increase-line-height-btn');

            console.log('Accessibility Widget: Increase line height button found:', !!increaseLineHeightBtn);
            console.log('Accessibility Widget: Increase button element:', increaseLineHeightBtn);

            if (increaseLineHeightBtn) {

                console.log('Accessibility Widget: Increase button HTML:', increaseLineHeightBtn.outerHTML);

                

                // Create a bound handler

                this.increaseLineHeightHandler = (e) => {

                    e.preventDefault();

                    e.stopPropagation();

                    console.log('Accessibility Widget: INCREASE line height button clicked');

                    console.log('Accessibility Widget: Button ID:', e.target.id);

                    console.log('Accessibility Widget: Button text:', e.target.textContent);

                    console.log('Accessibility Widget: Current lineHeight before increase:', this.lineHeight);

                    console.log('Accessibility Widget: this context in click handler:', this);

                    console.log('Accessibility Widget: this.increaseLineHeight exists:', typeof this.increaseLineHeight);

                    this.increaseLineHeight();

                };

                

                // Add event listener

                increaseLineHeightBtn.addEventListener('click', this.increaseLineHeightHandler);

                console.log('Accessibility Widget: Increase line height event listener attached');

            } else {

                console.error('Accessibility Widget: Increase line height button NOT found!');

            }
            
            // Mark events as bound
            this.lineHeightEventsBound = true;

        }, 500); // Increased delay to ensure DOM is ready and controls are visible

    }
    
    // Alternative method to bind line height events directly
    bindLineHeightEventsDirect() {
        console.log('Accessibility Widget: Binding line height events directly...');
        console.log('Accessibility Widget: Shadow root exists:', !!this.shadowRoot);
        
        const decreaseBtn = this.shadowRoot.getElementById('decrease-line-height-btn');
        const increaseBtn = this.shadowRoot.getElementById('increase-line-height-btn');
        
        console.log('Accessibility Widget: Decrease button found:', !!decreaseBtn);
        console.log('Accessibility Widget: Increase button found:', !!increaseBtn);
        
        if (decreaseBtn) {
            console.log('Accessibility Widget: Decrease button HTML:', decreaseBtn.outerHTML);
            decreaseBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📏 [BUTTON CLICK] Decrease button clicked directly');
                console.log('📏 [BUTTON CLICK] Current lineHeight before decrease:', this.lineHeight);
                console.log('📏 [BUTTON CLICK] Calling decreaseLineHeight()...');
                this.decreaseLineHeight();
            };
            console.log('Accessibility Widget: Direct decrease button handler attached');
        } else {
            console.error('Accessibility Widget: Decrease button NOT found in direct binding!');
        }
        
        if (increaseBtn) {
            console.log('Accessibility Widget: Increase button HTML:', increaseBtn.outerHTML);
            increaseBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📏 [BUTTON CLICK] Increase button clicked directly');
                console.log('📏 [BUTTON CLICK] Current lineHeight before increase:', this.lineHeight);
                console.log('📏 [BUTTON CLICK] Calling increaseLineHeight()...');
                this.increaseLineHeight();
            };
            console.log('Accessibility Widget: Direct increase button handler attached');
        } else {
            console.error('Accessibility Widget: Increase button NOT found in direct binding!');
        }
    }
    
    // Test method to verify line height functionality
    testLineHeight() {
        console.log('Accessibility Widget: Testing line height functionality...');
        console.log('Accessibility Widget: Current lineHeight:', this.lineHeight);
        console.log('Accessibility Widget: Shadow root exists:', !!this.shadowRoot);
        
        const decreaseBtn = this.shadowRoot.getElementById('decrease-line-height-btn');
        const increaseBtn = this.shadowRoot.getElementById('increase-line-height-btn');
        const controls = this.shadowRoot.getElementById('line-height-controls');
        
        console.log('Accessibility Widget: Controls found:', !!controls);
        console.log('Accessibility Widget: Controls display:', controls ? controls.style.display : 'not found');
        console.log('Accessibility Widget: Decrease button found:', !!decreaseBtn);
        console.log('Accessibility Widget: Increase button found:', !!increaseBtn);
        
        if (controls) {
            controls.style.display = 'block';
            console.log('Accessibility Widget: Forced controls to be visible');
        }
        
        // Test the methods directly
        console.log('Accessibility Widget: Testing increaseLineHeight method...');
        this.increaseLineHeight();
        
        console.log('Accessibility Widget: Testing decreaseLineHeight method...');
        this.decreaseLineHeight();
        
        // Test clicking the buttons programmatically
        if (increaseBtn) {
            console.log('Accessibility Widget: Testing programmatic click on increase button...');
            increaseBtn.click();
        }
        
        if (decreaseBtn) {
            console.log('Accessibility Widget: Testing programmatic click on decrease button...');
            decreaseBtn.click();
        }
    }



    // Line Height Methods

    updateLineHeight() {

        console.log('📏 [UPDATE LINE HEIGHT] Starting updateLineHeight()');
        console.log('📏 [UPDATE LINE HEIGHT] Current lineHeight:', this.lineHeight);

        // Store original line-height if not already stored

        if (this.originalLineHeight === null) {

            const computedStyle = window.getComputedStyle(document.body);

            this.originalLineHeight = parseFloat(computedStyle.lineHeight);

            console.log('📏 [UPDATE LINE HEIGHT] Stored original line-height:', this.originalLineHeight);

        }

        

        // Use a much simpler approach - map percentages directly to reasonable line-height values

        let lineHeightValue;

        if (this.lineHeight <= 100) {

            // For 50-100%, map to 1.0 to 1.6 (expanded range)

            lineHeightValue = 1.0 + (this.lineHeight - 50) * 0.012; // 50% = 1.0, 100% = 1.6

        } else {

            // For 100-200%, map to 1.6 to 2.4 (expanded range)

            lineHeightValue = 1.6 + (this.lineHeight - 100) * 0.008; // 100% = 1.6, 200% = 2.4

        }

        

        console.log('Accessibility Widget: updateLineHeight - lineHeight:', this.lineHeight + '%, original:', this.originalLineHeight + ', lineHeightValue:', lineHeightValue);

        console.log('Accessibility Widget: Calculation details - this.lineHeight:', this.lineHeight, '<= 100?', this.lineHeight <= 100);

        if (this.lineHeight <= 100) {

            console.log('Accessibility Widget: Using formula: 1.0 + (' + this.lineHeight + ' - 50) * 0.012 =', 1.0 + (this.lineHeight - 50) * 0.012);

        } else {

            console.log('Accessibility Widget: Using formula: 1.6 + (' + this.lineHeight + ' - 100) * 0.008 =', 1.6 + (this.lineHeight - 100) * 0.008);

        }

        

        // Add CSS rules for line height if not already added
        if (!document.getElementById('line-height-css')) {
            const style = document.createElement('style');
            style.id = 'line-height-css';
            document.head.appendChild(style);
        }

        // Update the CSS with the new line height value
        const existingStyle = document.getElementById('line-height-css');
        if (existingStyle) {
            existingStyle.textContent = `
                body, html {
                    line-height: ${lineHeightValue} !important;
                }
                
                body *, html * {
                    line-height: ${lineHeightValue} !important;
                }
                
                p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer, main {
                    line-height: ${lineHeightValue} !important;
                }
            `;
        }

        console.log('📏 [UPDATE LINE HEIGHT] Applied lineHeight via CSS injection:', lineHeightValue);
        console.log('📏 [UPDATE LINE HEIGHT] CSS element found:', !!existingStyle);
        console.log('📏 [UPDATE LINE HEIGHT] CSS content length:', existingStyle ? existingStyle.textContent.length : 0);

        console.log('📏 [UPDATE LINE HEIGHT] Line height updated to', this.lineHeight + '% (value:', lineHeightValue + ') - COMPLETED');

    }



    increaseLineHeight() {

        console.log('📏 [LINE HEIGHT] increaseLineHeight called - Current lineHeight:', this.lineHeight);
        console.log('📏 [LINE HEIGHT] Settings before increase:', this.settings);

        const oldLineHeight = this.lineHeight;

        this.lineHeight = Math.min(this.lineHeight + 10, 200); // Expanded range to 200%

        this.settings['line-height'] = this.lineHeight; // Save to settings

        // Mark line height feature as used
        localStorage.setItem('line-height-used', 'true');

        console.log('📏 [LINE HEIGHT] Line height changed from', oldLineHeight + '% to', this.lineHeight + '%');

        console.log('📏 [LINE HEIGHT] Calling updateLineHeight()...');
        this.updateLineHeight();

        console.log('📏 [LINE HEIGHT] Calling updateLineHeightDisplay()...');
        this.updateLineHeightDisplay();

        console.log('📏 [LINE HEIGHT] Saving settings...');
        this.saveSettings(); // Persist to localStorage

        console.log('📏 [LINE HEIGHT] Line height increased to', this.lineHeight + '% - COMPLETED');

    }



    decreaseLineHeight() {

        console.log('📏 [LINE HEIGHT] decreaseLineHeight called - Current lineHeight:', this.lineHeight);
        console.log('📏 [LINE HEIGHT] Settings before decrease:', this.settings);

        const oldLineHeight = this.lineHeight;

        this.lineHeight = Math.max(this.lineHeight - 10, 50); // Expanded range to 50%

        this.settings['line-height'] = this.lineHeight; // Save to settings

        console.log('📏 [LINE HEIGHT] Line height changed from', oldLineHeight + '% to', this.lineHeight + '%');

        console.log('📏 [LINE HEIGHT] Calling updateLineHeight()...');
        this.updateLineHeight();

        console.log('📏 [LINE HEIGHT] Calling updateLineHeightDisplay()...');
        this.updateLineHeightDisplay();

        console.log('📏 [LINE HEIGHT] Saving settings...');
        this.saveSettings(); // Persist to localStorage

        console.log('📏 [LINE HEIGHT] Line height decreased to', this.lineHeight + '% - COMPLETED');

    }



    updateLineHeightDisplay() {

        console.log('📏 [UPDATE DISPLAY] updateLineHeightDisplay called, lineHeight:', this.lineHeight);
        console.log('📏 [UPDATE DISPLAY] shadowRoot exists:', !!this.shadowRoot);

        const display = this.shadowRoot.getElementById('line-height-value');
        console.log('📏 [UPDATE DISPLAY] line-height-value element found:', !!display);

        if (display) {
            console.log('📏 [UPDATE DISPLAY] Previous display value:', display.textContent);
            display.textContent = this.lineHeight + '%';
            console.log('📏 [UPDATE DISPLAY] Updated line height display to', this.lineHeight + '%');
            console.log('📏 [UPDATE DISPLAY] Current display value after update:', display.textContent);

        } else {

            console.log('Accessibility Widget: Line height display element not found');

            // Try to find it in the main document as fallback

            const fallbackDisplay = document.getElementById('line-height-value');

            if (fallbackDisplay) {

                fallbackDisplay.textContent = this.lineHeight + '%';

                console.log('Accessibility Widget: Updated line height display via fallback to', this.lineHeight + '%');

            } else {

                console.log('Accessibility Widget: Line height display element not found in main document either');

            }

        }

    }



    resetLineHeight() {

        console.log('Accessibility Widget: Starting line height reset...');
        
        // Remove CSS rules for line height
        const existingStyle = document.getElementById('line-height-css');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Reset line height back to original website styling
        document.body.style.removeProperty('line-height');
        document.documentElement.style.removeProperty('line-height');

        

        // Remove any inline line-height styles that might have been added

        const elements = document.querySelectorAll('*');

        let resetCount = 0;

        elements.forEach(element => {

            if (element.style.lineHeight) {

                element.style.lineHeight = '';

                resetCount++;

            }

        });

        

        // Reset the internal value

        this.lineHeight = 100;

        this.settings['line-height'] = 100; // Save to settings

        

        // Force update the display

        this.updateLineHeightDisplay();

        this.saveSettings(); // Persist the reset

        

        console.log('Accessibility Widget: Line height reset to original website styling. Reset', resetCount, 'elements.');

        

    }



    toggleLetterSpacingControls(enabled) {

        console.log('Accessibility Widget: toggleLetterSpacingControls called with enabled:', enabled);

        const controls = this.shadowRoot.getElementById('letter-spacing-controls');
        console.log('Accessibility Widget: Letter spacing controls found:', !!controls);
        console.log('Accessibility Widget: Shadow root exists:', !!this.shadowRoot);
        console.log('Accessibility Widget: Controls element:', controls);

        if (controls) {

            controls.style.display = enabled ? 'block' : 'none';

            console.log('Accessibility Widget: Letter spacing controls display set to:', enabled ? 'block' : 'none');

            // Force the display with !important
            if (enabled) {
                controls.style.setProperty('display', 'block', 'important');
                console.log('📝 [LETTER SPACING] Forced display: block with !important');
            } else {
                controls.style.setProperty('display', 'none', 'important');
                console.log('📝 [LETTER SPACING] Forced display: none with !important');
            }

        }

        

        if (enabled) {
            // Check if letter spacing was actually used (not just toggled on)
            const wasLetterSpacingUsed = localStorage.getItem('letter-spacing-used') === 'true';
            
            if (!wasLetterSpacingUsed && this.letterSpacing === 100) {
                // If toggled on but never used, don't save the state and return
                console.log('[CK] Letter spacing toggled on but never used, not saving state');
                return;
            }
        }

        // Save the toggle state

        this.settings['adjust-letter-spacing'] = enabled;

        this.saveSettings();

        

        if (enabled) {

            console.log('Accessibility Widget: Letter spacing toggle enabled - showing controls');

            this.updateLetterSpacingDisplay();

        } else {

            console.log('Accessibility Widget: Letter spacing toggle disabled - resetting letter spacing');

            // Reset letter spacing when disabled

            this.letterSpacing = 100;

            this.settings['letter-spacing'] = 100;

            this.resetLetterSpacing();

            this.saveSettings();

        }

    }













    increaseFontSize() {

        console.log('Accessibility Widget: increaseFontSize called');

        this.fontSize = Math.min(this.fontSize + 10, 200);

        this.settings['font-size'] = this.fontSize; // Save to settings

        // Mark that font sizing was actually used
        localStorage.setItem('font-sizing-used', 'true');

        this.updateFontSizeEnhanced();

        this.updateFontSizeDisplay();

        this.saveSettings(); // Persist to localStorage

        console.log('Accessibility Widget: Font size increased to', this.fontSize + '%');

    }



    decreaseFontSize() {

        console.log('Accessibility Widget: decreaseFontSize called');

        this.fontSize = Math.max(this.fontSize - 10, 50);

        this.settings['font-size'] = this.fontSize; // Save to settings

        // Mark that font sizing was actually used
        localStorage.setItem('font-sizing-used', 'true');

        this.updateFontSizeEnhanced();

        this.updateFontSizeDisplay();

        this.saveSettings(); // Persist to localStorage

        console.log('Accessibility Widget: Font size decreased to', this.fontSize + '%');

    }



    updateFontSizeDisplay() {

        console.log('Accessibility Widget: updateFontSizeDisplay called, fontSize:', this.fontSize);

        console.log('Accessibility Widget: shadowRoot exists:', !!this.shadowRoot);

        

        const display = this.shadowRoot.getElementById('font-size-value');

        console.log('Accessibility Widget: font-size-value element found:', !!display);

        

        if (display) {

            display.textContent = this.fontSize + '%';

            console.log('Accessibility Widget: Updated font size display to', this.fontSize + '%');

        } else {

            console.log('Accessibility Widget: Font size display element not found');

            // Try to find it in the main document as fallback

            const fallbackDisplay = document.getElementById('font-size-value');

            if (fallbackDisplay) {

                fallbackDisplay.textContent = this.fontSize + '%';

                console.log('Accessibility Widget: Updated font size display via fallback to', this.fontSize + '%');

            } else {

                console.log('Accessibility Widget: Font size display element not found in main document either');

            }

        }

    }



    // Letter Spacing Methods

    increaseLetterSpacing() {

        console.log('Accessibility Widget: increaseLetterSpacing called');

        this.letterSpacing = Math.min(this.letterSpacing + 10, 200);

        this.settings['letter-spacing'] = this.letterSpacing; // Save to settings

        this.updateLetterSpacing();

        this.updateLetterSpacingDisplay();

        this.saveSettings(); // Persist to localStorage

        console.log('Accessibility Widget: Letter spacing increased to', this.letterSpacing + '%');

    }



    decreaseLetterSpacing() {

        console.log('Accessibility Widget: decreaseLetterSpacing called');

        this.letterSpacing = Math.max(this.letterSpacing - 10, 50);

        this.settings['letter-spacing'] = this.letterSpacing; // Save to settings

        this.updateLetterSpacing();

        this.updateLetterSpacingDisplay();

        this.saveSettings(); // Persist to localStorage

        console.log('Accessibility Widget: Letter spacing decreased to', this.letterSpacing + '%');

    }



    updateLetterSpacing() {

        console.log('*** DEBUGGING: updateLetterSpacing called ***');

        console.log('*** Current letterSpacing value:', this.letterSpacing + '% ***');

        console.trace('*** Call stack trace ***');

        

        // If letter spacing is 100%, reset to normal and don't apply any changes

        if (this.letterSpacing === 100) {

            console.log('*** Letter spacing is 100%, resetting to normal ***');

            document.body.style.letterSpacing = '';

            return;

        }

        

        const scale = this.letterSpacing / 100;

        // At 100%, letter spacing should be 0px (no change)

        // At 150%, letter spacing should be 0.5px

        // At 200%, letter spacing should be 1px

        const letterSpacingValue = `${(scale - 1) * 0.5}px`;

        console.log('*** Calculated letterSpacingValue:', letterSpacingValue + ' ***');

        

        // Apply to body

        document.body.style.letterSpacing = letterSpacingValue;

        

        // Apply to all text elements except accessibility panel

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select');

        

        textElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.letterSpacing = letterSpacingValue;

            }

        });

        

        console.log('Accessibility Widget: Letter spacing updated to', this.letterSpacing + '%');

    }



    // Store original font sizes to prevent compounding

    storeOriginalFontSizes() {

        // Only store original sizes if we haven't done it before

        if (this.originalFontSizes.size > 0) {

            return; // Already stored

        }

        

        // If font size is 100%, don't store anything to avoid any side effects

        if (this.fontSize === 100) {

            console.log('Accessibility Widget: Font size is 100%, skipping original font size storage to prevent side effects');

            return;

        }

        

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select');

        

        textElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                // Get the current computed size without modifying any styles

                const currentSize = parseFloat(window.getComputedStyle(element).fontSize);

                

                if (currentSize && !isNaN(currentSize)) {

                    this.originalFontSizes.set(element, currentSize);

                }

            }

        });

        

        // Store body current font size

        const bodySize = parseFloat(window.getComputedStyle(document.body).fontSize);

        if (bodySize && !isNaN(bodySize)) {

            this.originalFontSizes.set(document.body, bodySize);

        }

        

        console.log('Accessibility Widget: Stored original font sizes for', this.originalFontSizes.size, 'elements');

    }



    // Enhanced font size method

    updateFontSizeEnhanced() {

        const scale = this.fontSize / 100;

        

        // If font size is 100%, just clear any existing font-size styles and don't apply scaling

        if (this.fontSize === 100) {

            const elements = document.querySelectorAll('*');

            elements.forEach(element => {

                if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                    element.style.fontSize = '';

                }

            });

            console.log('Accessibility Widget: Font size reset to 100% (original)');

            return;

        }

        

        // Store original font sizes if not already stored

        this.storeOriginalFontSizes();

        

        // Clear all existing font-size styles first

        const elements = document.querySelectorAll('*');

        elements.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.fontSize = '';

            }

        });

        

        // Apply to body using original size

        const bodyOriginalSize = this.originalFontSizes.get(document.body) || 16;

        document.body.style.setProperty('font-size', `${bodyOriginalSize * scale}px`);
        
        // Also apply to html element to ensure it takes precedence
        document.documentElement.style.setProperty('font-size', `${bodyOriginalSize * scale}px`);

        

        // Apply to all text elements using their original sizes

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select');

        

        textElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                const originalSize = this.originalFontSizes.get(element);

                if (originalSize && !isNaN(originalSize)) {

                    // Apply the scale to the original size

                    element.style.setProperty('font-size', `${originalSize * scale}px`);

                }

            }

        });

        

        console.log('Accessibility Widget: Font size updated to', this.fontSize + '%');

    }



    updateLetterSpacingDisplay() {

        console.log('Accessibility Widget: updateLetterSpacingDisplay called, letterSpacing:', this.letterSpacing);

        console.log('Accessibility Widget: shadowRoot exists:', !!this.shadowRoot);

        

        const display = this.shadowRoot.getElementById('letter-spacing-value');

        console.log('Accessibility Widget: letter-spacing-value element found:', !!display);

        

        if (display) {

            display.textContent = this.letterSpacing + '%';

            console.log('Accessibility Widget: Updated letter spacing display to', this.letterSpacing + '%');

        } else {

            console.log('Accessibility Widget: Letter spacing display element not found');

            // Try to find it in the main document as fallback

            const fallbackDisplay = document.getElementById('letter-spacing-value');

            if (fallbackDisplay) {

                fallbackDisplay.textContent = this.letterSpacing + '%';

                console.log('Accessibility Widget: Updated letter spacing display via fallback to', this.letterSpacing + '%');

            } else {

                console.log('Accessibility Widget: Letter spacing display element not found in main document either');

            }

        }

    }



    resetLetterSpacing() {

        console.log('Accessibility Widget: Resetting letter spacing to original state');

        

        // Reset the letter spacing value to 100%

        this.letterSpacing = 100;

        this.settings['letter-spacing'] = 100; // Save to settings

        

        // Reset letter spacing back to original website styling

        document.body.style.removeProperty('letter-spacing');

        

        // Remove any inline letter-spacing styles that might have been added

        const elements = document.querySelectorAll('*');

        let resetCount = 0;

        elements.forEach(element => {

            if (element.style.letterSpacing) {

                element.style.removeProperty('letter-spacing');

                resetCount++;

            }

        });

        

        // Update the display to show 100%

        this.updateLetterSpacingDisplay();

        this.saveSettings(); // Persist the reset

        

        console.log('Accessibility Widget: Letter spacing reset to original - cleared', resetCount, 'elements');

    }





    // Control Show/Hide Methods

    showContentScalingControls() {

        const controls = this.shadowRoot.getElementById('content-scaling-controls');

        if (controls) {

            controls.style.display = 'block';

        }

    }



    hideContentScalingControls() {

        const controls = this.shadowRoot.getElementById('content-scaling-controls');

        if (controls) {

            controls.style.display = 'none';

        }

    }



    showFontSizingControls() {

        const controls = this.shadowRoot.getElementById('font-sizing-controls');

        if (controls) {

            controls.style.display = 'block';

        }

    }



    hideFontSizingControls() {

        const controls = this.shadowRoot.getElementById('font-sizing-controls');

        if (controls) {

            controls.style.display = 'none';

        }

    }







    // Reset Methods

    resetContentScale() {

        this.contentScale = 100; // Reset to 100% (normal size)

        this.settings['content-scale'] = 100; // Save to settings

        

        // Reset body scaling

        const body = document.body;

        const html = document.documentElement;

        

        body.style.transform = '';

        body.style.transformOrigin = '';

        body.style.width = '';

        body.style.height = '';

        body.style.position = '';

        body.style.left = '';

        body.style.top = '';

        

        // Reset accessibility widget container

        const widgetContainer = document.getElementById('accessibility-widget-container');

        if (widgetContainer) {

            widgetContainer.style.transform = '';

            widgetContainer.style.transformOrigin = '';

        }

        

        // Reset accessibility widget elements

        const accessibilityElements = document.querySelectorAll('.accessibility-panel, #accessibility-icon, .accessibility-icon');

        accessibilityElements.forEach(element => {

            element.style.transform = '';

            element.style.transformOrigin = '';

        });

        

        // Reset container overflow restrictions

        html.style.overflow = '';

        html.style.maxWidth = '';

        html.style.maxHeight = '';

        

        this.updateContentScaleDisplay();

        this.saveSettings(); // Persist the reset

        console.log('Accessibility Widget: Content scale reset to 100%');

    }



    // Highlight Methods

    highlightTitles() {

        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headings.forEach(heading => {

            // Skip if heading is inside accessibility panel

            if (heading.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                return;

            }

            

            // Create a wrapper div around the heading

            if (!heading.dataset.highlighted) {

                const wrapper = document.createElement('div');

                wrapper.style.cssText = `

                    display: inline-block;

                    border: 2px solid #6366f1;

                    border-radius: 6px;

                    padding: 4px 8px;

                    margin: 2px;

                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

                    background: transparent;

                `;

                

                // Insert wrapper before heading and move heading inside

                heading.parentNode.insertBefore(wrapper, heading);

                wrapper.appendChild(heading);

                heading.dataset.highlighted = 'true';

            }

        });

    }



    removeTitleHighlights() {

        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headings.forEach(heading => {

            // Remove wrapper if it exists

            if (heading.dataset.highlighted && heading.parentNode && heading.parentNode.style.border) {

                const wrapper = heading.parentNode;

                const grandParent = wrapper.parentNode;

                grandParent.insertBefore(heading, wrapper);

                grandParent.removeChild(wrapper);

                delete heading.dataset.highlighted;

            }

        });

    }



    highlightLinks() {

        const links = document.querySelectorAll('a');

        links.forEach(link => {

            // Create a wrapper div around the link

            if (!link.dataset.highlighted) {

                const wrapper = document.createElement('div');

                wrapper.style.cssText = `

                    display: inline-block;

                    border: 2px solid #6366f1;

                    border-radius: 4px;

                    padding: 2px 4px;

                    margin: 1px;

                    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);

                    background: transparent;

                `;

                

                // Insert wrapper before link and move link inside

                link.parentNode.insertBefore(wrapper, link);

                wrapper.appendChild(link);

                link.dataset.highlighted = 'true';

            }

        });

    }



    removeLinkHighlights() {

        const links = document.querySelectorAll('a');

        links.forEach(link => {

            // Remove wrapper if it exists

            if (link.dataset.highlighted && link.parentNode && link.parentNode.style.border) {

                const wrapper = link.parentNode;

                const grandParent = wrapper.parentNode;

                grandParent.insertBefore(link, wrapper);

                grandParent.removeChild(wrapper);

                delete link.dataset.highlighted;

            }

        });

    }



    showColorPicker(type) {

        const color = prompt(`Enter ${type} color (hex code):`, '#000000');

        if (color) {

            document.documentElement.style.setProperty(`--custom-${type}-color`, color);

            document.body.classList.add(`custom-${type}-color`);

        }

    }



    // Useful Links Methods

    enableUsefulLinks() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#useful-links');

        if (toggle) {

            toggle.checked = true;

        }

        

        this.createUsefulLinksDropdown();

        console.log('Accessibility Widget: Useful links enabled');

    }



    disableUsefulLinks() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#useful-links');

        if (toggle) {

            toggle.checked = false;

        }

        

        this.removeUsefulLinksDropdown();

        console.log('Accessibility Widget: Useful links disabled');

    }



    createUsefulLinksDropdown() {

        // Remove existing dropdown if any

        this.removeUsefulLinksDropdown();

        

        // Find the useful-links module in the panel

        const usefulLinksToggle = this.shadowRoot.querySelector('#useful-links');

        console.log('Accessibility Widget: Found useful-links toggle:', usefulLinksToggle);

        

        if (!usefulLinksToggle) {

            console.error('Accessibility Widget: Could not find #useful-links toggle');

            return;

        }

        

        const usefulLinksModule = usefulLinksToggle.closest('.profile-item');

        console.log('Accessibility Widget: Found useful-links module:', usefulLinksModule);

        

        if (usefulLinksModule) {

            // Create dropdown content

            const dropdownContainer = document.createElement('div');

            dropdownContainer.id = 'useful-links-dropdown';

            dropdownContainer.className = 'useful-links-dropdown';

            

            // Create dropdown content

            dropdownContainer.innerHTML = `

                <div class="useful-links-content">

                    <select id="useful-links-select">

                        <option value="">Select an option</option>

                        <option value="home">Home</option>

                        <option value="header">Header</option>

                        <option value="footer">Footer</option>

                        <option value="main-content">Main content</option>

                        <option value="about-us">About us</option>

                        <option value="portfolio">Portfolio</option>

                    </select>

                </div>

            `;

            

            // Insert the dropdown INSIDE the profile-item, after the profile-info

            const profileInfo = usefulLinksModule.querySelector('.profile-info');

            const toggleSwitch = usefulLinksModule.querySelector('.toggle-switch');

            

            // Add class to profile-item to indicate dropdown is present

            usefulLinksModule.classList.add('has-dropdown');

            

            // Keep flexbox layout - don't override with block
            // usefulLinksModule.style.display = 'block'; // REMOVED - this was breaking the layout
            // usefulLinksModule.style.flexDirection = 'unset'; // REMOVED
            // usefulLinksModule.style.alignItems = 'unset'; // REMOVED
            // usefulLinksModule.style.justifyContent = 'unset'; // REMOVED
            // usefulLinksModule.style.flexWrap = 'unset'; // REMOVED
            // usefulLinksModule.style.flexFlow = 'unset'; // REMOVED
            // usefulLinksModule.style.flex = 'unset'; // REMOVED

            

            // Keep toggle in its original position - don't move it
            // profileInfo.appendChild(toggleSwitch); // REMOVED - this was causing positioning issues

            

            // Insert dropdown after the entire profile-item to avoid flex layout issues
            usefulLinksModule.parentNode.insertBefore(dropdownContainer, usefulLinksModule.nextSibling);

            

            // Add event listener to select

            const select = dropdownContainer.querySelector('#useful-links-select');

            select.addEventListener('change', (e) => {

                const value = e.target.value;

                if (value) {

                    this.navigateToSection(value);

                    // Keep the selected value visible instead of resetting

                    // This shows the user what they selected

                }

            });

            

            console.log('Accessibility Widget: Useful links dropdown created in panel');

        } else {

            console.error('Accessibility Widget: Could not find useful-links module');

        }

    }



    removeUsefulLinksDropdown() {

        const dropdown = this.shadowRoot.querySelector('#useful-links-dropdown');

        if (dropdown) {

            dropdown.remove();

            

            // Restore original structure

            const usefulLinksModule = this.shadowRoot.querySelector('#useful-links').closest('.profile-item');

            if (usefulLinksModule) {

                usefulLinksModule.classList.remove('has-dropdown');

                

                // Clear inline styles to restore original CSS

                usefulLinksModule.style.display = '';

                usefulLinksModule.style.flexDirection = '';

                usefulLinksModule.style.alignItems = '';

                usefulLinksModule.style.justifyContent = '';

                usefulLinksModule.style.flexWrap = '';

                usefulLinksModule.style.flexFlow = '';

                usefulLinksModule.style.flex = '';

                

                // Move toggle back to its original position

                const profileInfo = usefulLinksModule.querySelector('.profile-info');

                const toggleSwitch = profileInfo.querySelector('.toggle-switch');

                if (toggleSwitch) {

                    // Remove toggle from profile-info

                    toggleSwitch.remove();

                    // Add toggle back to profile-item

                    usefulLinksModule.appendChild(toggleSwitch);

                }

            }

            console.log('Accessibility Widget: Useful links dropdown removed');

        }

    }



    navigateToSection(section) {

        console.log('Accessibility Widget: Navigating to section:', section);

        

        switch(section) {

            case 'home':

                this.scrollToElement('body');

                break;

            case 'header':

                this.scrollToElement('header, .header, nav, .navbar');

                break;

            case 'footer':

                this.scrollToElement('footer, .footer');

                break;

            case 'main-content':

                this.scrollToElement('main, .main, .content, .container');

                break;

            case 'about-us':

                this.scrollToElement('[id*="about"], [class*="about"], h1:contains("About"), h2:contains("About")');

                break;

            case 'portfolio':

                this.scrollToElement('[id*="portfolio"], [class*="portfolio"], h1:contains("Portfolio"), h2:contains("Portfolio")');

                break;

            default:

                console.log('Accessibility Widget: Unknown section:', section);

        }

    }



    scrollToElement(selector) {

        // Try multiple selectors

        const selectors = selector.split(', ');

        let element = null;

        

        for (const sel of selectors) {

            if (sel.includes(':contains')) {

                // Handle text content search

                const text = sel.match(/:contains\("([^"]+)"\)/)[1];

                element = this.findElementByText(text);

            } else {

                element = document.querySelector(sel);

            }

            

            if (element) break;

        }

        

        if (element) {

            element.scrollIntoView({ 

                behavior: 'smooth', 

                block: 'start',

                inline: 'nearest'

            });

            console.log('Accessibility Widget: Scrolled to element:', element);

        } else {

            console.log('Accessibility Widget: Element not found for selector:', selector);

        }

    }



    findElementByText(text) {

        // Search for elements containing the text

        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, section, article');

        for (const element of elements) {

            if (element.textContent.toLowerCase().includes(text.toLowerCase())) {

                return element;

            }

        }

        return null;

    }



    // Reading Mask Methods

    enableReadingMask() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#reading-mask');

        if (toggle) {

            toggle.checked = true;

        }

        

        document.body.classList.add('reading-mask');

        this.createReadingMaskOverlay();

        this.createReadingMaskSpotlight();

        console.log('Accessibility Widget: Reading mask enabled');

    }



    disableReadingMask() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#reading-mask');

        if (toggle) {

            toggle.checked = false;

        }

        

        // Remove reading-mask class from body and html

        document.body.classList.remove('reading-mask');

        document.documentElement.classList.remove('reading-mask');

        console.log('Accessibility Widget: Reading mask class removed from body and html');

        

        // Remove overlay element

        this.removeReadingMaskOverlay();

        

        // Remove spotlight

        this.removeReadingMaskSpotlight();

        

        // Force remove any remaining reading-mask elements

        const spotlightContainer = document.getElementById('reading-mask-spotlight-container');

        if (spotlightContainer) {

            spotlightContainer.remove();

            console.log('Accessibility Widget: Spotlight container force removed');

        }

        

        // Force remove any remaining spotlight elements

        const remainingSpotlight = document.getElementById('reading-mask-spotlight');

        if (remainingSpotlight) {

            remainingSpotlight.remove();

            console.log('Accessibility Widget: Spotlight element force removed');

        }

        

        // Force remove any inline styles that might be causing issues

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            if (element.style.filter && element.style.filter.includes('brightness')) {

                element.style.filter = '';

            }

            if (element.style.backdropFilter && element.style.backdropFilter.includes('brightness')) {

                element.style.backdropFilter = '';

            }

        });

        

        console.log('Accessibility Widget: Reading mask disabled');

    }



    createReadingMaskOverlay() {

        // Remove existing overlay if any

        this.removeReadingMaskOverlay();

        

        // Create overlay element

        const overlay = document.createElement('div');

        overlay.id = 'reading-mask-overlay';

        overlay.className = 'reading-mask-overlay';

        

        // Add overlay to body

        document.body.appendChild(overlay);

        console.log('Accessibility Widget: Reading mask overlay created');

    }



    removeReadingMaskOverlay() {

        const overlay = document.getElementById('reading-mask-overlay');

        if (overlay) {

            overlay.remove();

            console.log('Accessibility Widget: Reading mask overlay removed');

        }

    }



    // Additional method to force remove reading mask overlay (can be called externally if needed)

    forceRemoveReadingMaskOverlay() {

        console.log('Accessibility Widget: Force removing reading mask overlay');

        

        // Remove classes from both body and html

        document.body.classList.remove('reading-mask');

        document.documentElement.classList.remove('reading-mask');

        

        // Remove all reading mask related elements

        const elements = [

            'reading-mask-overlay',

            'reading-mask-spotlight',

            'reading-mask-spotlight-container'

        ];

        

        elements.forEach(id => {

            const element = document.getElementById(id);

            if (element) {

                element.remove();

                console.log(`Accessibility Widget: Removed element ${id}`);

            }

        });

        

        console.log('Accessibility Widget: Reading mask overlay force removed');

    }



    createReadingMaskSpotlight() {

        // Remove existing spotlight if any

        this.removeReadingMaskSpotlight();

        

        // Create spotlight container

        const spotlightContainer = document.createElement('div');

        spotlightContainer.id = 'reading-mask-spotlight-container';

        spotlightContainer.style.cssText = `

            position: fixed;

            top: 0;

            left: 0;

            width: 100vw;

            height: 100vh;

            pointer-events: none;

            z-index: 99998;

            overflow: hidden;

        `;

        document.body.appendChild(spotlightContainer);

        

        // Create spotlight overlay with enhanced brightness for reading

        const spotlight = document.createElement('div');

        spotlight.id = 'reading-mask-spotlight';

        spotlight.style.cssText = `

            position: absolute;

            width: 100%;

            height: 150px;

            background: transparent;

            backdrop-filter: brightness(2.2) contrast(1.2);

            box-shadow: 

                inset 0 0 50px rgba(255, 255, 255, 0.2),

                0 0 20px rgba(255, 255, 255, 0.1);

            border-top: 2px solid rgba(255, 255, 255, 0.4);

            border-bottom: 2px solid rgba(255, 255, 255, 0.4);

            transform: translateY(-50%);

            transition: none;

            border-radius: 8px;

            filter: none;

        `;

        spotlightContainer.appendChild(spotlight);

        

        // Add mouse move event listener

        this.readingMaskMouseMoveHandler = (e) => {

            const y = e.clientY - 75; // Center the spotlight on cursor (half of 150px height)

            

            // Keep spotlight within viewport bounds

            const maxY = window.innerHeight - 150;

            const clampedY = Math.max(0, Math.min(y, maxY));

            

            spotlight.style.top = clampedY + 'px';

            spotlight.style.transition = 'top 0.1s ease-out';

        };

        

        document.addEventListener('mousemove', this.readingMaskMouseMoveHandler);

        

        console.log('Accessibility Widget: Reading mask spotlight created');

    }



    removeReadingMaskSpotlight() {

        const spotlightContainer = document.getElementById('reading-mask-spotlight-container');

        if (spotlightContainer) {

            spotlightContainer.remove();

        }

        

        // Remove mouse move event listener

        if (this.readingMaskMouseMoveHandler) {

            document.removeEventListener('mousemove', this.readingMaskMouseMoveHandler);

            this.readingMaskMouseMoveHandler = null;

        }

        

        console.log('Accessibility Widget: Reading mask spotlight removed');

    }



    // Highlight Hover Methods

    enableHighlightHover() {
        this.settings['highlight-hover'] = true;
        document.body.classList.add('highlight-hover');
        
        // Add CSS rules for highlight hover if not already added
        if (!document.getElementById('highlight-hover-css')) {
            const style = document.createElement('style');
            style.id = 'highlight-hover-css';
            style.textContent = `
                .highlight-hover *:hover {
                    outline: 2px solid #0066ff !important;
                    outline-offset: 2px !important;
                }
                
                .highlight-hover a:hover {
                    outline: 2px solid #0066ff !important;
                    outline-offset: 2px !important;
                }
                
                .highlight-hover button:hover,
                .highlight-hover input:hover,
                .highlight-hover select:hover,
                .highlight-hover textarea:hover {
                    outline: 2px solid #0066ff !important;
                    outline-offset: 2px !important;
                }
                
                .highlight-hover img:hover {
                    outline: 3px solid #0066ff !important;
                    outline-offset: 3px !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Highlight hover enabled');
    }



    disableHighlightHover() {
        this.settings['highlight-hover'] = false;
        document.body.classList.remove('highlight-hover');
        
        // Remove CSS rules for highlight hover
        const existingStyle = document.getElementById('highlight-hover-css');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Highlight hover disabled');
    }



    // Highlight Focus Methods

    enableHighlightFocus() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#highlight-focus');

        if (toggle) {

            toggle.checked = true;

        }

        

        document.body.classList.add('highlight-focus');

        console.log('Accessibility Widget: Highlight focus enabled');

        console.log('Accessibility Widget: Body classes:', document.body.className);

        

        // Apply focus styles to currently focused element if any

        const activeElement = document.activeElement;

        if (activeElement && activeElement !== document.body && activeElement !== document.documentElement) {

            // Only apply to interactive elements

            const isInteractiveElement = activeElement.tagName === 'A' || 

                                      activeElement.tagName === 'BUTTON' || 

                                      activeElement.tagName === 'INPUT' || 

                                      activeElement.tagName === 'SELECT' || 

                                      activeElement.tagName === 'TEXTAREA' ||

                                      activeElement.hasAttribute('tabindex') ||

                                      activeElement.hasAttribute('role') ||

                                      activeElement.isContentEditable;

            

            // Apply to interactive elements not inside the panel (allow the icon itself)

            if (!activeElement.closest('.accessibility-panel') && 

                isInteractiveElement) {

                console.log('Accessibility Widget: Applying focus styles to currently focused element:', activeElement);

                activeElement.style.outline = '3px solid #6366f1';

                activeElement.style.outlineOffset = '2px';

                activeElement.style.background = 'rgba(99, 102, 241, 0.1)';

                activeElement.style.borderRadius = '4px';

                activeElement.style.transition = 'outline 0.2s ease, background 0.2s ease';

                

                // Track the currently focused element

                this.currentlyFocusedElement = activeElement;

            }

        }

        

        // Add a global focus event listener to ensure immediate application of styles

        this.highlightFocusHandler = (e) => {

            console.log('Accessibility Widget: Focus event triggered on:', e.target);

            console.log('Accessibility Widget: Body has highlight-focus class:', document.body.classList.contains('highlight-focus'));
            console.log('Accessibility Widget: Is keyboard navigation:', this.isKeyboardNavigation);
            console.log('Accessibility Widget: Last interaction method:', this.lastInteractionMethod);
            
            // Special debugging for accessibility icon
            if (e.target.classList && e.target.classList.contains('accessibility-icon')) {
                console.log('🎯 [FOCUS] Accessibility icon focused!');
                console.log('🎯 [FOCUS] Icon classes:', e.target.className);
                console.log('🎯 [FOCUS] Icon ID:', e.target.id);
                console.log('🎯 [FOCUS] Body has highlight-focus:', document.body.classList.contains('highlight-focus'));
                console.log('🎯 [FOCUS] Is keyboard navigation:', this.isKeyboardNavigation);
                console.log('🎯 [FOCUS] Applying focus styles to accessibility icon');
                
                // Always apply focus styles to accessibility icon when focused
                e.target.style.outline = '3px solid #6366f1';
                e.target.style.outlineOffset = '2px';
                e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                e.target.style.borderRadius = '4px';
                e.target.style.transition = 'outline 0.2s ease, background 0.2s ease';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                return; // Exit early to prevent other focus handling
            }

            if (document.body.classList.contains('highlight-focus') && this.isKeyboardNavigation) {

                const focusedElement = e.target;

                

                // Only apply to interactive elements that can actually receive focus

                const isInteractiveElement = focusedElement.tagName === 'A' || 

                                          focusedElement.tagName === 'BUTTON' || 

                                          focusedElement.tagName === 'INPUT' || 

                                          focusedElement.tagName === 'SELECT' || 

                                          focusedElement.tagName === 'TEXTAREA' ||

                                          focusedElement.hasAttribute('tabindex') ||

                                          focusedElement.hasAttribute('role') ||

                                          focusedElement.isContentEditable;

                

                // Skip if element is not interactive or is part of accessibility panel (but allow accessibility icon)

                if (focusedElement === document.body || 

                    focusedElement === document.documentElement ||

                    focusedElement.closest('.accessibility-panel') ||

                    !isInteractiveElement) {

                    return;

                }

                

                // Remove focus styles from previously focused element

                if (this.currentlyFocusedElement && this.currentlyFocusedElement !== focusedElement) {

                    console.log('Accessibility Widget: Removing focus styles from previous element:', this.currentlyFocusedElement);

                    this.currentlyFocusedElement.style.outline = '';

                    this.currentlyFocusedElement.style.outlineOffset = '';

                    this.currentlyFocusedElement.style.background = '';

                    this.currentlyFocusedElement.style.borderRadius = '';

                    this.currentlyFocusedElement.style.transition = '';

                }

                

                // Apply focus styles to new focused element

                console.log('Accessibility Widget: Interactive element focused, applying styles:', focusedElement);

                focusedElement.style.outline = '3px solid #6366f1';

                focusedElement.style.outlineOffset = '2px';

                focusedElement.style.background = 'rgba(99, 102, 241, 0.1)';

                focusedElement.style.borderRadius = '4px';

                focusedElement.style.transition = 'outline 0.2s ease, background 0.2s ease';

                

                // Track the currently focused element

                this.currentlyFocusedElement = focusedElement;

            }

        };

        

        // Add the focus event listener

        document.addEventListener('focusin', this.highlightFocusHandler, true);
        
        // Add focusout handler to clean up accessibility icon styles
        this.highlightFocusOutHandler = (e) => {
            if (e.target.classList && e.target.classList.contains('accessibility-icon')) {
                console.log('🎯 [FOCUS] Accessibility icon lost focus - removing styles');
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
                e.target.style.background = '';
                e.target.style.borderRadius = '';
                e.target.style.transition = '';
            }
        };
        
        document.addEventListener('focusout', this.highlightFocusOutHandler, true);

        console.log('Accessibility Widget: Focus event listener added');

        console.log('Accessibility Widget: highlightFocusHandler:', this.highlightFocusHandler);

        

        // Test if the feature is working by checking if we can find focusable elements

        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex], [role]');

        console.log('Accessibility Widget: Found', focusableElements.length, 'focusable elements');

        

        // Force a test focus on the first focusable element if any

        if (focusableElements.length > 0) {

            console.log('Accessibility Widget: First focusable element:', focusableElements[0]);

        }

    }



    disableHighlightFocus() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#highlight-focus');

        if (toggle) {

            toggle.checked = false;

        }

        

        document.body.classList.remove('highlight-focus');

        console.log('Accessibility Widget: Highlight focus disabled');

        

        // Remove focus styles from the currently tracked focused element

        if (this.currentlyFocusedElement) {

            console.log('Accessibility Widget: Removing focus styles from currently focused element:', this.currentlyFocusedElement);

            this.currentlyFocusedElement.style.outline = '';

            this.currentlyFocusedElement.style.outlineOffset = '';

            this.currentlyFocusedElement.style.background = '';

            this.currentlyFocusedElement.style.borderRadius = '';

            this.currentlyFocusedElement.style.transition = '';

            this.currentlyFocusedElement = null;

        }

        

        // Also remove any remaining focus styles from all elements as a safety measure

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            // Skip accessibility widget elements

            if (element.closest('.accessibility-panel') || element.closest('#accessibility-icon')) {

                return;

            }

            

            // Remove focus-related inline styles

            if (element.style.outline && element.style.outline.includes('6366f1')) {

                console.log('Accessibility Widget: Removing remaining focus styles from element:', element);

                element.style.outline = '';

                element.style.outlineOffset = '';

                element.style.background = '';

                element.style.borderRadius = '';

                element.style.transition = '';

            }

        });

        

        // Remove the focus event listener

        if (this.highlightFocusHandler) {

            document.removeEventListener('focusin', this.highlightFocusHandler, true);

            this.highlightFocusHandler = null;

        }
        
        // Remove the focusout handler
        if (this.highlightFocusOutHandler) {
            document.removeEventListener('focusout', this.highlightFocusOutHandler, true);
            this.highlightFocusOutHandler = null;
        }

        

        // Also remove the CSS class from body to ensure complete cleanup

        document.body.classList.remove('highlight-focus');

    }



    showStatement() {
        console.log('Accessibility Widget: Statement button clicked');
        console.log('Accessibility Widget: Customization data:', this.customizationData);
        
        // Check if we have a custom accessibility statement link
        if (this.customizationData && this.customizationData.accessibilityStatementLink) {
            console.log('Accessibility Widget: Opening custom statement link:', this.customizationData.accessibilityStatementLink);
            window.open(this.customizationData.accessibilityStatementLink, '_blank');
        } else {
            console.log('Accessibility Widget: No custom statement link found, showing default alert');
            // Default statement
            alert('This website is committed to providing an accessible experience for all users. We follow WCAG 2.1 guidelines and continuously work to improve accessibility.');
        }
    }



    resetSettings() {
        console.log('[CK] resetSettings() - Resetting all settings including language to English');

        this.settings = {};

        this.saveSettings();

        this.applySettings();

        // Clear usage tracking flags for toggleable features
        localStorage.removeItem('content-scaling-used');
        localStorage.removeItem('font-sizing-used');
        localStorage.removeItem('line-height-used');
        localStorage.removeItem('letter-spacing-used');
        console.log('[CK] resetSettings() - Cleared usage tracking flags');
        
        // Reset language to English
        this.applyLanguage('en');
        console.log('[CK] resetSettings() - Language reset to English');

        

        // Remove only accessibility-related classes

        const body = document.body;

        const accessibilityClasses = [

            'seizure-safe', 'vision-impaired', 'adhd-friendly', 'cognitive-disability',

            'keyboard-nav', 'screen-reader', 'high-contrast', 'monochrome',

            'dark-contrast', 'light-contrast', 'high-saturation', 'low-saturation',

            'readable-font', 'align-center', 'align-left', 'align-right',

            'big-black-cursor', 'big-white-cursor', 'stop-animation',

            'content-scaling', 'font-sizing', 'adjust-line-height', 'adjust-letter-spacing',

            'highlight-titles', 'highlight-links', 'adjust-text-colors', 'adjust-title-colors',

            'adjust-bg-colors', 'mute-sound', 'read-mode', 'reading-guide',

            'reading-mask', 'useful-links', 'highlight-hover', 'highlight-focus',

            'text-magnifier', 'hide-images'

        ];

        

        const currentClasses = body.className.split(' ');

        const filteredClasses = currentClasses.filter(cls => 

            !accessibilityClasses.includes(cls)

        );

        body.className = filteredClasses.join(' ');

        

        // Reset scaling values

        this.contentScale = 100; // Reset to 100% (normal size)

        this.fontSize = 100;

        this.lineHeight = 100;

        this.letterSpacing = 100;

        

        // Reset font size

        this.resetFontSize();

        

        // Reset content scale

        this.resetContentScale();

        

        // Reset line height

        this.resetLineHeight();

        



        

        // Reset letter spacing

        this.resetLetterSpacing();

        

        // Disable text magnifier

        this.disableTextMagnifier();

        

        // Remove font size controls

        this.disableFontSizing();

        

                // Hide all scaling controls

        this.hideContentScalingControls();

        this.hideFontSizingControls();

        this.hideLineHeightControls();

        this.hideLetterSpacingControls();

        

        // Remove highlights

        this.removeTitleHighlights();

        this.removeLinkHighlights();

        

        // Disable high contrast and saturation

        this.disableHighContrast();

        this.disableHighSaturation();

        this.disableDarkContrast();

        this.disableLightContrast();

        

        // Reset text colors

        this.resetTextColors();

        this.hideTextColorPicker();

        this.resetTitleColors();

        this.hideTitleColorPicker();

        this.resetBackgroundColors();

        this.hideBackgroundColorPicker();

        

        // Disable all profiles

        this.disableSeizureSafe();

        this.disableVisionImpaired();

        this.disableADHDFriendly();

        this.disableCognitiveDisability();

        this.disableReadableFont();

        

        // Disable cursor features

        this.disableBigBlackCursor();

        this.disableBigWhiteCursor();

        

        // Reset cursor styles on Shadow DOM

        this.resetBigBlackCursor();

        this.resetBigWhiteCursor();

        

        // Disable stop animation

        this.disableStopAnimation();

        

        // Remove cognitive boxes

        this.removeCognitiveBoxes();

        

        // Remove ADHD spotlight

        this.removeADHDSpotlight();

        

        // Disable read mode (remove read mode layer)

        this.disableReadMode();

        

        // Disable reading guide (remove horizontal bar)

        this.disableReadingGuide();

        

        // Disable reading mask (remove overlay and spotlight)

        this.disableReadingMask();

        

        // Force remove any remaining reading mask overlay

        this.forceRemoveReadingMaskOverlay();

        

        // Disable useful links (remove dropdown)

        this.disableUsefulLinks();

        

        // Reset custom colors

        document.documentElement.style.removeProperty('--custom-text-color');

        document.documentElement.style.removeProperty('--custom-title-color');

        document.documentElement.style.removeProperty('--custom-bg-color');

        

        // Reset all toggles in Shadow DOM

        const toggles = this.shadowRoot.querySelectorAll('.toggle-switch input');

        toggles.forEach(toggle => {

            toggle.checked = false;

        });

        

        // Update widget appearance after reset

        this.updateWidgetAppearance();
        
        // Ensure widget remains visible after reset - ADD THIS PROTECTION
        setTimeout(() => {
            console.log('Accessibility Widget: Ensuring widget visibility after reset...');
            const widgetContainer = document.getElementById('accessibility-widget-container');
            const icon = this.shadowRoot?.getElementById('accessibility-icon');
            const panel = this.shadowRoot?.getElementById('accessibility-panel');
            
            if (!widgetContainer) {
                console.error('Accessibility Widget: Widget container missing after reset! Recreating...');
                this.createWidget();
                return;
            }
            
            if (!icon) {
                console.error('Accessibility Widget: Icon missing after reset!');
            } else {
                // Force icon to be visible
                icon.style.setProperty('display', 'flex', 'important');
                icon.style.setProperty('visibility', 'visible', 'important');
                icon.style.setProperty('opacity', '1', 'important');
                console.log('Accessibility Widget: Icon visibility ensured');
            }
            
            if (!panel) {
                console.error('Accessibility Widget: Panel missing after reset!');
            } else {
                // Ensure panel is properly hidden but not removed
                panel.style.setProperty('display', 'none', 'important');
                panel.style.setProperty('visibility', 'hidden', 'important');
                console.log('Accessibility Widget: Panel visibility ensured (hidden)');
            }
            
            console.log('Accessibility Widget: Reset completed, widget protected');
        }, 100);

    }



    loadSettings() {

        const saved = localStorage.getItem('accessibility-settings');

        if (saved) {

            this.settings = JSON.parse(saved);

        }

        

        // Set default settings for keyboard navigation if not already set

        if (this.settings['keyboard-nav'] === undefined) {

            this.settings['keyboard-nav'] = false; // Disabled by default

            console.log('Accessibility Widget: Setting keyboard navigation to disabled by default');

        }

        

        // Load content scale from settings

        if (this.settings['content-scale'] !== undefined) {

            this.contentScale = this.settings['content-scale'];

            console.log('Accessibility Widget: Loaded content scale from settings:', this.contentScale + '%');

        } else {

            this.contentScale = 100; // Default to 100%

            this.settings['content-scale'] = 100;

            console.log('Accessibility Widget: Content scale set to default 100%');

        }

        

        // Set content scaling toggle state based on whether content scale is not 100%

        if (this.contentScale !== 100) {

            this.settings['content-scaling'] = true;

            console.log('Accessibility Widget: Content scaling toggle enabled due to non-default scale');

        } else if (this.settings['content-scaling'] === undefined) {

            this.settings['content-scaling'] = false;

            console.log('Accessibility Widget: Content scaling toggle disabled by default');

        }

        

        // Load font size from settings

        if (this.settings['font-size'] !== undefined) {

            this.fontSize = this.settings['font-size'];

            console.log('Accessibility Widget: Loaded font size from settings:', this.fontSize + '%');

        } else {

            this.fontSize = 100; // Default to 100%

            this.settings['font-size'] = 100;

            console.log('Accessibility Widget: Font size set to default 100%');

        }

        

        // Set font sizing toggle state based on whether font size is not 100%

        if (this.fontSize !== 100) {

            this.settings['font-sizing'] = true;

            console.log('Accessibility Widget: Font sizing toggle enabled due to non-default font size');

        } else if (this.settings['font-sizing'] === undefined) {

            this.settings['font-sizing'] = false;

            console.log('Accessibility Widget: Font sizing toggle disabled by default');

        }

        

        // Load line height from settings

        if (this.settings['line-height'] !== undefined) {

            this.lineHeight = this.settings['line-height'];

            console.log('Accessibility Widget: Loaded line height from settings:', this.lineHeight + '%');

        } else {

            this.lineHeight = 100; // Default to 100%

            this.settings['line-height'] = 100;

            console.log('Accessibility Widget: Line height set to default 100%');

        }

        

        // Set line height toggle state based on whether line height is not 100%

        if (this.lineHeight !== 100) {

            this.settings['adjust-line-height'] = true;

            console.log('Accessibility Widget: Line height toggle enabled due to non-default line height');

        } else if (this.settings['adjust-line-height'] === undefined) {

            this.settings['adjust-line-height'] = false;

            console.log('Accessibility Widget: Line height toggle disabled by default');

        }

        

        // Load letter spacing from settings

        if (this.settings['letter-spacing'] !== undefined) {

            this.letterSpacing = this.settings['letter-spacing'];

            console.log('Accessibility Widget: Loaded letter spacing from settings:', this.letterSpacing + '%');

        } else {

            this.letterSpacing = 100; // Default to 100%

            this.settings['letter-spacing'] = 100;

            console.log('Accessibility Widget: Letter spacing set to default 100%');

        }

        

        // Set letter spacing toggle state based on whether letter spacing is not 100%

        if (this.letterSpacing !== 100) {

            this.settings['adjust-letter-spacing'] = true;

            console.log('Accessibility Widget: Letter spacing toggle enabled due to non-default letter spacing');

        } else if (this.settings['adjust-letter-spacing'] === undefined) {

            this.settings['adjust-letter-spacing'] = false;

            console.log('Accessibility Widget: Letter spacing toggle disabled by default');

        }

        

        // Load text color from settings

        if (this.settings['text-color'] !== undefined && this.settings['text-color'] !== null) {

            console.log('Accessibility Widget: Loaded text color from settings:', this.settings['text-color']);

            // Apply the saved text color

            this.applyTextColor(this.settings['text-color']);

        }

        

        // Load title color from settings

        if (this.settings['title-color'] !== undefined && this.settings['title-color'] !== null) {

            console.log('Accessibility Widget: Loaded title color from settings:', this.settings['title-color']);

            // Apply the saved title color

            this.applyTitleColor(this.settings['title-color']);

        }

        

        // Load background color from settings

        if (this.settings['bg-color'] !== undefined && this.settings['bg-color'] !== null) {

            console.log('Accessibility Widget: Loaded background color from settings:', this.settings['bg-color']);

            // Apply the saved background color

            this.applyBackgroundColor(this.settings['bg-color']);

        }

        

        console.log('Accessibility Widget: Loaded settings:', this.settings);

    }



    saveSettings() {
        // Save to localStorage (existing functionality)
        localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
        
        // Also save to KV storage for persistence across devices
        this.saveSettingsToKV();
    }
    
    // Save settings to KV storage
    async saveSettingsToKV() {
        console.log('[CK] saveSettingsToKV() - Starting...');
        
        try {
            // Get siteId first
            const siteId = await this.getSiteId();
            if (!siteId) {
                console.error('[CK] saveSettingsToKV() - No siteId available, cannot save to KV');
                return;
            }
            
            if (!this.kvApiUrl) {
                console.error('[CK] saveSettingsToKV() - kvApiUrl is not set!');
                return;
            }
            
            // Prepare settings data for KV
            const settingsData = {
                siteId: siteId,
                settings: this.settings,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            console.log('[CK] saveSettingsToKV() - Saving settings to KV:', settingsData);
            
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/save-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });
            
            console.log('[CK] saveSettingsToKV() - Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[CK] saveSettingsToKV() - Failed to save to KV:', response.status, errorText);
                return;
            }
            
            const result = await response.json();
            console.log('[CK] saveSettingsToKV() - Successfully saved to KV:', result);
            
        } catch (error) {
            console.error('[CK] saveSettingsToKV() - Error saving to KV:', error);
        }
    }
    
    // Load user settings from KV storage
    async loadSettingsFromKV() {
        console.log('[CK] loadSettingsFromKV() - Starting...');
        
        try {
            // Get siteId first
            const siteId = await this.getSiteId();
            if (!siteId) {
                console.log('[CK] loadSettingsFromKV() - No siteId available, skipping KV load');
                return;
            }
            
            if (!this.kvApiUrl) {
                console.log('[CK] loadSettingsFromKV() - kvApiUrl is not set, skipping KV load');
                return;
            }
            
            console.log('[CK] loadSettingsFromKV() - Fetching user settings from KV...');
            
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/user-settings?siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[CK] loadSettingsFromKV() - Response status:', response.status);
            
            if (!response.ok) {
                console.log('[CK] loadSettingsFromKV() - No user settings found in KV or error:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('[CK] loadSettingsFromKV() - Loaded user settings from KV:', data);
            
            if (data.settings) {
                // Merge KV settings with existing settings (KV takes precedence)
                const kvSettings = data.settings;
                console.log('[CK] loadSettingsFromKV() - Applying KV settings:', kvSettings);
                
                // Update settings object
                Object.keys(kvSettings).forEach(key => {
                    this.settings[key] = kvSettings[key];
                });
                
                // Save merged settings back to localStorage
                localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
                
                console.log('[CK] loadSettingsFromKV() - Successfully loaded and applied KV settings');
            }
            
        } catch (error) {
            console.error('[CK] loadSettingsFromKV() - Error loading from KV:', error);
        }
    }



    applySettings() {

        console.log('Accessibility Widget: Applying settings:', this.settings);

        

        Object.entries(this.settings).forEach(([feature, enabled]) => {

            console.log(`Accessibility Widget: Processing feature ${feature}: ${enabled}`);

            if (enabled) {

                // Check usage tracking for special features before applying
                let shouldApply = true;
                
                if (feature === 'content-scaling') {
                    const wasContentScalingUsed = localStorage.getItem('content-scaling-used') === 'true';
                    if (!wasContentScalingUsed && this.contentScale === 100) {
                        console.log('[CK] Content scaling was saved but never used, not applying');
                        shouldApply = false;
                    }
                } else if (feature === 'font-sizing') {
                    const wasFontSizingUsed = localStorage.getItem('font-sizing-used') === 'true';
                    if (!wasFontSizingUsed && this.fontSize === 100) {
                        console.log('[CK] Font sizing was saved but never used, not applying');
                        shouldApply = false;
                    }
                } else if (feature === 'adjust-line-height') {
                    const wasLineHeightUsed = localStorage.getItem('line-height-used') === 'true';
                    if (!wasLineHeightUsed && this.lineHeight === 100) {
                        console.log('[CK] Line height was saved but never used, not applying');
                        shouldApply = false;
                    }
                } else if (feature === 'adjust-letter-spacing') {
                    const wasLetterSpacingUsed = localStorage.getItem('letter-spacing-used') === 'true';
                    if (!wasLetterSpacingUsed && this.letterSpacing === 100) {
                        console.log('[CK] Letter spacing was saved but never used, not applying');
                        shouldApply = false;
                    }
                }

                if (shouldApply) {
                this.applyFeature(feature, true);

                // Update displays for numeric features
                if (feature === 'adjust-line-height') {
                    this.updateLineHeightDisplay();
                }

                const toggle = this.shadowRoot.getElementById(feature);

                if (toggle) toggle.checked = true;
                } else {
                    // Remove the setting from localStorage since it wasn't actually used
                    delete this.settings[feature];
                    this.saveSettings();
                }

            }

        });

        

        // Apply content scale if it's not 100% AND was actually used

        if (this.contentScale !== 100) {

            const wasContentScalingUsed = localStorage.getItem('content-scaling-used') === 'true';
            
            if (wasContentScalingUsed) {
            console.log('Accessibility Widget: Applying saved content scale:', this.contentScale + '%');

            this.updateContentScale();

            this.updateContentScaleDisplay(); // Update the display value

            

            // Show content scaling controls if content scale is not 100%

            const controls = this.shadowRoot.getElementById('content-scaling-controls');

            if (controls) {

                controls.style.display = 'block';

            }

            

            // Update the toggle switch to show it's enabled

            const toggle = this.shadowRoot.getElementById('content-scaling');

            if (toggle) {

                toggle.checked = true;

                }
            } else {
                console.log('[CK] Content scaling was saved but never used, resetting to 100%');
                this.contentScale = 100;
                this.settings['content-scale'] = 100;
                this.saveSettings();
            }

        }

        

        // Apply font size if it's not 100% AND was actually used

        if (this.fontSize !== 100) {

            const wasFontSizingUsed = localStorage.getItem('font-sizing-used') === 'true';
            
            if (wasFontSizingUsed) {
            console.log('Accessibility Widget: Applying saved font size:', this.fontSize + '%');

            this.updateFontSizeEnhanced();

            this.updateFontSizeDisplay(); // Update the display value immediately

            

            // Show font sizing controls if font size is not 100%

            const fontControls = this.shadowRoot.getElementById('font-sizing-controls');

            if (fontControls) {

                fontControls.style.display = 'block';

            }

            

            // Update the toggle switch to show it's enabled

            const fontToggle = this.shadowRoot.getElementById('font-sizing');

            if (fontToggle) {

                fontToggle.checked = true;

                }
            } else {
                console.log('[CK] Font sizing was saved but never used, resetting to 100%');
                this.fontSize = 100;
                this.settings['font-size'] = 100;
                this.saveSettings();
            }

            

            // Update the display with a small delay to ensure Shadow DOM is ready

            setTimeout(() => {

                this.updateFontSizeDisplay();

            }, 50);

        }

        

        // Apply line height if it's not 100% AND was actually used

        if (this.lineHeight !== 100) {

            const wasLineHeightUsed = localStorage.getItem('line-height-used') === 'true';
            
            if (wasLineHeightUsed) {
            console.log('Accessibility Widget: Applying saved line height:', this.lineHeight + '%');

            this.updateLineHeight();

            

            // Show line height controls if line height is not 100%

            const lineHeightControls = this.shadowRoot.getElementById('line-height-controls');

            if (lineHeightControls) {

                lineHeightControls.style.display = 'block';
                
                // Bind events when controls are shown
                this.bindLineHeightEvents();
                this.bindLineHeightEventsDirect();

            }

            

            // Update the toggle switch to show it's enabled

            const lineHeightToggle = this.shadowRoot.getElementById('adjust-line-height');

            if (lineHeightToggle) {

                lineHeightToggle.checked = true;

                }
            } else {
                console.log('[CK] Line height was saved but never used, resetting to 100%');
                this.lineHeight = 100;
                this.settings['line-height'] = 100;
                this.saveSettings();
            }

            

            // Bind events to the line height buttons when controls are shown

            this.bindLineHeightEvents();

            

            // Update the display immediately and with a small delay to ensure Shadow DOM is ready

            this.updateLineHeightDisplay();

            setTimeout(() => {

                this.updateLineHeightDisplay();

            }, 50);

        }

        

        // Apply letter spacing if it's not 100% AND was actually used

        if (this.letterSpacing !== 100) {

            const wasLetterSpacingUsed = localStorage.getItem('letter-spacing-used') === 'true';
            
            if (wasLetterSpacingUsed) {
            console.log('Accessibility Widget: Applying saved letter spacing:', this.letterSpacing + '%');

            this.updateLetterSpacing();

            

            // Show letter spacing controls if letter spacing is not 100%

            const letterSpacingControls = this.shadowRoot.getElementById('letter-spacing-controls');

            if (letterSpacingControls) {

                letterSpacingControls.style.display = 'block';

            }

            

            // Update the toggle switch to show it's enabled

            const letterSpacingToggle = this.shadowRoot.getElementById('adjust-letter-spacing');

            if (letterSpacingToggle) {

                letterSpacingToggle.checked = true;

                }
            } else {
                console.log('[CK] Letter spacing was saved but never used, resetting to 100%');
                this.letterSpacing = 100;
                this.settings['letter-spacing'] = 100;
                this.saveSettings();
            }

            

            // Update the display with a small delay to ensure Shadow DOM is ready

            setTimeout(() => {

                this.updateLetterSpacingDisplay();

            }, 50);

        }

        

        // Apply text color if it's set

        if (this.settings['text-color'] !== undefined && this.settings['text-color'] !== null) {

            console.log('Accessibility Widget: Applying saved text color:', this.settings['text-color']);

            this.applyTextColor(this.settings['text-color']);

            

            // Show color picker controls

            this.showTextColorPicker();

            

            // Update the toggle switch to show it's enabled

            const textColorToggle = this.shadowRoot.getElementById('adjust-text-colors');

            if (textColorToggle) {

                textColorToggle.checked = true;

            }

        }

        

        // Apply title color if it's set

        if (this.settings['title-color'] !== undefined && this.settings['title-color'] !== null) {

            console.log('Accessibility Widget: Applying saved title color:', this.settings['title-color']);

            this.applyTitleColor(this.settings['title-color']);

            

            // Show color picker controls

            this.showTitleColorPicker();

            

            // Update the toggle switch to show it's enabled

            const titleColorToggle = this.shadowRoot.getElementById('adjust-title-colors');

            if (titleColorToggle) {

                titleColorToggle.checked = true;

            }

        }

        

        // Apply background color if it's set

        if (this.settings['bg-color'] !== undefined && this.settings['bg-color'] !== null) {

            console.log('Accessibility Widget: Applying saved background color:', this.settings['bg-color']);

            this.applyBackgroundColor(this.settings['bg-color']);

            

            // Show color picker controls

            this.showBackgroundColorPicker();

            

            // Update the toggle switch to show it's enabled

            const bgColorToggle = this.shadowRoot.getElementById('adjust-bg-colors');

            if (bgColorToggle) {

                bgColorToggle.checked = true;

            }

        }

        

        // Initialize keyboard shortcuts if keyboard navigation is enabled

        if (this.settings['keyboard-nav']) {

            console.log('Accessibility Widget: Keyboard navigation enabled in settings, initializing shortcuts');

            this.initKeyboardShortcuts();

        } else {

            console.log('Accessibility Widget: Keyboard navigation not enabled in settings');

            console.log('Accessibility Widget: Available settings keys:', Object.keys(this.settings));

        }

        

        // Update widget appearance to sync with loaded settings

        this.updateWidgetAppearance();

    }



    // Add missing letter spacing control methods

    showLetterSpacingControls() {

        console.log('Accessibility Widget: showLetterSpacingControls called');

        const controls = this.shadowRoot.getElementById('letter-spacing-controls');

        if (controls) {

            controls.style.display = 'block';

            console.log('Accessibility Widget: Letter spacing controls shown');

        } else {

            console.error('Accessibility Widget: Letter spacing controls not found');

        }

    }



    hideLetterSpacingControls() {

        const controls = this.shadowRoot.getElementById('letter-spacing-controls');

        if (controls) {

            controls.style.display = 'none';

            console.log('Accessibility Widget: Letter spacing controls hidden');

        } else {

            console.error('Accessibility Widget: Letter spacing controls not found');

        }

    }



    // High Contrast Methods

    enableHighContrast() {

        console.log('Accessibility Widget: enableHighContrast called');

        document.body.classList.add('high-contrast');

        console.log('Accessibility Widget: High contrast enabled');

    }



    disableHighContrast() {

        document.body.classList.remove('high-contrast');

        console.log('Accessibility Widget: High contrast disabled');

    }



    // High Saturation Methods

    enableHighSaturation() {

        document.body.classList.add('high-saturation');

        console.log('Accessibility Widget: High saturation enabled');

    }



    disableHighSaturation() {

        document.body.classList.remove('high-saturation');

        console.log('Accessibility Widget: High saturation disabled');

    }



    // Monochrome Methods

    enableMonochrome() {

        this.settings['monochrome'] = true;

        document.body.classList.add('monochrome');

        

        // Apply grayscale filter to all page content

        const style = document.createElement('style');

        style.id = 'accessibility-monochrome-styles';

        style.textContent = `

            /* Monochrome effect for all page content */

            body.monochrome *:not(.accessibility-icon):not(.accessibility-panel):not(#accessibility-icon):not(#accessibility-panel) {

                filter: grayscale(100%) !important;

                transition: filter 0.3s ease !important;

            }

            

            /* Ensure accessibility widget stays above overlay */

            body.monochrome .accessibility-widget,

            body.monochrome #accessibility-widget {

                z-index: 99998 !important;

            }

        `;

        document.head.appendChild(style);

        

        this.saveSettings();

        console.log('Accessibility Widget: Monochrome enabled');

    }



    disableMonochrome() {

        this.settings['monochrome'] = false;

        document.body.classList.remove('monochrome');

        

        // Remove monochrome styles

        const style = document.getElementById('accessibility-monochrome-styles');

        if (style) {

            style.remove();

        }

        

        this.saveSettings();

        console.log('Accessibility Widget: Monochrome disabled');

    }



    // Dark Contrast Methods

    enableDarkContrast() {

        console.log('Accessibility Widget: enableDarkContrast called');

        document.body.classList.add('dark-contrast');

        console.log('Accessibility Widget: Dark contrast enabled');

    }



    disableDarkContrast() {

        document.body.classList.remove('dark-contrast');

        console.log('Accessibility Widget: Dark contrast disabled');

    }



    // Light Contrast Methods

    enableLightContrast() {

        console.log('Accessibility Widget: enableLightContrast called');

        document.body.classList.add('light-contrast');

        console.log('Accessibility Widget: Light contrast enabled');

    }



    disableLightContrast() {

        document.body.classList.remove('light-contrast');

        console.log('Accessibility Widget: Light contrast disabled');

    }



    // Text Color Picker Methods

    showTextColorPicker() {

        console.log('Accessibility Widget: showTextColorPicker called');

        

        // Remove existing color picker if any

        this.hideTextColorPicker();

        

        // Find the adjust-text-colors module in the panel

        const textColorsModule = this.shadowRoot.querySelector('#adjust-text-colors').closest('.profile-item');

        

        if (textColorsModule) {

            // Create color picker content

            const colorPicker = document.createElement('div');

            colorPicker.id = 'text-color-picker';

            colorPicker.className = 'color-picker-inline';

            colorPicker.innerHTML = `

                <div class="color-picker-content">

                    <h4>Adjust Text Colors</h4>

                    <div class="color-options">

                        <div class="color-option" data-color="#3b82f6" style="background-color: #3b82f6;"></div>

                        <div class="color-option selected" data-color="#8b5cf6" style="background-color: #8b5cf6;"></div>

                        <div class="color-option" data-color="#ef4444" style="background-color: #ef4444;"></div>

                        <div class="color-option" data-color="#f97316" style="background-color: #f97316;"></div>

                        <div class="color-option" data-color="#14b8a6" style="background-color: #14b8a6;"></div>

                        <div class="color-option" data-color="#84cc16" style="background-color: #84cc16;"></div>

                        <div class="color-option" data-color="#ffffff" style="background-color: #ffffff; border: 1px solid #ccc;"></div>

                        <div class="color-option" data-color="#000000" style="background-color: #000000;"></div>

                    </div>

                    <button class="cancel-btn">Cancel</button>

                </div>

            `;

            

            // Insert after the profile-info div, before the toggle switch

            const profileInfo = textColorsModule.querySelector('.profile-info');

            const toggleSwitch = textColorsModule.querySelector('.toggle-switch');

            textColorsModule.insertBefore(colorPicker, toggleSwitch);

            

            // Add event listeners to color options

            const colorOptions = colorPicker.querySelectorAll('.color-option');

            colorOptions.forEach(option => {

                option.addEventListener('click', (e) => {

                    const color = e.target.dataset.color;

                    this.applyTextColor(color);

                    

                    // Update selected state

                    colorOptions.forEach(opt => opt.classList.remove('selected'));

                    e.target.classList.add('selected');

                });

            });

            

            // Add event listener to cancel button

            const cancelBtn = colorPicker.querySelector('.cancel-btn');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.resetTextColors();

                    this.hideTextColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-text-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-text-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Text color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-text-colors module');

        }

    }



    hideTextColorPicker() {

        const colorPicker = this.shadowRoot.getElementById('text-color-picker');

        if (colorPicker) {

            colorPicker.remove();

            console.log('Accessibility Widget: Text color picker hidden');

        }

    }



    applyTextColor(color) {

        console.log('Accessibility Widget: Applying text color:', color);

        

        // Apply color to all text elements except buttons, headings, and links

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b');

        

        textElements.forEach(element => {

            // Skip if element is inside a button, heading, link, or accessibility panel

            if (!element.closest('button, h1, h2, h3, h4, h5, h6, a, .btn, .accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = color;

            }

        });

        

        // Apply color to menu text specifically (but not accessibility panel menu)

        const menuElements = document.querySelectorAll('.nav-menu li a, .navbar a, nav a, .menu a, .nav-item a');

        menuElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = color;

            }

        });

        

        // Store the selected color

        this.selectedTextColor = color;

        console.log('Accessibility Widget: Text color applied to elements (excluding accessibility panel)');

    }



    resetTextColors() {

        console.log('Accessibility Widget: Resetting text colors');

        

        // Remove custom text colors

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b');

        textElements.forEach(element => {

            if (!element.closest('button, h1, h2, h3, h4, h5, h6, a, .btn, .accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = '';

            }

        });

        

        // Reset menu colors (but not accessibility panel menu)

        const menuElements = document.querySelectorAll('.nav-menu li a, .navbar a, nav a, .menu a, .nav-item a');

        menuElements.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = '';

            }

        });

        

        this.selectedTextColor = null;

        console.log('Accessibility Widget: Text colors reset (excluding accessibility panel)');

    }



    // Title Color Picker Methods

    showTitleColorPicker() {

        console.log('Accessibility Widget: showTitleColorPicker called');

        

        // Remove existing color picker if any

        this.hideTitleColorPicker();

        

        // Find the adjust-title-colors module in the panel

        const titleColorsModule = this.shadowRoot.querySelector('#adjust-title-colors').closest('.profile-item');

        

        if (titleColorsModule) {

            // Create color picker content

            const colorPicker = document.createElement('div');

            colorPicker.id = 'title-color-picker';

            colorPicker.className = 'color-picker-inline';

            colorPicker.innerHTML = `

                <div class="color-picker-content">

                    <h4>Adjust Title Colors</h4>

                    <div class="color-options">

                        <div class="color-option" data-color="#3b82f6" style="background-color: #3b82f6;"></div>

                        <div class="color-option" data-color="#8b5cf6" style="background-color: #8b5cf6;"></div>

                        <div class="color-option" data-color="#ef4444" style="background-color: #ef4444;"></div>

                        <div class="color-option selected" data-color="#f97316" style="background-color: #f97316;"></div>

                        <div class="color-option" data-color="#14b8a6" style="background-color: #14b8a6;"></div>

                        <div class="color-option" data-color="#84cc16" style="background-color: #84cc16;"></div>

                        <div class="color-option" data-color="#ffffff" style="background-color: #ffffff; border: 1px solid #ccc;"></div>

                        <div class="color-option" data-color="#000000" style="background-color: #000000;"></div>

                    </div>

                    <button class="cancel-btn">Cancel</button>

                </div>

            `;

            

            // Insert after the profile-info div, before the toggle switch

            const profileInfo = titleColorsModule.querySelector('.profile-info');

            const toggleSwitch = titleColorsModule.querySelector('.toggle-switch');

            titleColorsModule.insertBefore(colorPicker, toggleSwitch);

            

            // Add event listeners to color options

            const colorOptions = colorPicker.querySelectorAll('.color-option');

            colorOptions.forEach(option => {

                option.addEventListener('click', (e) => {

                    const color = e.target.dataset.color;

                    this.applyTitleColor(color);

                    

                    // Update selected state

                    colorOptions.forEach(opt => opt.classList.remove('selected'));

                    e.target.classList.add('selected');

                });

            });

            

            // Add event listener to cancel button

            const cancelBtn = colorPicker.querySelector('.cancel-btn');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.resetTitleColors();

                    this.hideTitleColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-title-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-title-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Title color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-title-colors module');

        }

    }



    hideTitleColorPicker() {

        const colorPicker = this.shadowRoot.getElementById('title-color-picker');

        if (colorPicker) {

            colorPicker.remove();

            console.log('Accessibility Widget: Title color picker hidden');

        }

    }



    applyTitleColor(color) {

        console.log('Accessibility Widget: Applying title color:', color);

        

        // Apply color to all heading elements except accessibility panel

        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        

        headingElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = color;

            }

        });

        

        // Store the selected color

        this.selectedTitleColor = color;

        console.log('Accessibility Widget: Title color applied to', headingElements.length, 'elements (excluding accessibility panel)');

    }



    resetTitleColors() {

        console.log('Accessibility Widget: Resetting title colors');

        

        // Remove custom title colors

        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headingElements.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.color = '';

            }

        });

        

        this.selectedTitleColor = null;

        console.log('Accessibility Widget: Title colors reset (excluding accessibility panel)');

    }



    // Background Color Picker Methods

    showBackgroundColorPicker() {

        console.log('Accessibility Widget: showBackgroundColorPicker called');

        

        // Remove existing color picker if any

        this.hideBackgroundColorPicker();

        

        // Find the adjust-bg-colors module in the panel

        const bgColorsModule = this.shadowRoot.querySelector('#adjust-bg-colors').closest('.profile-item');

        

        if (bgColorsModule) {

            // Create color picker content

            const colorPicker = document.createElement('div');

            colorPicker.id = 'bg-color-picker';

            colorPicker.className = 'color-picker-inline';

            colorPicker.innerHTML = `

                <div class="color-picker-content">

                    <h4>Adjust Background Colors</h4>

                    <div class="color-options">

                        <div class="color-option" data-color="#3b82f6" style="background-color: #3b82f6;"></div>

                        <div class="color-option" data-color="#8b5cf6" style="background-color: #8b5cf6;"></div>

                        <div class="color-option" data-color="#ef4444" style="background-color: #ef4444;"></div>

                        <div class="color-option selected" data-color="#f97316" style="background-color: #f97316;"></div>

                        <div class="color-option" data-color="#14b8a6" style="background-color: #14b8a6;"></div>

                        <div class="color-option" data-color="#84cc16" style="background-color: #84cc16;"></div>

                        <div class="color-option" data-color="#ffffff" style="background-color: #ffffff; border: 1px solid #ccc;"></div>

                        <div class="color-option" data-color="#000000" style="background-color: #000000;"></div>

                    </div>

                    <button class="cancel-btn" onclick="accessibilityWidget.hideBackgroundColorPicker()">Cancel</button>

                </div>

            `;

            

            // Insert after the profile-info div, before the toggle switch

            const profileInfo = bgColorsModule.querySelector('.profile-info');

            const toggleSwitch = bgColorsModule.querySelector('.toggle-switch');

            bgColorsModule.insertBefore(colorPicker, toggleSwitch);

            

            // Add event listeners to color options

            const colorOptions = colorPicker.querySelectorAll('.color-option');

            colorOptions.forEach(option => {

                option.addEventListener('click', (e) => {

                    const color = e.target.dataset.color;

                    this.applyBackgroundColor(color);

                    

                    // Update selected state

                    colorOptions.forEach(opt => opt.classList.remove('selected'));

                    e.target.classList.add('selected');

                });

            });

            

            // Add event listener to cancel button

            const cancelBtn = colorPicker.querySelector('.cancel-btn');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.resetBackgroundColors();

                    this.hideBackgroundColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-bg-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-bg-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Background color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-bg-colors module');

        }

    }



    hideBackgroundColorPicker() {

        const existingPicker = this.shadowRoot.querySelector('.bg-color-picker-controls');

        if (existingPicker) {

            existingPicker.remove();

            console.log('Accessibility Widget: Background color picker hidden');

        }

    }



    applyBackgroundColor(color) {

        console.log('Accessibility Widget: Applying background color:', color);

        

        // Apply background color only to specific content areas, not the entire page

        const mainContentAreas = document.querySelectorAll('section, article, main, .container, .hero, .about, .services, .test-section, .hero-content, .about-content, .services-grid, .service-card, .test-block, .contact-form, .contact-info');

        

        mainContentAreas.forEach(element => {

            // Skip accessibility panel elements

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                // Apply background color to specific content areas only

                element.style.backgroundColor = color;

            }

        });

        

        // Also apply to any remaining elements that might have backgrounds

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            // Skip accessibility panel elements and elements that already have the color

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon') && 

                element.style.backgroundColor !== color) {

                

                // Check if element has a background that's not transparent

                const computedStyle = window.getComputedStyle(element);

                const bgColor = computedStyle.backgroundColor;

                

                // If element has a background that's not transparent, apply our color

                if (bgColor !== 'rgba(0, 0, 0, 0)' && 

                    bgColor !== 'transparent' && 

                    bgColor !== color &&

                    !element.classList.contains('color-option') && // Don't change color picker colors

                    !element.classList.contains('cancel-btn')) { // Don't change button colors

                    element.style.backgroundColor = color;

                }

            }

        });

        

        // Store the selected color

        this.selectedBackgroundColor = color;

        this.settings['bg-color'] = color;

        this.settings['adjust-bg-colors'] = true;

        this.saveSettings();

        console.log('Accessibility Widget: Background color applied to entire website');

    }



    resetBackgroundColors() {

        console.log('Accessibility Widget: Resetting background colors');

        

        // Reset html and body background

        document.documentElement.style.backgroundColor = '';

        document.body.style.backgroundColor = '';

        

        // Reset all main content areas

        const mainContentAreas = document.querySelectorAll('html, body, div, section, article, main, aside, header, footer, nav, .container, .hero, .about, .services, .test-section, .hero-content, .about-content, .services-grid, .service-card, .test-block');

        

        mainContentAreas.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.backgroundColor = '';

            }

        });

        

        // Reset all other elements that might have been changed

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon') &&

                !element.classList.contains('color-option') && 

                !element.classList.contains('cancel-btn')) {

                // Reset if we applied a background color to it

                if (element.style.backgroundColor && element.style.backgroundColor !== '') {

                    element.style.backgroundColor = '';

                }

            }

        });

        

        this.selectedBackgroundColor = null;

        this.settings['adjust-bg-colors'] = false;

        this.settings['bg-color'] = null;

        this.saveSettings();

        console.log('Accessibility Widget: Background colors reset for entire website');

    }



    // Mute Sound Methods

    enableMuteSound() {

        console.log('Accessibility Widget: Mute sound enabled');

        

        // Find all audio and video elements

        const audioElements = document.querySelectorAll('audio');

        const videoElements = document.querySelectorAll('video');

        

        // Store original volume and set volume to 0 (allows playback but no sound)

        this.originalVolumeStates = new Map();

        

        audioElements.forEach((element, index) => {

            this.originalVolumeStates.set(`audio-${index}`, element.volume);

            element.volume = 0;

        });

        

        videoElements.forEach((element, index) => {

            this.originalVolumeStates.set(`video-${index}`, element.volume);

            element.volume = 0;

        });

        

        console.log(`Accessibility Widget: Set volume to 0 for ${audioElements.length} audio and ${videoElements.length} video elements`);

    }



    disableMuteSound() {

        console.log('Accessibility Widget: Mute sound disabled');

        

        // Restore original volume states

        if (this.originalVolumeStates) {

            const audioElements = document.querySelectorAll('audio');

            const videoElements = document.querySelectorAll('video');

            

            audioElements.forEach((element, index) => {

                const originalVolume = this.originalVolumeStates.get(`audio-${index}`);

                if (originalVolume !== undefined) {

                    element.volume = originalVolume;

                }

            });

            

            videoElements.forEach((element, index) => {

                const originalVolume = this.originalVolumeStates.get(`video-${index}`);

                if (originalVolume !== undefined) {

                    element.volume = originalVolume;

                }

            });

            

            this.originalVolumeStates.clear();

        }

        

        console.log('Accessibility Widget: Restored original audio/video volume states');

    }

    // Hide Images Methods
    enableHideImages() {
        this.settings['hide-images'] = true;
        document.body.classList.add('hide-images');
        
        // Add CSS rules for hiding images if not already added
        if (!document.getElementById('hide-images-css')) {
            const style = document.createElement('style');
            style.id = 'hide-images-css';
            style.textContent = `
                .hide-images img {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                .hide-images picture {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                .hide-images svg {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                .hide-images video {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                .hide-images canvas {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                .hide-images [style*="background-image"] {
                    background-image: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Hide images enabled');
    }

    disableHideImages() {
        this.settings['hide-images'] = false;
        document.body.classList.remove('hide-images');
        
        // Remove CSS rules for hiding images
        const existingStyle = document.getElementById('hide-images-css');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Hide images disabled');
    }

    // Read Mode Methods

    enableReadMode() {

        console.log('Accessibility Widget: Read mode enabled');

        

        // Remove existing read mode if any

        this.disableReadMode();

        

        // Extract content from the website

        const content = this.extractTextContent();

        console.log('Read Mode: Extracted content length:', content.length);

        console.log('Read Mode: Extracted content preview:', content.substring(0, 200));

        

        // If no content was extracted, use fallback content

        const finalContent = content || '<div style="padding: 20px; color: #666; font-size: 1.1em;">No content could be extracted from this page.</div>';

        

        // Create overlay with extracted content

        const overlayHTML = `

            <div id="read-mode-overlay" style="

                position: fixed !important;

                top: 0 !important;

                left: 0 !important;

                width: 100% !important;

                height: 100% !important;

                background: #e8f4f8 !important;

                z-index: 99997 !important;

                overflow-y: auto !important;

                padding: 20px !important;

                font-family: Arial, sans-serif !important;

                display: block !important;

            ">

                <div style="max-width: 800px; margin: 0 auto; padding-top: 60px;">

                    ${finalContent}

                </div>

            </div>

        `;

        

        // Insert the HTML directly into the body

        document.body.insertAdjacentHTML('beforeend', overlayHTML);

        

        // Verify the overlay was created

        const overlay = document.getElementById('read-mode-overlay');

        if (overlay) {

            console.log('Accessibility Widget: Read mode overlay successfully created and found in DOM');

            console.log('Accessibility Widget: Overlay z-index:', window.getComputedStyle(overlay).zIndex);

            console.log('Accessibility Widget: Overlay background:', window.getComputedStyle(overlay).backgroundColor);

        } else {

            console.error('Accessibility Widget: Read mode overlay was NOT created!');

        }

        

        console.log('Accessibility Widget: Read mode overlay created with direct HTML');

    }



    extractTextContent() {

        console.log('Read Mode: Starting content extraction...');

        

        let content = '';

        

        // Get all content elements in document order - focus on actual content elements

        const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, img, button');

        console.log('Read Mode: Found elements:', allElements.length);

        console.log('Read Mode: Document body:', document.body);

        console.log('Read Mode: Document ready state:', document.readyState);

        

        // Process elements in the order they appear on the page

        let processedCount = 0;

        allElements.forEach(element => {

            // Skip accessibility widget elements

            if (element.closest('.accessibility-panel') || element.closest('#accessibility-icon')) {

                console.log('Read Mode: Skipping accessibility widget element:', element);

                return;

            }

            

            const tagName = element.tagName.toLowerCase();

            const text = element.textContent.trim();

            console.log('Read Mode: Processing element:', tagName, 'text:', text.substring(0, 50));

            

            if (tagName.match(/^h[1-6]$/)) {

                // Headings

                if (text) {

                    const size = tagName === 'h1' ? '2.5em' : 

                               tagName === 'h2' ? '2em' : 

                               tagName === 'h3' ? '1.5em' : '1.2em';

                    content += `<div style="margin: 20px 0; font-size: ${size}; font-weight: bold; color: #333; line-height: 1.3;">${text}</div>`;

                    processedCount++;

                }

            } else if (tagName === 'p') {

                // Paragraphs

                if (text && text.length > 5) {

                    content += `<div style="margin: 15px 0; font-size: 1.1em; line-height: 1.6; color: #444;">${text}</div>`;

                    processedCount++;

                }

            } else if (tagName === 'a' && element.href) {

                // Links

                if (text) {

                    content += `<div style="margin: 10px 0; font-size: 1em; color: #0066cc; text-decoration: underline;">${text}</div>`;

                    processedCount++;

                }

            } else if (tagName === 'img' && element.src) {

                // Images

                const src = element.src;

                const alt = element.alt || '';

                content += `<div style="margin: 20px 0; text-align: center;">

                    <img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />

                    ${alt ? `<div style="margin-top: 8px; font-size: 0.9em; color: #666; font-style: italic;">${alt}</div>` : ''}

                </div>`;

                processedCount++;

            } else if (tagName === 'button' && text) {

                // Buttons

                content += `<div style="margin: 10px 0; font-size: 1em; color: #333; font-weight: 500;">[Button] ${text}</div>`;

                processedCount++;

            }

        });

        

        // If no content was extracted, show a message

        if (!content) {

            content = '<div style="text-align: center; padding: 40px; color: #6b7280;">' +

                '<h2 style="color: #374151;">No readable content found</h2>' +

                '<p>This page may not have extractable text content.</p>' +

                '</div>';

        }

        

        console.log('Read Mode: Content extraction completed. Processed elements:', processedCount, 'Content length:', content.length);

        return content;

    }



    disableReadMode() {

        console.log('Accessibility Widget: Read mode disabled');

        

        const readModeOverlay = document.getElementById('read-mode-overlay');

        if (readModeOverlay) {

            readModeOverlay.remove();

            console.log('Accessibility Widget: Read mode overlay removed');

        } else {

            console.log('Accessibility Widget: No read mode overlay found to remove');

        }

        

        // Force a reflow to ensure the overlay is completely removed

        document.body.offsetHeight;

    }



    // Reading Guide Methods

    enableReadingGuide() {

        console.log('Accessibility Widget: Reading guide enabled');

        

        // Remove existing reading guide if any

        this.disableReadingGuide();

        

        // Add reading guide styles

        const style = document.createElement('style');

        style.id = 'reading-guide-styles';

        style.textContent = `

            .reading-guide {

                position: relative;

            }

            

            .reading-guide-active {

                cursor: none;

            }

            

            .reading-guide-bar {

                position: fixed;

                width: 200px;

                height: 4px;

                background: linear-gradient(90deg, rgba(99, 102, 241, 0.8), rgba(99, 102, 241, 0.4));

                border-radius: 2px;

                pointer-events: none;

                z-index: 100000;

                transition: all 0.1s ease;

                box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);

            }

        `;

        document.head.appendChild(style);

        

        // Create reading guide bar

        const readingGuideBar = document.createElement('div');

        readingGuideBar.id = 'reading-guide-bar';

        readingGuideBar.className = 'reading-guide-bar';

        document.body.appendChild(readingGuideBar);

        

        // Add mouse move event listener

        this.readingGuideMouseMoveHandler = (e) => {

            const x = e.clientX - 100; // Center the bar on cursor (half of 200px width)

            const y = e.clientY - 2; // Center vertically (half of 4px height)

            

            // Keep bar within viewport bounds

            const maxX = window.innerWidth - 200;

            const maxY = window.innerHeight - 4;

            const clampedX = Math.max(0, Math.min(x, maxX));

            const clampedY = Math.max(0, Math.min(y, maxY));

            

            readingGuideBar.style.left = clampedX + 'px';

            readingGuideBar.style.top = clampedY + 'px';

        };

        

        document.addEventListener('mousemove', this.readingGuideMouseMoveHandler);

        document.body.classList.add('reading-guide-active');

        

        console.log('Accessibility Widget: Reading guide bar created');

    }



    disableReadingGuide() {

        console.log('Accessibility Widget: Reading guide disabled');

        

        // Remove reading guide bar

        const readingGuideBar = document.getElementById('reading-guide-bar');

        if (readingGuideBar) {

            readingGuideBar.remove();

        }

        

        // Remove styles

        const style = document.getElementById('reading-guide-styles');

        if (style) {

            style.remove();

        }

        

        // Remove event listener

        if (this.readingGuideMouseMoveHandler) {

            document.removeEventListener('mousemove', this.readingGuideMouseMoveHandler);

            this.readingGuideMouseMoveHandler = null;

        }

        

        document.body.classList.remove('reading-guide-active');

        console.log('Accessibility Widget: Reading guide removed');

    }



    // Highlight Focus Methods

    enableHighlightFocus() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#highlight-focus');

        if (toggle) {

            toggle.checked = true;

        }

        

        document.body.classList.add('highlight-focus');

        console.log('Accessibility Widget: Highlight focus enabled');

        console.log('Accessibility Widget: Body classes:', document.body.className);

        

        // Apply focus styles to currently focused element if any

        const activeElement = document.activeElement;

        if (activeElement && activeElement !== document.body && activeElement !== document.documentElement) {

            // Only apply to interactive elements

            const isInteractiveElement = activeElement.tagName === 'A' || 

                                      activeElement.tagName === 'BUTTON' || 

                                      activeElement.tagName === 'INPUT' || 

                                      activeElement.tagName === 'SELECT' || 

                                      activeElement.tagName === 'TEXTAREA' ||

                                      activeElement.hasAttribute('tabindex') ||

                                      activeElement.hasAttribute('role') ||

                                      activeElement.isContentEditable;

            

            // Apply to interactive elements not inside the panel (allow the icon itself)

            if (!activeElement.closest('.accessibility-panel') && 

                isInteractiveElement) {

                console.log('Accessibility Widget: Applying focus styles to currently focused element:', activeElement);

                activeElement.style.outline = '3px solid #6366f1';

                activeElement.style.outlineOffset = '2px';

                activeElement.style.background = 'rgba(99, 102, 241, 0.1)';

                activeElement.style.borderRadius = '4px';

                activeElement.style.transition = 'outline 0.2s ease, background 0.2s ease';

                

                // Track the currently focused element

                this.currentlyFocusedElement = activeElement;

            }

        }

        

        // Add a global focus event listener to ensure immediate application of styles

        this.highlightFocusHandler = (e) => {

            console.log('Accessibility Widget: Focus event triggered on:', e.target);

            console.log('Accessibility Widget: Body has highlight-focus class:', document.body.classList.contains('highlight-focus'));
            console.log('Accessibility Widget: Is keyboard navigation:', this.isKeyboardNavigation);
            console.log('Accessibility Widget: Last interaction method:', this.lastInteractionMethod);
            
            // Special debugging for accessibility icon
            if (e.target.classList && e.target.classList.contains('accessibility-icon')) {
                console.log('🎯 [FOCUS] Accessibility icon focused!');
                console.log('🎯 [FOCUS] Icon classes:', e.target.className);
                console.log('🎯 [FOCUS] Icon ID:', e.target.id);
                console.log('🎯 [FOCUS] Body has highlight-focus:', document.body.classList.contains('highlight-focus'));
                console.log('🎯 [FOCUS] Is keyboard navigation:', this.isKeyboardNavigation);
                console.log('🎯 [FOCUS] Applying focus styles to accessibility icon');
                
                // Always apply focus styles to accessibility icon when focused
                e.target.style.outline = '3px solid #6366f1';
                e.target.style.outlineOffset = '2px';
                e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                e.target.style.borderRadius = '4px';
                e.target.style.transition = 'outline 0.2s ease, background 0.2s ease';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                return; // Exit early to prevent other focus handling
            }

            if (document.body.classList.contains('highlight-focus') && this.isKeyboardNavigation) {

                const focusedElement = e.target;

                

                // Only apply to interactive elements that can actually receive focus

                const isInteractiveElement = focusedElement.tagName === 'A' || 

                                          focusedElement.tagName === 'BUTTON' || 

                                          focusedElement.tagName === 'INPUT' || 

                                          focusedElement.tagName === 'SELECT' || 

                                          focusedElement.tagName === 'TEXTAREA' ||

                                          focusedElement.hasAttribute('tabindex') ||

                                          focusedElement.hasAttribute('role') ||

                                          focusedElement.isContentEditable;

                

                // Skip if element is not interactive or is part of accessibility panel (but allow accessibility icon)

                if (focusedElement === document.body || 

                    focusedElement === document.documentElement ||

                    focusedElement.closest('.accessibility-panel') ||

                    !isInteractiveElement) {

                    return;

                }

                

                // Remove focus styles from previously focused element

                if (this.currentlyFocusedElement && this.currentlyFocusedElement !== focusedElement) {

                    console.log('Accessibility Widget: Removing focus styles from previous element:', this.currentlyFocusedElement);

                    this.currentlyFocusedElement.style.outline = '';

                    this.currentlyFocusedElement.style.outlineOffset = '';

                    this.currentlyFocusedElement.style.background = '';

                    this.currentlyFocusedElement.style.borderRadius = '';

                    this.currentlyFocusedElement.style.transition = '';

                }

                

                // Apply focus styles to new focused element

                console.log('Accessibility Widget: Interactive element focused, applying styles:', focusedElement);

                focusedElement.style.outline = '3px solid #6366f1';

                focusedElement.style.outlineOffset = '2px';

                focusedElement.style.background = 'rgba(99, 102, 241, 0.1)';

                focusedElement.style.borderRadius = '4px';

                focusedElement.style.transition = 'outline 0.2s ease, background 0.2s ease';

                

                // Track the currently focused element

                this.currentlyFocusedElement = focusedElement;

            }

        };

        

        // Add the focus event listener

        document.addEventListener('focusin', this.highlightFocusHandler, true);
        
        // Add focusout handler to clean up accessibility icon styles
        this.highlightFocusOutHandler = (e) => {
            if (e.target.classList && e.target.classList.contains('accessibility-icon')) {
                console.log('🎯 [FOCUS] Accessibility icon lost focus - removing styles');
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
                e.target.style.background = '';
                e.target.style.borderRadius = '';
                e.target.style.transition = '';
            }
        };
        
        document.addEventListener('focusout', this.highlightFocusOutHandler, true);

        console.log('Accessibility Widget: Focus event listener added');

        console.log('Accessibility Widget: highlightFocusHandler:', this.highlightFocusHandler);

        

        // Test if the feature is working by checking if we can find focusable elements

        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex], [role]');

        console.log('Accessibility Widget: Found', focusableElements.length, 'focusable elements');

        

        // Force a test focus on the first focusable element if any

        if (focusableElements.length > 0) {

            console.log('Accessibility Widget: First focusable element:', focusableElements[0]);

        }

    }



    disableHighlightFocus() {

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#highlight-focus');

        if (toggle) {

            toggle.checked = false;

        }

        

        document.body.classList.remove('highlight-focus');

        console.log('Accessibility Widget: Highlight focus disabled');

        

        // Remove focus styles from the currently tracked focused element

        if (this.currentlyFocusedElement) {

            console.log('Accessibility Widget: Removing focus styles from currently focused element:', this.currentlyFocusedElement);

            this.currentlyFocusedElement.style.outline = '';

            this.currentlyFocusedElement.style.outlineOffset = '';

            this.currentlyFocusedElement.style.background = '';

            this.currentlyFocusedElement.style.borderRadius = '';

            this.currentlyFocusedElement.style.transition = '';

            this.currentlyFocusedElement = null;

        }

        

        // Also remove any remaining focus styles from all elements as a safety measure

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            // Skip accessibility widget elements

            if (element.closest('.accessibility-panel') || element.closest('#accessibility-icon')) {

                return;

            }

            

            // Remove focus-related inline styles

            if (element.style.outline && element.style.outline.includes('6366f1')) {

                console.log('Accessibility Widget: Removing remaining focus styles from element:', element);

                element.style.outline = '';

                element.style.outlineOffset = '';

                element.style.background = '';

                element.style.borderRadius = '';

                element.style.transition = '';

            }

        });

        

        // Remove the focus event listener

        if (this.highlightFocusHandler) {

            document.removeEventListener('focusin', this.highlightFocusHandler, true);

            this.highlightFocusHandler = null;

        }
        
        // Remove the focusout handler
        if (this.highlightFocusOutHandler) {
            document.removeEventListener('focusout', this.highlightFocusOutHandler, true);
            this.highlightFocusOutHandler = null;
        }

        

        // Also remove the CSS class from body to ensure complete cleanup

        document.body.classList.remove('highlight-focus');

    }



    showStatement() {
        console.log('Accessibility Widget: Statement button clicked');
        console.log('Accessibility Widget: Customization data:', this.customizationData);
        console.log('Accessibility Widget: Full customization data keys:', this.customizationData ? Object.keys(this.customizationData) : 'No customization data');
        
        // Check if we have a custom accessibility statement link
        if (this.customizationData && this.customizationData.accessibilityStatementLink) {
            console.log('Accessibility Widget: Opening custom statement link:', this.customizationData.accessibilityStatementLink);
            console.log('Accessibility Widget: Link validation:', {
                hasLink: !!this.customizationData.accessibilityStatementLink,
                linkLength: this.customizationData.accessibilityStatementLink.length,
                linkValue: this.customizationData.accessibilityStatementLink
            });
            
            // Validate the link before opening
            if (this.customizationData.accessibilityStatementLink.trim() !== '') {
                window.open(this.customizationData.accessibilityStatementLink, '_blank');
            } else {
                console.log('Accessibility Widget: Statement link is empty, showing default alert');
        alert('This website is committed to providing an accessible experience for all users. We follow WCAG 2.1 guidelines and continuously work to improve accessibility.');
            }
        } else {
            console.log('Accessibility Widget: No custom statement link found, showing default alert');
            console.log('Accessibility Widget: Debug info:', {
                hasCustomizationData: !!this.customizationData,
                hasStatementLink: !!(this.customizationData && this.customizationData.accessibilityStatementLink),
                statementLinkValue: this.customizationData ? this.customizationData.accessibilityStatementLink : 'No customization data'
            });

        }
    }





    enableReadableFont() {
        this.settings['readable-font'] = true;
        document.body.classList.add('readable-font');
        
        // Also add to the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.add('readable-font');
        }
        
        // Add CSS rules for readable font if not already added
        if (!document.getElementById('readable-font-css')) {
            const style = document.createElement('style');
            style.id = 'readable-font-css';
            style.textContent = `
                .readable-font {
                    font-family: 'Arial', 'Open Sans', 'Helvetica', sans-serif !important;
                }
                
                .readable-font * {
                    font-family: 'Arial', 'Open Sans', 'Helvetica', sans-serif !important;
                    font-weight: 500 !important;
                    letter-spacing: 0.5px !important;
                }
                
                .readable-font h1,
                .readable-font h2,
                .readable-font h3,
                .readable-font h4,
                .readable-font h5,
                .readable-font h6 {
                    font-family: 'Arial', 'Open Sans', 'Helvetica', sans-serif !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.8px !important;
                }
                
                .readable-font p,
                .readable-font span,
                .readable-font div,
                .readable-font li,
                .readable-font td,
                .readable-font th,
                .readable-font label,
                .readable-font small,
                .readable-font em,
                .readable-font strong,
                .readable-font i,
                .readable-font b,
                .readable-font a,
                .readable-font button,
                .readable-font input,
                .readable-font textarea,
                .readable-font select {
                    font-family: 'Arial', 'Open Sans', 'Helvetica', sans-serif !important;
                    font-weight: 500 !important;
                    letter-spacing: 0.5px !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Readable font enabled');
    }



    disableReadableFont() {
        this.settings['readable-font'] = false;
        document.body.classList.remove('readable-font');
        
        // Also remove from the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.remove('readable-font');
        }
        
        // Remove CSS rules for readable font
        const existingStyle = document.getElementById('readable-font-css');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        this.saveSettings();
        console.log('Accessibility Widget: Readable font disabled');
    }



    // Text Alignment Methods

    enableAlignLeft() {

        // First, completely clear all alignment classes
        this.clearAllAlignmentClasses();

        this.settings['align-left'] = true;

        document.body.classList.add('align-left');

        // Also add to the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.add('align-left');
        }

        this.saveSettings();

        console.log('Accessibility Widget: Align left enabled');

    }



    disableAlignLeft() {

        this.settings['align-left'] = false;

        document.body.classList.remove('align-left');

        // Also remove from the widget host element

        if (this.shadowRoot && this.shadowRoot.host) {

            this.shadowRoot.host.classList.remove('align-left');

        }

        this.saveSettings();

        console.log('Accessibility Widget: Align left disabled');

    }



    enableAlignCenter() {

        // First, completely clear all alignment classes
        this.clearAllAlignmentClasses();

        this.settings['align-center'] = true;

        document.body.classList.add('align-center');

        // Also add to the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.add('align-center');
        }

        this.saveSettings();

        console.log('Accessibility Widget: Align center enabled');

    }



    disableAlignCenter() {

        this.settings['align-center'] = false;

        document.body.classList.remove('align-center');

        // Also remove from the widget host element

        if (this.shadowRoot && this.shadowRoot.host) {

            this.shadowRoot.host.classList.remove('align-center');

        }

        this.saveSettings();

        console.log('Accessibility Widget: Align center disabled');

    }



    enableAlignRight() {

        // First, completely clear all alignment classes
        this.clearAllAlignmentClasses();

        this.settings['align-right'] = true;

        document.body.classList.add('align-right');

        // Also add to the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.add('align-right');
        }

        this.saveSettings();

        console.log('Accessibility Widget: Align right enabled');

    }



    disableAlignRight() {

        this.settings['align-right'] = false;

        document.body.classList.remove('align-right');

        // Also remove from the widget host element
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.remove('align-right');
        }

        this.saveSettings();

        console.log('Accessibility Widget: Align right disabled');

    }

    // Helper method to clear all alignment classes
    clearAllAlignmentClasses() {
        // Remove all alignment classes from body
        document.body.classList.remove('align-left', 'align-center', 'align-right');
        
        // Remove all alignment classes from widget host
        if (this.shadowRoot && this.shadowRoot.host) {
            this.shadowRoot.host.classList.remove('align-left', 'align-center', 'align-right');
        }
        
        // Reset all alignment settings
        this.settings['align-left'] = false;
        this.settings['align-center'] = false;
        this.settings['align-right'] = false;
        
        console.log('Accessibility Widget: Cleared all alignment classes');
    }



    // Big Black Cursor Methods

    enableBigBlackCursor() {

        console.log('Accessibility Widget: Big black cursor enabled');

        

        // Disable white cursor first to avoid conflicts

        if (this.settings['big-white-cursor']) {

            document.body.classList.remove('big-white-cursor');

            this.settings['big-white-cursor'] = false;

            // Update toggle switch

            const whiteToggle = this.shadowRoot.getElementById('big-white-cursor');

            if (whiteToggle) whiteToggle.checked = false;

        }

        

        document.body.classList.add('big-black-cursor');

        this.applyBigBlackCursor();

        this.settings['big-black-cursor'] = true;

        this.saveSettings();

    }

    

    applyBigBlackCursor() {

        // Force apply cursor style with JavaScript to override any conflicts
        const cursorUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 0 L0 40 L12 28 L20 36 L24 32 L16 24 L40 24" fill="black" stroke="white" stroke-width="2"/></svg>';
        
        // Apply to body
        document.body.style.setProperty('cursor', `url('${cursorUrl}') 0 0, auto`, 'important');
        
        // Apply to all elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.setProperty('cursor', `url('${cursorUrl}') 0 0, auto`, 'important');
        });

        console.log('Accessibility Widget: Big black cursor applied via JavaScript');

    }



    disableBigBlackCursor() {

        console.log('Accessibility Widget: Big black cursor disabled');

        document.body.classList.remove('big-black-cursor');

        this.resetBigBlackCursor();

        this.settings['big-black-cursor'] = false;

        this.saveSettings();

        

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#big-black-cursor');

        if (toggle) {

            toggle.checked = false;

        }

        

        // Check if both cursor features are disabled and refresh page

        this.checkAndRefreshForCursorReset();

        

        console.log('Accessibility Widget: Big black cursor fully disabled and reset');

    }

    

    resetBigBlackCursor() {

        // Ensure the CSS class is removed from body

        document.body.classList.remove('big-black-cursor');

        

        // Also reset cursor on Shadow DOM host

        if (this.shadowRoot && this.shadowRoot.host) {

            this.shadowRoot.host.style.cursor = '';

        }

        

        // Force reset cursor on accessibility panel elements specifically

        const accessibilityElements = document.querySelectorAll('accessibility-widget, .accessibility-panel, #accessibility-icon');

        accessibilityElements.forEach(el => {

            el.style.cursor = 'auto';

        });

        

        // Force reset cursor on all elements to ensure no lingering styles

        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {

            if (el.style.cursor && el.style.cursor.includes('svg')) {

                el.style.cursor = '';

            }

        });

        

        console.log('Accessibility Widget: Big black cursor CSS class removed from body and Shadow DOM host reset');

    }



    // Big White Cursor Methods

    enableBigWhiteCursor() {

        console.log('Accessibility Widget: Big white cursor enabled');

        

        // Disable black cursor first to avoid conflicts

        if (this.settings['big-black-cursor']) {

            document.body.classList.remove('big-black-cursor');

            this.settings['big-black-cursor'] = false;

            // Update toggle switch

            const blackToggle = this.shadowRoot.getElementById('big-black-cursor');

            if (blackToggle) blackToggle.checked = false;

        }

        

        document.body.classList.add('big-white-cursor');

        this.applyBigWhiteCursor();

        this.settings['big-white-cursor'] = true;

        this.saveSettings();

    }

    

    applyBigWhiteCursor() {

        // Force apply cursor style with JavaScript to override any conflicts
        const cursorUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 0 L0 40 L12 28 L20 36 L24 32 L16 24 L40 24" fill="white" stroke="black" stroke-width="2"/></svg>';
        
        // Apply to body
        document.body.style.setProperty('cursor', `url('${cursorUrl}') 0 0, auto`, 'important');
        
        // Apply to all elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.setProperty('cursor', `url('${cursorUrl}') 0 0, auto`, 'important');
        });

        console.log('Accessibility Widget: Big white cursor applied via JavaScript');

    }



    disableBigWhiteCursor() {

        console.log('Accessibility Widget: Big white cursor disabled');

        document.body.classList.remove('big-white-cursor');

        this.resetBigWhiteCursor();

        this.settings['big-white-cursor'] = false;

        this.saveSettings();

        

        // Update toggle state

        const toggle = this.shadowRoot.querySelector('#big-white-cursor');

        if (toggle) {

            toggle.checked = false;

        }

        

        // Check if both cursor features are disabled and refresh page

        this.checkAndRefreshForCursorReset();

        

        console.log('Accessibility Widget: Big white cursor fully disabled and reset');

    }

    

    resetBigWhiteCursor() {

        // Ensure the CSS class is removed from body

        document.body.classList.remove('big-white-cursor');

        

        // Force reset cursor on body and document element

        document.body.style.cursor = '';

        document.documentElement.style.cursor = '';

        

        // Also reset cursor on Shadow DOM host

        if (this.shadowRoot && this.shadowRoot.host) {

            this.shadowRoot.host.style.cursor = '';

        }

        

        // Force reset cursor on accessibility panel elements specifically

        const accessibilityElements = document.querySelectorAll('accessibility-widget, .accessibility-panel, #accessibility-icon');

        accessibilityElements.forEach(el => {

            el.style.cursor = 'auto';

        });

        

        // Force reset cursor on all elements to ensure no lingering styles

        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {

            if (el.style.cursor && (el.style.cursor.includes('svg') || el.style.cursor.includes('white'))) {

                el.style.cursor = '';

            }

        });

        

        // Add a temporary CSS rule to override any remaining cursor styles

        const style = document.createElement('style');

        style.id = 'reset-cursor-styles';

        style.textContent = `

            /* Only apply auto cursor when big cursors are NOT active */
            body:not(.big-white-cursor):not(.big-black-cursor) .accessibility-panel *,
            body:not(.big-white-cursor):not(.big-black-cursor) .accessibility-widget *,
            body:not(.big-white-cursor):not(.big-black-cursor) #accessibility-widget * {

                cursor: auto !important;

            }

        `;

        document.head.appendChild(style);

        

        // Remove the temporary style after a short delay

        setTimeout(() => {

            const tempStyle = document.getElementById('reset-cursor-styles');

            if (tempStyle) {

                tempStyle.remove();

            }

        }, 2000);

        

        console.log('Accessibility Widget: Big white cursor CSS class removed from body and Shadow DOM host reset');

        

        // Additional comprehensive cursor reset

        this.forceResetAllCursors();

    }

    

    forceResetAllCursors() {

        // Reset cursor on all elements in the document

        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {

            if (el.style.cursor) {

                el.style.cursor = '';

            }

        });

        

        // Reset cursor on Shadow DOM elements

        if (this.shadowRoot) {

            const shadowElements = this.shadowRoot.querySelectorAll('*');

            shadowElements.forEach(el => {

                el.style.cursor = '';

            });

        }

        

        // Force normal cursor on body and document

        document.body.style.cursor = '';

        document.documentElement.style.cursor = '';

        

        console.log('Accessibility Widget: All cursors force reset to normal');

    }

    

    checkAndRefreshForCursorReset() {

        // Check if both cursor features are disabled

        const blackCursorDisabled = !this.settings['big-black-cursor'];

        const whiteCursorDisabled = !this.settings['big-white-cursor'];

        

        if (blackCursorDisabled && whiteCursorDisabled) {

            console.log('Accessibility Widget: Both cursor features disabled - refreshing page to reset cursor styles');

            

            // Refresh the page immediately without showing any message

            window.location.reload();

        }

    }

    

    showTemporaryMessage(message, duration = 2000) {

        // Create a temporary message element

        const messageEl = document.createElement('div');

        messageEl.style.cssText = `

            position: fixed;

            top: 50%;

            left: 50%;

            transform: translate(-50%, -50%);

            background: rgba(0, 0, 0, 0.8);

            color: white;

            padding: 15px 12px;

            border-radius: 8px;

            font-family: 'DM Sans', sans-serif;

            font-size: 14px;

            z-index: 1000000;

            pointer-events: none;

        `;

        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        

        // Remove the message after the specified duration

        setTimeout(() => {

            if (messageEl.parentNode) {

                messageEl.parentNode.removeChild(messageEl);

            }

        }, duration);

    }



    // Stop Animation Methods

    enableStopAnimation() {

        console.log('Accessibility Widget: Stop animation enabled');

        document.body.classList.add('stop-animation');

        this.settings['stop-animation'] = true;

        this.saveSettings();

        

        // Add CSS rules for stop animation if not already added

        if (!document.getElementById('stop-animation-css')) {

            const style = document.createElement('style');

            style.id = 'stop-animation-css';

            style.textContent = `

                .stop-animation *,

                .stop-animation *::before,

                .stop-animation *::after {

                    animation-duration: 0.01ms !important;

                    animation-iteration-count: 1 !important;

                    animation-delay: 0s !important;

                    transition-duration: 0.01ms !important;

                    scroll-behavior: auto !important;

                }

                

                .stop-animation * {

                    animation-play-state: paused !important;

                }

            `;

            document.head.appendChild(style);

        }

        

        // Stop any JavaScript-based animations (like the slider auto-slide)

        if (window.slider && typeof window.slider.disableAutoSlide === 'function') {

            console.log('Accessibility Widget: Calling slider.disableAutoSlide() for stop animation');

            window.slider.disableAutoSlide();

        } else {

            console.log('Accessibility Widget: Slider not found or disableAutoSlide method not available for stop animation');

            // Try again after a short delay in case slider is still initializing

            setTimeout(() => {

                if (window.slider && typeof window.slider.disableAutoSlide === 'function') {

                    console.log('Accessibility Widget: Retrying slider.disableAutoSlide() for stop animation');

                    window.slider.disableAutoSlide();

                }

            }, 100);

        }

    }



    disableStopAnimation() {

        console.log('Accessibility Widget: Stop animation disabled');

        document.body.classList.remove('stop-animation');

        this.settings['stop-animation'] = false;

        this.saveSettings();

        

        // Remove CSS rules for stop animation

        const existingStyle = document.getElementById('stop-animation-css');

        if (existingStyle) {

            existingStyle.remove();

        }

        

        // Resume JavaScript-based animations (like the slider auto-slide)

        if (window.slider && typeof window.slider.enableAutoSlide === 'function') {

            console.log('Accessibility Widget: Calling slider.enableAutoSlide() for stop animation');

            window.slider.enableAutoSlide();

        } else {

            console.log('Accessibility Widget: Slider not found or enableAutoSlide method not available for stop animation');

            // Try again after a short delay in case slider is still initializing

            setTimeout(() => {

                if (window.slider && typeof window.slider.enableAutoSlide === 'function') {

                    console.log('Accessibility Widget: Retrying slider.enableAutoSlide() for stop animation');

                    window.slider.enableAutoSlide();

                }

            }, 100);

        }

    }



    // Text Color Adjustment Methods

    showTextColorPicker() {

        console.log('Accessibility Widget: Showing text color picker');

        this.hideTextColorPicker();

        

        // Find the adjust-text-colors module in the panel

        const textColorsModule = this.shadowRoot.querySelector('#adjust-text-colors').closest('.profile-item');

        

        if (textColorsModule) {

            // Create color picker content with predefined color swatches

            const colorPickerHTML = `

                <div class="color-picker-controls" style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">

                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px; font-weight: bold;">Adjust Text Colors</h4>

                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">

                        <button class="color-swatch" data-color="#0066cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #0066cc; cursor: pointer; transition: transform 0.2s;" title="Blue"></button>

                        <button class="color-swatch" data-color="#6633cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #6633cc; cursor: pointer; transition: transform 0.2s;" title="Purple"></button>

                        <button class="color-swatch" data-color="#cc0000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #cc0000; cursor: pointer; transition: transform 0.2s;" title="Red"></button>

                        <button class="color-swatch" data-color="#ff6600" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ff6600; cursor: pointer; transition: transform 0.2s;" title="Orange"></button>

                        <button class="color-swatch" data-color="#00cccc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #00cccc; cursor: pointer; transition: transform 0.2s;" title="Teal"></button>

                        <button class="color-swatch" data-color="#669900" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #669900; cursor: pointer; transition: transform 0.2s;" title="Green"></button>

                        <button class="color-swatch" data-color="#ffffff" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ffffff; cursor: pointer; transition: transform 0.2s;" title="White"></button>

                        <button class="color-swatch" data-color="#000000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #000000; cursor: pointer; transition: transform 0.2s;" title="Black"></button>

                    </div>

                    <button id="cancel-text-color" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">

                        Cancel

                    </button>

                </div>

            `;

            

            // Insert the color picker after the profile item

            textColorsModule.insertAdjacentHTML('afterend', colorPickerHTML);

            

            // Add event listeners for color swatches

            const colorSwatches = this.shadowRoot.querySelectorAll('.color-swatch');

            colorSwatches.forEach(swatch => {

                swatch.addEventListener('click', (e) => {

                    const selectedColor = e.target.getAttribute('data-color');

                    this.applyTextColor(selectedColor);

                });

                

                // Add hover effect

                swatch.addEventListener('mouseenter', (e) => {

                    e.target.style.transform = 'scale(1.1)';

                });

                swatch.addEventListener('mouseleave', (e) => {

                    e.target.style.transform = 'scale(1)';

                });

            });

            

            // Add event listener for cancel button

            const cancelBtn = this.shadowRoot.getElementById('cancel-text-color');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.hideTextColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-text-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-text-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Text color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-text-colors module');

        }

    }



    hideTextColorPicker() {

        console.log('Accessibility Widget: Hiding text color picker');

        const existingPicker = this.shadowRoot.querySelector('.color-picker-controls');

        if (existingPicker) {

            existingPicker.remove();

        }

    }



    applyTextColor(color) {

        console.log('Accessibility Widget: Applying text color:', color);

        // Apply color to all text elements

        const textElements = document.querySelectorAll('p, span, div, a, li, td, th, label, button, input, textarea, select');

        textElements.forEach(element => {

            element.style.color = color;

        });

        

        // Save the applied color

        this.settings['text-color'] = color;

        this.settings['adjust-text-colors'] = true;

        this.saveSettings();

        

        console.log('Accessibility Widget: Text color applied to', textElements.length, 'elements');

    }



    resetTextColors() {

        console.log('Accessibility Widget: Resetting text colors');

        // Remove any custom text color styles

        const textElements = document.querySelectorAll('p, span, div, a, li, td, th, label, button, input, textarea, select');

        textElements.forEach(element => {

            if (element.style.color) {

                element.style.removeProperty('color');

            }

        });

        

        this.settings['adjust-text-colors'] = false;

        this.settings['text-color'] = null;

        this.saveSettings();

        console.log('Accessibility Widget: Text colors reset');

    }



    showTitleColorPicker() {

        console.log('Accessibility Widget: Showing title color picker');

        this.hideTitleColorPicker();

        

        // Find the adjust-title-colors module in the panel

        const titleColorsModule = this.shadowRoot.querySelector('#adjust-title-colors').closest('.profile-item');

        

        if (titleColorsModule) {

            // Create color picker content with predefined color swatches

            const colorPickerHTML = `

                <div class="title-color-picker-controls" style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">

                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px; font-weight: bold;">Adjust Title Colors</h4>

                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">

                        <button class="title-color-swatch" data-color="#0066cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #0066cc; cursor: pointer; transition: transform 0.2s;" title="Blue"></button>

                        <button class="title-color-swatch" data-color="#6633cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #6633cc; cursor: pointer; transition: transform 0.2s;" title="Purple"></button>

                        <button class="title-color-swatch" data-color="#cc0000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #cc0000; cursor: pointer; transition: transform 0.2s;" title="Red"></button>

                        <button class="title-color-swatch" data-color="#ff6600" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ff6600; cursor: pointer; transition: transform 0.2s;" title="Orange"></button>

                        <button class="title-color-swatch" data-color="#00cccc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #00cccc; cursor: pointer; transition: transform 0.2s;" title="Teal"></button>

                        <button class="title-color-swatch" data-color="#669900" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #669900; cursor: pointer; transition: transform 0.2s;" title="Green"></button>

                        <button class="title-color-swatch" data-color="#ffffff" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ffffff; cursor: pointer; transition: transform 0.2s;" title="White"></button>

                        <button class="title-color-swatch" data-color="#000000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #000000; cursor: pointer; transition: transform 0.2s;" title="Black"></button>

                    </div>

                    <button id="cancel-title-color" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">

                        Cancel

                    </button>

                </div>

            `;

            

            // Insert the color picker after the profile item

            titleColorsModule.insertAdjacentHTML('afterend', colorPickerHTML);

            

            // Add event listeners for color swatches

            const colorSwatches = this.shadowRoot.querySelectorAll('.title-color-swatch');

            colorSwatches.forEach(swatch => {

                swatch.addEventListener('click', (e) => {

                    const selectedColor = e.target.getAttribute('data-color');

                    this.applyTitleColor(selectedColor);

                });

                

                // Add hover effect

                swatch.addEventListener('mouseenter', (e) => {

                    e.target.style.transform = 'scale(1.1)';

                });

                swatch.addEventListener('mouseleave', (e) => {

                    e.target.style.transform = 'scale(1)';

                });

            });

            

            // Add event listener for cancel button

            const cancelBtn = this.shadowRoot.getElementById('cancel-title-color');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.hideTitleColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-title-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-title-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Title color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-title-colors module');

        }

    }



    hideTitleColorPicker() {

        console.log('Accessibility Widget: Hiding title color picker');

        const existingPicker = this.shadowRoot.querySelector('.title-color-picker-controls');

        if (existingPicker) {

            existingPicker.remove();

        }

    }



    applyTitleColor(color) {

        console.log('Accessibility Widget: Applying title color:', color);

        // Apply color to all title elements

        const titleElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        titleElements.forEach(element => {

            element.style.color = color;

        });

        

        // Save the applied color

        this.settings['title-color'] = color;

        this.settings['adjust-title-colors'] = true;

        this.saveSettings();

        

        console.log('Accessibility Widget: Title color applied to', titleElements.length, 'elements');

    }



    resetTitleColors() {

        console.log('Accessibility Widget: Resetting title colors');

        // Remove any custom title color styles

        const titleElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        titleElements.forEach(element => {

            if (element.style.color) {

                element.style.removeProperty('color');

            }

        });

        

        this.settings['adjust-title-colors'] = false;

        this.settings['title-color'] = null;

        this.saveSettings();

        console.log('Accessibility Widget: Title colors reset');

    }



    showBackgroundColorPicker() {

        console.log('Accessibility Widget: Showing background color picker');

        this.hideBackgroundColorPicker();

        

        // Find the adjust-bg-colors module in the panel

        const bgColorsModule = this.shadowRoot.querySelector('#adjust-bg-colors').closest('.profile-item');

        

        if (bgColorsModule) {

            // Create color picker content with predefined color swatches

            const colorPickerHTML = `

                <div class="bg-color-picker-controls" style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">

                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px; font-weight: bold;">Adjust Background Colors</h4>

                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">

                        <button class="bg-color-swatch" data-color="#0066cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #0066cc; cursor: pointer; transition: transform 0.2s;" title="Blue"></button>

                        <button class="bg-color-swatch" data-color="#6633cc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #6633cc; cursor: pointer; transition: transform 0.2s;" title="Purple"></button>

                        <button class="bg-color-swatch" data-color="#cc0000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #cc0000; cursor: pointer; transition: transform 0.2s;" title="Red"></button>

                        <button class="bg-color-swatch" data-color="#ff6600" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ff6600; cursor: pointer; transition: transform 0.2s;" title="Orange"></button>

                        <button class="bg-color-swatch" data-color="#00cccc" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #00cccc; cursor: pointer; transition: transform 0.2s;" title="Teal"></button>

                        <button class="bg-color-swatch" data-color="#669900" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #669900; cursor: pointer; transition: transform 0.2s;" title="Green"></button>

                        <button class="bg-color-swatch" data-color="#ffffff" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #ffffff; cursor: pointer; transition: transform 0.2s;" title="White"></button>

                        <button class="bg-color-swatch" data-color="#000000" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; background: #000000; cursor: pointer; transition: transform 0.2s;" title="Black"></button>

                    </div>

                    <button id="cancel-bg-color" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">

                        Cancel

                    </button>

                </div>

            `;

            

            // Insert the color picker after the profile item

            bgColorsModule.insertAdjacentHTML('afterend', colorPickerHTML);

            

            // Add event listeners for color swatches

            const colorSwatches = this.shadowRoot.querySelectorAll('.bg-color-swatch');

            colorSwatches.forEach(swatch => {

                swatch.addEventListener('click', (e) => {

                    const selectedColor = e.target.getAttribute('data-color');

                    this.applyBackgroundColor(selectedColor);

                });

                

                // Add hover effect

                swatch.addEventListener('mouseenter', (e) => {

                    e.target.style.transform = 'scale(1.1)';

                });

                swatch.addEventListener('mouseleave', (e) => {

                    e.target.style.transform = 'scale(1)';

                });

            });

            

            // Add event listener for cancel button

            const cancelBtn = this.shadowRoot.getElementById('cancel-bg-color');

            if (cancelBtn) {

                cancelBtn.addEventListener('click', () => {

                    this.hideBackgroundColorPicker();

                    // Turn off the toggle switch

                    const toggle = this.shadowRoot.querySelector('#adjust-bg-colors');

                    if (toggle) {

                        toggle.checked = false;

                        this.handleToggle('adjust-bg-colors', false);

                    }

                });

            }

            

            console.log('Accessibility Widget: Background color picker shown in panel');

        } else {

            console.error('Accessibility Widget: Could not find adjust-bg-colors module');

        }

    }



    hideBackgroundColorPicker() {

        const existingPicker = this.shadowRoot.querySelector('.bg-color-picker-controls');

        if (existingPicker) {

            existingPicker.remove();

            console.log('Accessibility Widget: Background color picker hidden');

        }

    }



    applyBackgroundColor(color) {

        console.log('Accessibility Widget: Applying background color:', color);

        

        // Apply background color only to specific content areas, not the entire page

        const mainContentAreas = document.querySelectorAll('section, article, main, .container, .hero, .about, .services, .test-section, .hero-content, .about-content, .services-grid, .service-card, .test-block, .contact-form, .contact-info');

        

        mainContentAreas.forEach(element => {

            // Skip accessibility panel elements

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                // Apply background color to specific content areas only

                element.style.backgroundColor = color;

            }

        });

        

        // Also apply to any remaining elements that might have backgrounds

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            // Skip accessibility panel elements and elements that already have the color

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon') && 

                element.style.backgroundColor !== color) {

                

                // Check if element has a background that's not transparent

                const computedStyle = window.getComputedStyle(element);

                const bgColor = computedStyle.backgroundColor;

                

                // If element has a background that's not transparent, apply our color

                if (bgColor !== 'rgba(0, 0, 0, 0)' && 

                    bgColor !== 'transparent' && 

                    bgColor !== color &&

                    !element.classList.contains('color-option') && // Don't change color picker colors

                    !element.classList.contains('cancel-btn')) { // Don't change button colors

                    element.style.backgroundColor = color;

                }

            }

        });

        

        // Store the selected color

        this.selectedBackgroundColor = color;

        this.settings['bg-color'] = color;

        this.settings['adjust-bg-colors'] = true;

        this.saveSettings();

        console.log('Accessibility Widget: Background color applied to entire website');

    }



    resetBackgroundColors() {

        console.log('Accessibility Widget: Resetting background colors');

        

        // Reset html and body background

        document.documentElement.style.backgroundColor = '';

        document.body.style.backgroundColor = '';

        

        // Reset all main content areas

        const mainContentAreas = document.querySelectorAll('html, body, div, section, article, main, aside, header, footer, nav, .container, .hero, .about, .services, .test-section, .hero-content, .about-content, .services-grid, .service-card, .test-block');

        

        mainContentAreas.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                element.style.backgroundColor = '';

            }

        });

        

        // Reset all other elements that might have been changed

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon') &&

                !element.classList.contains('color-option') && 

                !element.classList.contains('cancel-btn')) {

                // Reset if we applied a background color to it

                if (element.style.backgroundColor && element.style.backgroundColor !== '') {

                    element.style.backgroundColor = '';

                }

            }

        });

        

        this.selectedBackgroundColor = null;

        this.settings['adjust-bg-colors'] = false;

        this.settings['bg-color'] = null;

        this.saveSettings();

        console.log('Accessibility Widget: Background colors reset for entire website');

    }



    // Seizure Safe Profile Methods

    enableSeizureSafe() {

        this.settings['seizure-safe'] = true;

        document.body.classList.add('seizure-safe');

        this.addSeizureSafeStyles();

        // Stop autoplay videos to prevent seizures
        this.stopAutoplayVideos();

        // Stop any JavaScript-based animations (like the slider auto-slide)

        if (window.slider && typeof window.slider.disableAutoSlide === 'function') {

            console.log('Accessibility Widget: Calling slider.disableAutoSlide()');

            window.slider.disableAutoSlide();

        } else {

            console.log('Accessibility Widget: Slider not found or disableAutoSlide method not available');

            // Try again after a short delay in case slider is still initializing

            setTimeout(() => {

                if (window.slider && typeof window.slider.disableAutoSlide === 'function') {

                    console.log('Accessibility Widget: Retrying slider.disableAutoSlide()');

                    window.slider.disableAutoSlide();

                }

            }, 100);

        }

        

        // Update widget appearance to sync Shadow DOM host classes

        this.updateWidgetAppearance();

        

        this.saveSettings();

        console.log('Accessibility Widget: Seizure safe profile enabled');

    }



    disableSeizureSafe() {

        this.settings['seizure-safe'] = false;

        document.body.classList.remove('seizure-safe');

        this.removeSeizureSafeStyles();

        

        // Resume JavaScript-based animations (like the slider auto-slide)

        if (window.slider && typeof window.slider.enableAutoSlide === 'function') {

            console.log('Accessibility Widget: Calling slider.enableAutoSlide()');

            window.slider.enableAutoSlide();

        } else {

            console.log('Accessibility Widget: Slider not found or enableAutoSlide method not available');

            // Try again after a short delay in case slider is still initializing

            setTimeout(() => {

                if (window.slider && typeof window.slider.enableAutoSlide === 'function') {

                    console.log('Accessibility Widget: Retrying slider.enableAutoSlide()');

                    window.slider.enableAutoSlide();

                }

            }, 100);

        }

        

        // Update widget appearance to sync Shadow DOM host classes

        this.updateWidgetAppearance();

        

        this.saveSettings();

        console.log('Accessibility Widget: Seizure safe profile disabled');

    }

    // Stop autoplay videos to prevent seizures
    stopAutoplayVideos() {
        console.log('Accessibility Widget: Stopping autoplay videos for seizure safety');
        
        // Find all video and audio elements
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        
        // Stop and pause all videos
        videos.forEach((video, index) => {
            if (video.autoplay || video.getAttribute('autoplay') !== null) {
                video.pause();
                video.currentTime = 0;
                video.removeAttribute('autoplay');
                video.setAttribute('data-seizure-safe-paused', 'true');
                console.log(`Accessibility Widget: Stopped autoplay video ${index + 1}`);
            }
        });
        
        // Stop and pause all audio
        audios.forEach((audio, index) => {
            if (audio.autoplay || audio.getAttribute('autoplay') !== null) {
                audio.pause();
                audio.currentTime = 0;
                audio.removeAttribute('autoplay');
                audio.setAttribute('data-seizure-safe-paused', 'true');
                console.log(`Accessibility Widget: Stopped autoplay audio ${index + 1}`);
            }
        });
        
        // Add CSS to prevent future autoplay
        if (!document.getElementById('seizure-safe-autoplay-css')) {
            const style = document.createElement('style');
            style.id = 'seizure-safe-autoplay-css';
            style.textContent = `
                .seizure-safe video[autoplay],
                .seizure-safe audio[autoplay] {
                    animation-play-state: paused !important;
                }
                .seizure-safe video,
                .seizure-safe audio {
                    animation: none !important;
                    transition: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('Accessibility Widget: Autoplay videos stopped for seizure safety');
    }



    addSeizureSafeStyles() {

        // Remove existing styles if they exist

        this.removeSeizureSafeStyles();

        

        // Create style element for seizure-safe overlay

        const style = document.createElement('style');

        style.id = 'accessibility-seizure-safe-styles';

        style.textContent = `

            /* Removed grey overlay - using color desaturation instead */

            

            /* Stop only seizure-triggering animations, preserve essential functionality */
            
            /* Target specific seizure-triggering elements */
            body.seizure-safe [class*="animate"],
            body.seizure-safe [class*="fade"],
            body.seizure-safe [class*="slide"],
            body.seizure-safe [class*="bounce"],
            body.seizure-safe [class*="pulse"],
            body.seizure-safe [class*="shake"],
            body.seizure-safe [class*="flash"],
            body.seizure-safe [class*="blink"],
            body.seizure-safe [class*="glow"],
            body.seizure-safe [class*="spin"],
            body.seizure-safe [class*="rotate"],
            body.seizure-safe [class*="scale"],
            body.seizure-safe [class*="zoom"],
            body.seizure-safe [class*="wiggle"],
            body.seizure-safe [class*="jiggle"],
            body.seizure-safe [class*="twist"],
            body.seizure-safe [class*="flip"],
            body.seizure-safe [class*="swing"],
            body.seizure-safe [class*="wobble"],
            body.seizure-safe [class*="tilt"],
            body.seizure-safe [class*="shake"],
            body.seizure-safe [class*="bounce"],
            body.seizure-safe [class*="pulse"],
            body.seizure-safe [class*="flash"],
            body.seizure-safe [class*="blink"],
            body.seizure-safe [class*="glow"],
            body.seizure-safe [class*="spin"],
            body.seizure-safe [class*="rotate"],
            body.seizure-safe [class*="scale"],
            body.seizure-safe [class*="zoom"],
            body.seizure-safe [class*="wiggle"],
            body.seizure-safe [class*="jiggle"],
            body.seizure-safe [class*="twist"],
            body.seizure-safe [class*="flip"],
            body.seizure-safe [class*="swing"],
            body.seizure-safe [class*="wobble"],
            body.seizure-safe [class*="tilt"] {
                animation: none !important;
                transition: none !important;
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                animation-iteration-count: 0 !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
            
            /* Stop common seizure-triggering animations */
            body.seizure-safe *[style*="animation"],
            body.seizure-safe *[style*="transition"] {
                animation: none !important;
                transition: none !important;
            }

            

            /* Preserve portfolio functionality while maintaining seizure safety */
            body.seizure-safe .portfolio-card,
            body.seizure-safe .hover-circle,
            body.seizure-safe .bg-overlay,
            body.seizure-safe .portfolio-hover-img,
            body.seizure-safe .portfolio-desc-wrapper,
            body.seizure-safe .portfolio-filters,
            body.seizure-safe .curved-text-container {
                /* Allow essential portfolio animations but reduce intensity */
                transition: opacity 0.2s ease, transform 0.2s ease !important;
                animation: none !important;
            }
            
            /* Preserve accessibility widget functionality */
            body.seizure-safe .accessibility-icon,
            body.seizure-safe .accessibility-panel,
            body.seizure-safe .toggle-switch,
            body.seizure-safe .slider,
            body.seizure-safe .profile-item,
            body.seizure-safe .action-btn,
            body.seizure-safe .close-btn,
            body.seizure-safe .language-selector {
                /* Allow essential UI animations */
                transition: opacity 0.2s ease, transform 0.2s ease !important;
                animation: none !important;
            }

            /* Allow slider track to maintain its left positioning for navigation */

            body.seizure-safe .slider-track {

                animation: none !important;

                animation-name: none !important;

                animation-duration: 0s !important;

                animation-iteration-count: 0 !important;

                transition: left 0.5s ease-in-out !important;

                /* left positioning is controlled by JavaScript, don't override it */

            }

            

            /* Completely stop auto-slide animation */

            body.seizure-safe .slider-track,

            body.seizure-safe .slider-track * {

                animation: none !important;

                animation-name: none !important;

                animation-duration: 0s !important;

                animation-iteration-count: 0 !important;

                animation-delay: 0s !important;

            }

            

            /* Ensure slider buttons and dots remain functional */

            body.seizure-safe .slider-btn,

            body.seizure-safe .dot {

                transition: all 0.3s ease !important;

                /* Allow hover effects and clicks to work */

            }

            

            /* Reduce color intensity (muted colors) for seizure safety - more targeted approach */

            body.seizure-safe img,
            body.seizure-safe video,
            body.seizure-safe canvas,
            body.seizure-safe svg,
            body.seizure-safe [class*="hero"],
            body.seizure-safe [class*="banner"],
            body.seizure-safe [class*="background"],
            body.seizure-safe [class*="bg-"],
            body.seizure-safe [style*="background"] {

                filter: saturate(0.6) brightness(0.9) !important;

                transition: filter 0.3s ease !important;

            }

            

            /* Big white cursor for seizure-safe mode */

            body.seizure-safe {

                cursor: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwMHB4IiB3aWR0aD0iODAwcHgiIHZlcnNpb249IjEuMSIgaWQ9IkNhcGFfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iMCAwIDE2LjQ5OSAxNi40OTkiIHhtbDpzcGFjZT0icHJlc2VydmUiIGZpbGw9IiMwMDAwMDAiPjxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8+PGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPjxnPjxwYXRoIHN0eWxlPSJmaWxsOiNmZmZmZmY7IiBkPSJNMTQuNTExLDQuMDM3Yy0wLjAxOC0wLjA0NS0wLjA0LTAuMDgyLTAuMDcyLTAuMTE1Yy0wLjA1LTAuMDQ3LTAuMTE1LTAuMDgtMC4xODgtMC4wODJMMC4zMzUsMC4wMDIgQzAuMjQzLTAuMDEsMC4xNTQsMC4wMjcsMC4wOSwwLjA5QzAuMDI0LDAuMTU2LTAuMDA3LDAuMjQsMC4wMDMsMC4zMzRsNC42MzQsMTQuMTdjMC4wMTMsMC4xMTksMC4wODksMC4yMTcsMC4yLDAuMjU4IHMwLjIzNSwwLjAxLDAuMzE4LTAuMDc2bDEuMTExLTUuNjExbDcuMzM0LDcuMzMyYzAuMTIxLDAuMTIzLDAuMzEyLDAuMTIzLDAuNDMxLDBsMi4zNzgtMi4zNzVjMC4xMTktMC4xMjEsMC4xMTktMC4zMTIsMC0wLjQzMiBMOS4wNzUsNi4yNjZsNS4zNjMtMS45MUMxNC41MjIsNC4yNzUsMTQuNTQ5LDQuMTUsMTQuNTExLDQuMDM3eiIvPjwvZz48L2c+PC9zdmc+'), auto !important;

            }

            

            body.seizure-safe * {

                cursor: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwMHB4IiB3aWR0aD0iODAwcHgiIHZlcnNpb249IjEuMSIgaWQ9IkNhcGFfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iMCAwIDE2LjQ5OSAxNi40OTkiIHhtbDpzcGFjZT0icHJlc2VydmUiIGZpbGw9IiMwMDAwMDAiPjxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8+PGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPjxnPjxwYXRoIHN0eWxlPSJmaWxsOiNmZmZmZmY7IiBkPSJNMTQuNTExLDQuMDM3Yy0wLjAxOC0wLjA0NS0wLjA0LTAuMDgyLTAuMDcyLTAuMTE1Yy0wLjA1LTAuMDQ3LTAuMTE1LTAuMDgtMC4xODgtMC4wODJMMC4zMzUsMC4wMDIgQzAuMjQzLTAuMDEsMC4xNTQsMC4wMjcsMC4wOSwwLjA5QzAuMDI0LDAuMTU2LTAuMDA3LDAuMjQsMC4wMDMsMC4zMzRsNC42MzQsMTQuMTdjMC4wMTMsMC4xMTksMC4wODksMC4yMTcsMC4yLDAuMjU4IHMwLjIzNSwwLjAxLDAuMzE4LTAuMDc2bDEuMTExLTUuNjExbDcuMzM0LDcuMzMyYzAuMTIxLDAuMTIzLDAuMzEyLDAuMTIzLDAuNDMxLDBsMi4zNzgtMi4zNzVjMC4xMTktMC4xMjEsMC4xMTktMC4zMTIsMC0wLjQzMiBMOS4wNzUsNi4yNjZsNS4zNjMtMS45MUMxNC41MjIsNC4yNzUsMTQuNTQ5LDQuMTUsMTQuNTExLDQuMDM3eiIvPjwvZz48L2c+PC9zdmc+'), auto !important;

            }

            

            /* Fix black screen issues by overriding problematic seizure safety */
            body.seizure-safe {
                background: transparent !important;
                background-color: transparent !important;
            }
            
            body.seizure-safe * {
                background: inherit !important;
                background-color: inherit !important;
                filter: none !important;
            }
            
            /* Only apply filters to specific media elements */
            body.seizure-safe img,
            body.seizure-safe video,
            body.seizure-safe canvas {
                filter: saturate(0.6) brightness(0.9) !important;
            }
            
            /* Fix stop animation causing black screens */
            body.stop-animation {
                background: transparent !important;
                background-color: transparent !important;
            }
            
            body.stop-animation * {
                background: inherit !important;
                background-color: inherit !important;
            }
            
            /* Ensure accessibility widget stays above overlay */

            body.seizure-safe .accessibility-widget,

            body.seizure-safe #accessibility-widget {

                z-index: 99998 !important;

            }

            

            /

            

            /* ADHD Friendly Styles */

            .adhd-friendly #adhd-spotlight {

                z-index: 99998 !important;

                background: rgba(255, 255, 255, 0.1) !important;

                backdrop-filter: brightness(2.0) contrast(1.2) !important;

                box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.4) !important;

                filter: none !important;

                position: fixed !important;

                pointer-events: none !important;

                border-radius: 8px !important;

                transition: all 0.1s ease !important;

            }

            

            /* Ensure accessibility widget stays above ADHD spotlight */

            .adhd-friendly .accessibility-widget,

            .adhd-friendly #accessibility-widget {

                z-index: 1000000 !important;

            }

            

            /* Enhanced content inside spotlight area with increased contrast */

            .adhd-friendly .adhd-focus {

                outline: 4px solid var(--primary-color) !important;

                outline-offset: 3px !important;

                background: rgba(99, 102, 241, 0.15) !important;

                filter: contrast(1.3) brightness(1.1) !important;

            }

        `;

        

        document.head.appendChild(style);

        console.log('Accessibility Widget: Seizure-safe overlay styles added');

    }



    removeSeizureSafeStyles() {

        const existingStyle = document.getElementById('accessibility-seizure-safe-styles');

        if (existingStyle) {

            existingStyle.remove();

            console.log('Accessibility Widget: Seizure-safe overlay styles removed');

        }

        

        // Reset cursor styles that were applied by seizure-safe mode

        document.body.style.cursor = '';

        const allElements = document.querySelectorAll('*');

        allElements.forEach(element => {

            element.style.cursor = '';

        });

        

        // Also reset cursor on Shadow DOM host

        if (this.shadowRoot && this.shadowRoot.host) {

            this.shadowRoot.host.style.cursor = '';

        }

        

        console.log('Accessibility Widget: Cursor styles reset after seizure-safe mode');

    }



    // ADHD Friendly Profile Methods

    enableADHDFriendly() {

        this.settings['adhd-friendly'] = true;

        document.body.classList.add('adhd-friendly');

        this.createADHDSpotlight();

        this.saveSettings();

        console.log('Accessibility Widget: ADHD friendly profile enabled');

    }



    disableADHDFriendly() {

        this.settings['adhd-friendly'] = false;

        document.body.classList.remove('adhd-friendly');

        this.removeADHDSpotlight();

        this.saveSettings();

        console.log('Accessibility Widget: ADHD friendly profile disabled');

    }



    createADHDSpotlight() {

        // Remove existing spotlight if any

        this.removeADHDSpotlight();

        

        // Create dark overlay for the entire page

        const darkOverlay = document.createElement('div');

        darkOverlay.id = 'adhd-dark-overlay';

        darkOverlay.style.cssText = `

            position: fixed;

            top: 0;

            left: 0;

            width: 100vw;

            height: 100vh;

            pointer-events: none;

            z-index: 99997;

            background: rgba(0, 0, 0, 0.6);

        `;

        document.body.appendChild(darkOverlay);

        

        // Create spotlight with transparent bright area

        const spotlight = document.createElement('div');

        spotlight.id = 'adhd-spotlight';

        spotlight.style.cssText = `

            position: fixed;

            width: 100vw;

            height: 150px;

            background: rgba(255, 255, 255, 0.1);

            backdrop-filter: brightness(2.0) contrast(1.2);

            box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.4);

            filter: none;

            pointer-events: none;

            border-radius: 8px;

            transition: all 0.1s ease;

            z-index: 99998;

            top: 50vh;

        `;

        document.body.appendChild(spotlight);

        

        // Ensure accessibility widget stays above spotlight

        const widget = document.querySelector('.accessibility-widget');

        if (widget) {

            widget.style.zIndex = '1000000';

        }

        

        // Also ensure the shadow root host has high z-index

        const shadowHost = document.querySelector('#accessibility-widget');

        if (shadowHost) {

            shadowHost.style.zIndex = '1000000';

        }

        

        // Add mouse move event listener

        this.adhdMouseMoveHandler = (e) => {

            spotlight.style.top = e.clientY + 'px';

        };

        

        document.addEventListener('mousemove', this.adhdMouseMoveHandler);

        console.log('Accessibility Widget: ADHD spotlight created');

    }



    removeADHDSpotlight() {

        // Remove dark overlay

        const darkOverlay = document.getElementById('adhd-dark-overlay');

        if (darkOverlay) {

            darkOverlay.remove();

        }

        

        // Remove spotlight

        const spotlight = document.getElementById('adhd-spotlight');

        if (spotlight) {

            spotlight.remove();

        }

        

        // Remove mouse move event listener

        if (this.adhdMouseMoveHandler) {

            document.removeEventListener('mousemove', this.adhdMouseMoveHandler);

            this.adhdMouseMoveHandler = null;

        }

        

        console.log('Accessibility Widget: ADHD spotlight removed');

    }



    // Cognitive Disability Profile Methods

    enableCognitiveDisability() {

        document.body.classList.add('cognitive-disability');

        this.addCognitiveBoxes();

        console.log('Accessibility Widget: Cognitive disability profile enabled');

    }



    disableCognitiveDisability() {

        document.body.classList.remove('cognitive-disability');

        this.removeCognitiveBoxes();

        console.log('Accessibility Widget: Cognitive disability profile disabled');

    }



    addCognitiveBoxes() {

        // Add boxes around buttons and links (excluding accessibility panel)

        const buttons = document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"]');

        const links = document.querySelectorAll('a');

        

        // Process buttons

        buttons.forEach(button => {

            // Skip if button is inside accessibility panel

            if (button.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                return;

            }

            

            // Create wrapper if not already done

            if (!button.dataset.cognitiveBoxed) {

                const wrapper = document.createElement('div');

                wrapper.style.cssText = `

                    display: inline-block;

                    border: 2px solid #6366f1;

                    border-radius: 6px;

                    padding: 4px 8px;

                    margin: 2px;

                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

                    background: transparent;

                `;

                

                // Insert wrapper before button and move button inside

                button.parentNode.insertBefore(wrapper, button);

                wrapper.appendChild(button);

                button.dataset.cognitiveBoxed = 'true';

            }

        });

        

        // Process links

        links.forEach(link => {

            // Skip if link is inside accessibility panel

            if (link.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon')) {

                return;

            }

            

            // Create wrapper if not already done

            if (!link.dataset.cognitiveBoxed) {

                const wrapper = document.createElement('div');

                wrapper.style.cssText = `

                    display: inline-block;

                    border: 2px solid #6366f1;

                    border-radius: 4px;

                    padding: 2px 4px;

                    margin: 1px;

                    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);

                    background: transparent;

                `;

                

                // Insert wrapper before link and move link inside

                link.parentNode.insertBefore(wrapper, link);

                wrapper.appendChild(link);

                link.dataset.cognitiveBoxed = 'true';

            }

        });

        

        console.log('Accessibility Widget: Cognitive boxes added to', buttons.length, 'buttons and', links.length, 'links');

    }



    removeCognitiveBoxes() {

        // Remove boxes from buttons

        const buttons = document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"]');

        buttons.forEach(button => {

            if (button.dataset.cognitiveBoxed && button.parentNode && button.parentNode.style.border) {

                const wrapper = button.parentNode;

                const grandParent = wrapper.parentNode;

                grandParent.insertBefore(button, wrapper);

                grandParent.removeChild(wrapper);

                delete button.dataset.cognitiveBoxed;

            }

        });

        

        // Remove boxes from links

        const links = document.querySelectorAll('a');

        links.forEach(link => {

            if (link.dataset.cognitiveBoxed && link.parentNode && link.parentNode.style.border) {

                const wrapper = link.parentNode;

                const grandParent = wrapper.parentNode;

                grandParent.insertBefore(link, wrapper);

                grandParent.removeChild(wrapper);

                delete link.dataset.cognitiveBoxed;

            }

        });

        

        console.log('Accessibility Widget: Cognitive boxes removed');

    }



    // Text Alignment Methods

    alignTextLeft() {

        console.log('Accessibility Widget: Aligning text left');

        this.applyTextAlignment('left');

    }



    alignTextCenter() {

        console.log('Accessibility Widget: Aligning text center');

        this.applyTextAlignment('center');

    }



    alignTextRight() {

        console.log('Accessibility Widget: Aligning text right');

        this.applyTextAlignment('right');

    }



    applyTextAlignment(alignment) {

        console.log('Accessibility Widget: Applying text alignment:', alignment);

        

        // Apply to document body first

        document.body.style.setProperty('text-align', alignment);

        

        // Apply to all text elements - be very broad

        const allElements = document.querySelectorAll('*');

        let count = 0;

        

        allElements.forEach(element => {

            // Skip accessibility controls

            if (element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon, .text-alignment-panel, #text-alignment-panel, .alignment-toggle-btn')) {

                return;

            }

            

            // Apply to all elements that can contain text

            const tagName = element.tagName.toLowerCase();

            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'section', 'article', 'main', 'header', 'footer', 'nav', 'li', 'td', 'th', 'blockquote', 'cite', 'address', 'label', 'a'].includes(tagName)) {

                element.style.setProperty('text-align', alignment);

                count++;

            }

        });

        

        // Also apply to common content classes

        const contentSelectors = [

            '.container', '.hero', '.hero-content', '.hero-text', 

            '.about', '.about-content', '.about-text',

            '.services', '.services-grid', '.service-card',

            '.contact', '.contact-content', '.contact-info',

            '.footer', '.footer-content', '.footer-section',

            '.test-section', '.test-block'

        ];

        

        contentSelectors.forEach(selector => {

            const elements = document.querySelectorAll(selector);

            elements.forEach(element => {

                if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon, .text-alignment-panel, #text-alignment-panel, .alignment-toggle-btn')) {

                    element.style.setProperty('text-align', alignment);

                    count++;

                }

            });

        });

        

        console.log('Accessibility Widget: Text alignment', alignment, 'applied to', count, 'elements');

    }



    resetTextAlignment() {

        console.log('Accessibility Widget: Resetting text alignment');

        

        // Reset document body

        document.body.style.removeProperty('text-align');

        

        // Reset all elements - be very broad

        const allElements = document.querySelectorAll('*');

        let count = 0;

        

        allElements.forEach(element => {

            // Skip accessibility controls

            if (element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon, .text-alignment-panel, #text-alignment-panel, .alignment-toggle-btn')) {

                return;

            }

            

            // Reset all elements that can contain text

            const tagName = element.tagName.toLowerCase();

            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'section', 'article', 'main', 'header', 'footer', 'nav', 'li', 'td', 'th', 'blockquote', 'cite', 'address', 'label', 'a'].includes(tagName)) {

                element.style.removeProperty('text-align');

                count++;

            }

        });

        

        // Also reset common content classes

        const contentSelectors = [

            '.container', '.hero', '.hero-content', '.hero-text', 

            '.about', '.about-content', '.about-text',

            '.services', '.services-grid', '.service-card',

            '.contact', '.contact-content', '.contact-info',

            '.footer', '.footer-content', '.footer-section',

            '.test-section', '.test-block'

        ];

        

        contentSelectors.forEach(selector => {

            const elements = document.querySelectorAll(selector);

            elements.forEach(element => {

                if (!element.closest('.accessibility-panel, #accessibility-icon, .accessibility-icon, .text-alignment-panel, #text-alignment-panel, .alignment-toggle-btn')) {

                    element.style.removeProperty('text-align');

                    count++;

                }

            });

        });

        

        console.log('Accessibility Widget: Text alignment reset on', count, 'elements');

    }



    createTextAlignmentControls() {

        // Create text alignment controls

        const alignmentContainer = document.createElement('div');

        alignmentContainer.className = 'alignment-controls';

        alignmentContainer.innerHTML = `

            <div class="control-group">

                <h4>Text Alignment</h4>

                <div class="alignment-buttons">

                    <button id="align-left" class="alignment-btn" title="Align Left">

                        <span style="text-align: left;">⬅</span>

                    </button>

                    <button id="align-center" class="alignment-btn" title="Align Center">

                        <span style="text-align: center;">↔</span>

                    </button>

                    <button id="align-right" class="alignment-btn" title="Align Right">

                        <span style="text-align: right;">➡</span>

                    </button>

                    <button id="reset-alignment" class="alignment-btn" title="Reset Alignment">

                        <span>↺</span>

                    </button>

                </div>

            </div>

        `;



        // Add event listeners

        const alignLeftBtn = alignmentContainer.querySelector('#align-left');

        const alignCenterBtn = alignmentContainer.querySelector('#align-center');

        const alignRightBtn = alignmentContainer.querySelector('#align-right');

        const resetAlignmentBtn = alignmentContainer.querySelector('#reset-alignment');



        alignLeftBtn.addEventListener('click', () => this.alignTextLeft());

        alignCenterBtn.addEventListener('click', () => this.alignTextCenter());

        alignRightBtn.addEventListener('click', () => this.alignTextRight());

        resetAlignmentBtn.addEventListener('click', () => this.resetTextAlignment());



        return alignmentContainer;

    }









    // Vision Impaired Profile Methods

    enableVisionImpaired() {

        this.settings['vision-impaired'] = true;

        console.log('Accessibility Widget: Enabling vision impaired profile');

        document.body.classList.add('vision-impaired');

        this.applyVisionImpairedStyles();

        this.saveSettings();

    }



    disableVisionImpaired() {

        this.settings['vision-impaired'] = false;

        console.log('Accessibility Widget: Disabling vision impaired profile');

        document.body.classList.remove('vision-impaired');

        this.removeVisionImpairedStyles();

        this.saveSettings();

    }



    applyVisionImpairedStyles() {
        // Add CSS rules for vision impaired if not already added
        if (!document.getElementById('vision-impaired-css')) {
            const style = document.createElement('style');
            style.id = 'vision-impaired-css';
            style.textContent = `
                .vision-impaired * {
                    font-size: 105% !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('Accessibility Widget: Vision impaired styles applied - font size increased by 5%');
        
        // Ensure the Shadow DOM host gets the vision-impaired class
        this.updateWidgetAppearance();
    }



    removeVisionImpairedStyles() {
        // Remove CSS rules for vision impaired
        const existingStyle = document.getElementById('vision-impaired-css');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        console.log('Accessibility Widget: Vision impaired styles removed via CSS classes');
        
        // Ensure the Shadow DOM host gets updated
        this.updateWidgetAppearance();
    }



    // Text Alignment Methods

    enableAlignCenter() {

        console.log('Accessibility Widget: Enabling center alignment');

        // Disable other alignment options first
        this.disableAlignLeft();
        this.disableAlignRight();

        // Apply center alignment to body first

        document.body.style.textAlign = 'center';

        

        // Then apply to specific content elements, excluding accessibility widget

        const contentElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

        

        contentElements.forEach(element => {

            // Skip accessibility widget elements completely

            if (element.closest('#accessibility-widget-container') || 

                element.closest('.accessibility-panel') ||

                element.closest('#accessibility-icon') ||

                element.closest('.accessibility-icon') ||

                element.closest('.text-alignment-panel') ||

                element.closest('#text-alignment-panel') ||

                element.id === 'accessibility-widget-container' ||

                element.id === 'accessibility-panel' ||

                element.id === 'accessibility-icon' ||

                element.id === 'text-alignment-panel') {

                return; // Skip this element

            }

            

            element.style.textAlign = 'center';

        });

        

        console.log('Accessibility Widget: Center alignment enabled');

    }



    disableAlignCenter() {

        console.log('Accessibility Widget: Disabling center alignment');

        

        // Reset body alignment first

        document.body.style.textAlign = '';

        

        // Then reset specific content elements, excluding accessibility widget

        const contentElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

        

        contentElements.forEach(element => {

            // Skip accessibility widget elements completely

            if (element.closest('#accessibility-widget-container') || 

                element.closest('.accessibility-panel') ||

                element.closest('#accessibility-icon') ||

                element.closest('.accessibility-icon') ||

                element.closest('.text-alignment-panel') ||

                element.closest('#text-alignment-panel') ||

                element.id === 'accessibility-widget-container' ||

                element.id === 'accessibility-panel' ||

                element.id === 'accessibility-icon' ||

                element.id === 'text-alignment-panel') {

                return; // Skip this element

            }

            

            element.style.textAlign = '';

        });

        

        console.log('Accessibility Widget: Center alignment disabled');

    }



    enableAlignLeft() {

        console.log('🔧 [ALIGN LEFT] Starting enableAlignLeft()');
        console.log('🔧 [ALIGN LEFT] Current settings:', this.settings);

        // Disable other alignment options first
        console.log('🔧 [ALIGN LEFT] Disabling other alignment options...');
        this.disableAlignCenter();
        this.disableAlignRight();

        // Apply left alignment to body first
        console.log('🔧 [ALIGN LEFT] Setting body textAlign to left...');
        document.body.style.textAlign = 'left';
        console.log('🔧 [ALIGN LEFT] Body textAlign set to:', document.body.style.textAlign);

        // Then apply to specific content elements, excluding accessibility widget
        console.log('🔧 [ALIGN LEFT] Querying content elements...');
        const contentElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span:not([class*="icon"]):not([class*="button"]), div:not([class*="icon"]):not([class*="button"]):not([class*="nav"]):not([class*="menu"]), li, td, th, label, small, em, strong, i, b, a, button, input, textarea, select, article, section, aside, nav, header, footer');
        console.log('🔧 [ALIGN LEFT] Found', contentElements.length, 'content elements');

        let processedCount = 0;
        let skippedCount = 0;

        contentElements.forEach(element => {

            // Skip accessibility widget elements completely

            if (element.closest('#accessibility-widget-container') || 

                element.closest('.accessibility-panel') ||

                element.closest('#accessibility-icon') ||

                element.closest('.accessibility-icon') ||

                element.closest('.text-alignment-panel') ||

                element.closest('#text-alignment-panel') ||

                element.id === 'accessibility-widget-container' ||

                element.id === 'accessibility-panel' ||

                element.id === 'accessibility-icon' ||

                element.id === 'text-alignment-panel') {

                return; // Skip this element

            }

            

            console.log('🔧 [ALIGN LEFT] Setting textAlign to left for element:', element.tagName, element.className);
            element.style.textAlign = 'left';
            processedCount++;

        });
        
        console.log('🔧 [ALIGN LEFT] Processed', processedCount, 'elements, skipped', skippedCount, 'elements');

        console.log('🔧 [ALIGN LEFT] Left alignment enabled - COMPLETED');
        console.log('🔧 [ALIGN LEFT] Final body textAlign:', document.body.style.textAlign);

    }



    disableAlignLeft() {

        console.log('Accessibility Widget: Disabling left alignment');

        

        // Only target main content areas, completely avoid accessibility widget

        const mainContent = document.querySelector('main') || document.querySelector('#main') || document.querySelector('.main') || document.querySelector('#content') || document.querySelector('.content');

        

        if (mainContent) {

            // Remove left alignment only from main content area

            const contentElements = mainContent.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

            

            contentElements.forEach(element => {

                element.style.textAlign = '';

            });

        }

        

        console.log('Accessibility Widget: Left alignment disabled');

    }



    enableAlignRight() {

        console.log('Accessibility Widget: Enabling right alignment');

        // Disable other alignment options first
        this.disableAlignLeft();
        this.disableAlignCenter();

        // Apply right alignment to body first, then to specific content elements

        document.body.style.textAlign = 'right';

        

        // Apply to all text elements except accessibility panel

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

        

        textElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('#accessibility-widget-container') && 

                !element.closest('.accessibility-panel') && 

                !element.closest('#accessibility-icon') && 

                !element.closest('.text-alignment-panel') &&

                element.id !== 'accessibility-icon' && 

                element.id !== 'accessibility-panel' &&

                element.id !== 'text-alignment-panel') {

                element.style.textAlign = 'right';

            }

        });

        

        console.log('Accessibility Widget: Right alignment enabled');

    }



    disableAlignRight() {

        console.log('Accessibility Widget: Disabling right alignment');

        

        // Reset body alignment

        document.body.style.textAlign = '';

        

        // Remove right alignment from all text elements except accessibility panel

        const textElements = document.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

        

        textElements.forEach(element => {

            // Skip if element is inside accessibility panel

            if (!element.closest('#accessibility-widget-container') && 

                !element.closest('.accessibility-panel') && 

                !element.closest('#accessibility-icon') && 

                !element.closest('.text-alignment-panel') &&

                element.id !== 'accessibility-icon' && 

                element.id !== 'accessibility-panel' &&

                element.id !== 'text-alignment-panel') {

                element.style.textAlign = '';

            }

        });

        

        console.log('Accessibility Widget: Right alignment disabled');

    }



    resetTextAlignment() {

        console.log('Accessibility Widget: Resetting text alignment');

        

        // Only target main content areas, completely avoid accessibility widget

        const mainContent = document.querySelector('main') || document.querySelector('#main') || document.querySelector('.main') || document.querySelector('#content') || document.querySelector('.content');

        

        if (mainContent) {

            // Reset text alignment only from main content area

            const contentElements = mainContent.querySelectorAll('p, span, div, li, td, th, label, small, em, strong, i, b, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, article, section, aside, nav, header, footer');

            

            contentElements.forEach(element => {

                element.style.textAlign = '';

            });

        }

        

        console.log('Accessibility Widget: Text alignment reset');

    }







    updateWidgetAppearance() {

        // Sync Shadow DOM host with global accessibility features

        if (this.shadowRoot && this.shadowRoot.host) {

            const container = this.shadowRoot.host;

            

            // Remove all feature classes first

            container.classList.remove(

                'seizure-safe', 'vision-impaired', 'adhd-friendly', 'cognitive-disability',

                'high-contrast', 'monochrome', 'dark-contrast', 'light-contrast',

                'high-saturation', 'low-saturation'

            );

            

            // Add classes based on current settings

            Object.entries(this.settings).forEach(([feature, enabled]) => {

                if (enabled) {

                    container.classList.add(feature);

                }

            });

            

            console.log('Accessibility Widget: Shadow DOM host updated with classes:', container.className);

        }

    }



    // Screen Reader Support Methods

    announceToScreenReader(message) {

        if (this.shadowRoot) {

            const srAnnouncements = this.shadowRoot.getElementById('sr-announcements');

            if (srAnnouncements) {

                srAnnouncements.textContent = message;

                console.log('Accessibility Widget: Screen reader announcement:', message);

                

                // Clear the announcement after a short delay

                setTimeout(() => {

                    srAnnouncements.textContent = '';

                }, 1000);

            }

        }

    }



    addToggleAccessibility(toggle) {

        const featureId = toggle.id;

        const profileItem = toggle.closest('.profile-item');

        

        if (profileItem) {

            const titleElement = profileItem.querySelector('h4');

            const descElement = profileItem.querySelector('p');

            

            if (titleElement && descElement) {

                const title = titleElement.textContent;

                const description = descElement.textContent;

                

                // Add ID to description if it doesn't have one

                if (!descElement.id) {

                    descElement.id = `${featureId}-desc`;

                }

                

                // Set ARIA attributes

                toggle.setAttribute('aria-label', `${title} - ${description}`);

                toggle.setAttribute('aria-describedby', descElement.id);

                toggle.setAttribute('role', 'switch');

                

                console.log(`Accessibility Widget: Added ARIA attributes to ${featureId}: ${title} - ${description}`);

            }

        }

    }



    // Update toggle switch in panel to sync with keyboard shortcuts

    updateToggleSwitch(featureId, enabled) {

        if (this.shadowRoot) {

            const toggle = this.shadowRoot.getElementById(featureId);

            if (toggle) {

                toggle.checked = enabled;

                console.log(`Accessibility Widget: Updated toggle ${featureId} to ${enabled}`);

            } else {

                console.log(`Accessibility Widget: Toggle ${featureId} not found in panel`);

            }

        }

    }



    // Update all toggle switches to reflect current settings

    updateAllToggleSwitches() {

        if (this.shadowRoot) {

            const allToggles = this.shadowRoot.querySelectorAll('.toggle-switch input');

            allToggles.forEach(toggle => {

                const featureId = toggle.id;

                if (featureId && this.settings.hasOwnProperty(featureId)) {

                    toggle.checked = this.settings[featureId];

                    console.log(`Accessibility Widget: Updated toggle ${featureId} to ${this.settings[featureId]}`);

                }

            });

        }

    }



    // Enhanced Keyboard Navigation Methods

    ensureFocusInPanel() {

        if (this.shadowRoot && this.isPanelOpen) {

            const panel = this.shadowRoot.getElementById('accessibility-panel');

            if (panel && panel.classList.contains('active')) {

                const focusableElements = panel.querySelectorAll(

                    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

                );

                

                if (focusableElements.length > 0) {

                    const activeElement = this.shadowRoot.activeElement;

                    if (!activeElement || !panel.contains(activeElement)) {

                        focusableElements[0].focus();

                    }

                }

            }

        }

    }



    // Enhanced Panel Toggle with Screen Reader Support

    togglePanel() {

        if (this.shadowRoot) {

            const panel = this.shadowRoot.getElementById('accessibility-panel');

            const icon = this.shadowRoot.getElementById('accessibility-icon');

            

            if (panel && icon) {
                const isVisible = panel.style.display !== 'none';
                const isCurrentlyOpen = panel.classList.contains('active');
                if (isVisible) {
                    // Hide panel
                    panel.style.display = 'none';
                    panel.style.visibility = 'hidden';
                    icon.setAttribute('aria-expanded', 'false');
                    console.log('Accessibility Widget: Panel hidden');
                } else {
                    // Show panel
                    this.ensureBasePanelCSS(); // Ensure base CSS is applied
                    this.updateInterfacePosition(); // Position panel next to icon
                    panel.style.display = 'block';
                    panel.style.visibility = 'visible';
                    icon.setAttribute('aria-expanded', 'true');
                    console.log('Accessibility Widget: Panel shown');
                }
                

                if (isCurrentlyOpen) {

                    // Close panel

                    panel.classList.remove('active');

                    panel.setAttribute('aria-hidden', 'true');

                    icon.setAttribute('aria-expanded', 'false');

                    this.isPanelOpen = false;

                    

                    // Return focus to icon

                    icon.focus();

                    this.announceToScreenReader('Accessibility panel closed');

                } else {

                    // Open panel
                    this.ensureBasePanelCSS(); // Ensure base CSS is applied
                    panel.classList.add('active');

                    panel.setAttribute('aria-hidden', 'false');

                    icon.setAttribute('aria-expanded', 'true');

                    this.isPanelOpen = true;

                    

                    // Focus first focusable element in panel

                    setTimeout(() => {

                        this.ensureFocusInPanel();

                    }, 100);

                    

                    this.announceToScreenReader('Accessibility panel opened. Use Tab to navigate, Enter or Space to toggle features, and Escape to close.');

                }

                

                console.log('Accessibility Widget: Panel toggled, isOpen:', this.isPanelOpen);

            }

        }

    }

    // Fetch customization data from the API
    async fetchCustomizationData() {
        console.log('[CK] fetchCustomizationData() - Starting...');
        console.log('[CK] fetchCustomizationData() - this.kvApiUrl:', this.kvApiUrl);
        
        try {
            // Get siteId first
            this.siteId = await this.getSiteId();
            console.log('[CK] fetchCustomizationData() - Got siteId:', this.siteId);
            
            if (!this.siteId) {
                console.error('[CK] fetchCustomizationData() - No siteId available, cannot fetch customization data');
                return null;
            }
            
            if (!this.kvApiUrl) {
                console.error('[CK] fetchCustomizationData() - kvApiUrl is not set!');
                return null;
            }
            
            // Add cache busting to ensure fresh data
            const cacheBuster = `_t=${Date.now()}`;
            const apiUrl = `${this.kvApiUrl}/api/accessibility/config?siteId=${this.siteId}&${cacheBuster}`;
            console.log('[CK] fetchCustomizationData() - Making API request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[CK] fetchCustomizationData() - Response status:', response.status);
            console.log('[CK] fetchCustomizationData() - Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[CK] fetchCustomizationData() - API request failed:', response.status, errorText);
                return null;
            }
            
            const data = await response.json();
            console.log('[CK] fetchCustomizationData() - Full API response:', data);
            console.log('[CK] fetchCustomizationData() - Customization data:', data.customization);
            
            return data;
            
        } catch (error) {
            console.error('[CK] fetchCustomizationData() - Error:', error);
            return null;
        }
    }

    // Set up periodic refresh to check for customization updates
    setupCustomizationRefresh() {
        console.log('[CK] setupCustomizationRefresh() - Setting up periodic refresh...');
        
        // Check for updates every 30 seconds
        setInterval(async () => {
            console.log('[CK] setupCustomizationRefresh() - Checking for customization updates...');
            try {
                const customizationData = await this.fetchCustomizationData();
                if (customizationData && customizationData.customization) {
                    console.log('[CK] setupCustomizationRefresh() - Found updated customization data:', customizationData.customization);
                    this.applyCustomizations(customizationData.customization);
                }
            } catch (error) {
                console.error('[CK] setupCustomizationRefresh() - Error checking for updates:', error);
            }
        }, 30000); // Check every 30 seconds
        
        // Also check when the page becomes visible (user switches back to tab)
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                console.log('[CK] setupCustomizationRefresh() - Page became visible, checking for updates...');
                try {
                    const customizationData = await this.fetchCustomizationData();
                    if (customizationData && customizationData.customization) {
                        console.log('[CK] setupCustomizationRefresh() - Found updated customization data on visibility change:', customizationData.customization);
                        this.applyCustomizations(customizationData.customization);
                    }
                } catch (error) {
                    console.error('[CK] setupCustomizationRefresh() - Error checking for updates on visibility change:', error);
                }
            }
        });
    }

    // Get site ID for API calls
    async getSiteId() {
        console.log('[CK] getSiteId() - Starting siteId detection...');
        console.log('[CK] getSiteId() - Current hostname:', window.location.hostname);
        console.log('[CK] getSiteId() - Current URL:', window.location.href);
        console.log('[CK] getSiteId() - KV API URL:', this.kvApiUrl);
        console.log('[CK] getSiteId() - this context:', this);
    
    // Method 1: Check sessionStorage first (set during authorization)
    let siteId = sessionStorage.getItem('accessibility_site_id');
    if (siteId) {
        console.log('[CK] getSiteId() resolved:', siteId, 'from sessionStorage (authorization)');
        return siteId;
    }
    
    // Method 2: Check if siteId was embedded by the script injection
    if (window.ACCESSIBILITY_SITE_ID) {
        console.log('[CK] getSiteId() - Found embedded siteId:', window.ACCESSIBILITY_SITE_ID);
        return window.ACCESSIBILITY_SITE_ID;
    }
    
    // Method 3: Check if siteId is in the URL
    const urlParams = new URLSearchParams(window.location.search);
    siteId = urlParams.get('siteId');
    if (siteId) {
        console.log('[CK] getSiteId() resolved:', siteId, 'from URL');
        return siteId;
    }
    
    // Method 4: Check localStorage
    siteId = localStorage.getItem('accessibility_site_id');
    if (siteId) {
        console.log('[CK] getSiteId() resolved:', siteId, 'from localStorage');
        return siteId;
    }
    
    // Method 4.5: Check sessionStorage for Apps & Integrations flow
    const sessionData = sessionStorage.getItem('wf_hybrid_user');
    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData);
            if (parsed.siteInfo && parsed.siteInfo.siteId) {
                console.log('[CK] getSiteId() - Found siteId from Apps & Integrations sessionStorage:', parsed.siteInfo.siteId);
                return parsed.siteInfo.siteId;
            }
        } catch (error) {
            console.error('[CK] getSiteId() - Error parsing Apps & Integrations sessionStorage:', error);
        }
    }
    
    // Method 5: Check meta tags
    const metaSiteId = document.querySelector('meta[name="site-id"]');
    if (metaSiteId) {
        siteId = metaSiteId.getAttribute('content');
        console.log('[CK] getSiteId() resolved:', siteId, 'from meta tag');
        return siteId;
    }
    
    // Method 6: Check body data attribute
    const bodySiteId = document.body.getAttribute('data-site-id');
    if (bodySiteId) {
        siteId = bodySiteId;
        console.log('[CK] getSiteId() resolved:', siteId, 'from body data attribute');
        return siteId;
    }
    
        // Method 7: Domain-based lookup (NEW - This is the key!)
        const hostname = window.location.hostname;
        console.log('[CK] getSiteId() - Attempting domain lookup for:', hostname);
        
        if (!this.kvApiUrl) {
            console.error('[CK] getSiteId() - kvApiUrl is not set for domain lookup!');
            return null;
        }
        
        console.log('[CK] getSiteId() - Making request to:', `${this.kvApiUrl}/api/accessibility/domain-lookup?domain=${hostname}`);
        
        try {
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/domain-lookup?domain=${hostname}`);
        console.log('[CK] getSiteId() - Domain lookup response status:', response.status);
        console.log('[CK] getSiteId() - Domain lookup response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('[CK] getSiteId() - Domain lookup response data:', data);
            console.log('[CK] getSiteId() - Found siteId via domain lookup:', data.siteId);
            return data.siteId;
        } else {
            const errorText = await response.text();
            console.log('[CK] getSiteId() - Domain lookup failed:', response.status, errorText);
        }
    } catch (error) {
        console.error('[CK] getSiteId() - Domain lookup error:', error);
    }
    
    // Method 8: Try without www prefix
    if (hostname.startsWith('www.')) {
        const domainWithoutWww = hostname.substring(4);
        console.log('[CK] getSiteId() - Trying domain without www:', domainWithoutWww);
        
        if (!this.kvApiUrl) {
            console.error('[CK] getSiteId() - kvApiUrl is not set for domain lookup (no www)!');
            return null;
        }
        
        console.log('[CK] getSiteId() - Making request to (no www):', `${this.kvApiUrl}/api/accessibility/domain-lookup?domain=${domainWithoutWww}`);
        
        try {
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/domain-lookup?domain=${domainWithoutWww}`);
            console.log('[CK] getSiteId() - Domain lookup response status (no www):', response.status);
            console.log('[CK] getSiteId() - Domain lookup response ok (no www):', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[CK] getSiteId() - Domain lookup response data (no www):', data);
                console.log('[CK] getSiteId() - Found siteId via domain lookup (no www):', data.siteId);
                return data.siteId;
            } else {
                const errorText = await response.text();
                console.log('[CK] getSiteId() - Domain lookup failed (no www):', response.status, errorText);
            }
        } catch (error) {
            console.error('[CK] getSiteId() - Domain lookup error (no www):', error);
        }
    }
    
    console.error('[CK] getSiteId() - Could not determine siteId');
    return null;
}

applyCustomizations(customizationData) {
    console.log('[CK] applyCustomizations() - Starting to apply customization data:', customizationData);
     console.log('[CK] applyCustomizations() - Customization data keys:', customizationData ? Object.keys(customizationData) : 'No customization data');
    console.log('[CK] applyCustomizations() - Statement link value:', customizationData ? customizationData.accessibilityStatementLink : 'No customization data');
    if (!customizationData) {
        console.log('[CK] applyCustomizations() - No customization data provided');
        return;
    }
    
    // Store customization data for later use (e.g., statement link)
    this.customizationData = customizationData;
    console.log('[CK] applyCustomizations() - Stored customization data for widget use');
    console.log('[CK] applyCustomizations() - Stored statement link:', this.customizationData.accessibilityStatementLink);
    
    try {
        // Apply trigger button customizations
        if (customizationData.triggerButtonColor) {
            console.log('[CK] applyCustomizations() - Setting trigger button color:', customizationData.triggerButtonColor);
            this.updateTriggerButtonColor(customizationData.triggerButtonColor);
        }
        
        if (customizationData.triggerButtonShape) {
            console.log('🔧 [CUSTOMIZATION] Setting trigger button shape:', customizationData.triggerButtonShape);
            console.log('🔧 [CUSTOMIZATION] Shape type:', typeof customizationData.triggerButtonShape);
            console.log('🔧 [CUSTOMIZATION] Shape length:', customizationData.triggerButtonShape?.length);
            console.log('🔧 [CUSTOMIZATION] About to call updateTriggerButtonShape...');
            this.updateTriggerButtonShape(customizationData.triggerButtonShape);
            console.log('🔧 [CUSTOMIZATION] updateTriggerButtonShape called');
        }
        
        if (customizationData.triggerButtonSize) {
            console.log('[CK] applyCustomizations() - Setting trigger button size:', customizationData.triggerButtonSize);
            this.updateTriggerButtonSize(customizationData.triggerButtonSize);
        }
        
        if (customizationData.triggerHorizontalPosition) {
            console.log('[CK] applyCustomizations() - Setting trigger horizontal position:', customizationData.triggerHorizontalPosition);
            this.updateTriggerPosition('horizontal', customizationData.triggerHorizontalPosition);
        }
        
        if (customizationData.triggerVerticalPosition) {
            console.log('[CK] applyCustomizations() - Setting trigger vertical position:', customizationData.triggerVerticalPosition);
            this.updateTriggerPosition('vertical', customizationData.triggerVerticalPosition);
        }
        
        if (customizationData.triggerHorizontalOffset) {
            console.log('[CK] applyCustomizations() - Setting trigger horizontal offset:', customizationData.triggerHorizontalOffset);
            this.updateTriggerOffset('horizontal', customizationData.triggerHorizontalOffset);
        }
        
        if (customizationData.triggerVerticalOffset) {
            console.log('[CK] applyCustomizations() - Setting trigger vertical offset:', customizationData.triggerVerticalOffset);
            this.updateTriggerOffset('vertical', customizationData.triggerVerticalOffset);
        }
        
        if (customizationData.hideTriggerButton) {
            console.log('[CK] applyCustomizations() - Setting trigger button visibility:', customizationData.hideTriggerButton);
            this.updateTriggerVisibility(customizationData.hideTriggerButton === 'Yes');
        }
        
        // Apply language - preserve user's language choice
        const savedLanguage = localStorage.getItem('accessibility-widget-language');
        
        // Only apply language from customization if:
        // 1. There's a saved language AND it's different from customization (user changed it in app)
        // 2. OR there's no saved language AND customization has a non-default language
        if (customizationData.interfaceLanguage && 
            customizationData.interfaceLanguage !== 'English' && 
            customizationData.interfaceLanguage !== savedLanguage) {
            console.log('[CK] applyCustomizations() - Setting interface language:', customizationData.interfaceLanguage);
            this.applyLanguage(customizationData.interfaceLanguage);
            this.updateInterfacePosition();
        } else if (!savedLanguage && customizationData.interfaceLanguage && customizationData.interfaceLanguage !== 'English') {
            console.log('[CK] applyCustomizations() - No saved language, using customization language:', customizationData.interfaceLanguage);
            this.applyLanguage(customizationData.interfaceLanguage);
            this.updateInterfacePosition();
        } else if (!savedLanguage && (!customizationData.interfaceLanguage || customizationData.interfaceLanguage === 'English')) {
            console.log('[CK] applyCustomizations() - No saved language, defaulting to English');
            this.applyLanguage('English');
            this.updateInterfacePosition();
        } else {
            console.log('[CK] applyCustomizations() - Keeping saved language:', savedLanguage);
            // Keep the current language, just update interface position
            this.updateInterfacePosition();
        }
        
        // Apply icon customizations
        if (customizationData.selectedIcon) {
            console.log('[CK] applyCustomizations() - Setting selected icon:', customizationData.selectedIcon);
            this.updateSelectedIcon(customizationData.selectedIcon);
        }
        
        if (customizationData.selectedIconName) {
            console.log('[CK] applyCustomizations() - Setting selected icon name:', customizationData.selectedIconName);
            this.updateSelectedIconName(customizationData.selectedIconName);
        }
        
        // Apply mobile customizations
        if (customizationData.showOnMobile) {
            console.log('[CK] applyCustomizations() - Setting mobile visibility:', customizationData.showOnMobile);
            this.updateMobileVisibility(customizationData.showOnMobile === 'Show');
        }
        
        // Handle combined positioning for mobile trigger
        if (customizationData.mobileTriggerHorizontalPosition && customizationData.mobileTriggerVerticalPosition) {
            console.log('📱 [APPLY CUSTOMIZATIONS] Setting combined mobile trigger position:', customizationData.mobileTriggerHorizontalPosition, customizationData.mobileTriggerVerticalPosition);
            console.log('📱 [APPLY CUSTOMIZATIONS] Window width at time of application:', window.innerWidth);
            console.log('📱 [APPLY CUSTOMIZATIONS] Is mobile at application time:', window.innerWidth <= 768);
            this.updateMobileTriggerCombinedPosition(customizationData.mobileTriggerHorizontalPosition, customizationData.mobileTriggerVerticalPosition);
        } else {
            // Handle individual positioning
            if (customizationData.mobileTriggerHorizontalPosition) {
                console.log('[CK] applyCustomizations() - Setting mobile trigger horizontal position:', customizationData.mobileTriggerHorizontalPosition);
                this.updateMobileTriggerPosition('horizontal', customizationData.mobileTriggerHorizontalPosition);
            }
            
            if (customizationData.mobileTriggerVerticalPosition) {
                console.log('[CK] applyCustomizations() - Setting mobile trigger vertical position:', customizationData.mobileTriggerVerticalPosition);
                this.updateMobileTriggerPosition('vertical', customizationData.mobileTriggerVerticalPosition);
            }
        }
        
        if (customizationData.mobileTriggerSize) {
            console.log('[CK] applyCustomizations() - Setting mobile trigger size:', customizationData.mobileTriggerSize);
            this.updateMobileTriggerSize(customizationData.mobileTriggerSize);
        }
        
        if (customizationData.mobileTriggerShape) {
            console.log('📱 [CUSTOMIZATION] Setting mobile trigger shape:', customizationData.mobileTriggerShape);
            console.log('📱 [CUSTOMIZATION] Mobile shape type:', typeof customizationData.mobileTriggerShape);
            console.log('📱 [CUSTOMIZATION] Mobile shape length:', customizationData.mobileTriggerShape?.length);
            console.log('📱 [CUSTOMIZATION] Window width at shape application:', window.innerWidth);
            console.log('📱 [CUSTOMIZATION] Is mobile at shape application:', window.innerWidth <= 768);
            this.updateMobileTriggerShape(customizationData.mobileTriggerShape);
            
            // Final verification for mobile shape
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    const icon = this.shadowRoot?.getElementById('accessibility-icon');
                    if (icon) {
                        const computedBorderRadius = window.getComputedStyle(icon).borderRadius;
                        console.log('📱 [FINAL VERIFICATION] Mobile shape verification:');
                        console.log('📱 [FINAL VERIFICATION] - Expected shape:', customizationData.mobileTriggerShape);
                        console.log('📱 [FINAL VERIFICATION] - Computed border-radius:', computedBorderRadius);
                        console.log('📱 [FINAL VERIFICATION] - Data-shape attribute:', icon.getAttribute('data-shape'));
                        console.log('📱 [FINAL VERIFICATION] - Icon classes:', icon.className);
                    }
                }, 200);
            }
        }
        
        // Store mobile offsets to be applied after positioning
        if (customizationData.mobileTriggerHorizontalOffset) {
            console.log('[CK] applyCustomizations() - Storing mobile trigger horizontal offset for later application:', customizationData.mobileTriggerHorizontalOffset);
            this.mobileHorizontalOffset = customizationData.mobileTriggerHorizontalOffset;
        }
        
        if (customizationData.mobileTriggerVerticalOffset) {
            console.log('[CK] applyCustomizations() - Storing mobile trigger vertical offset for later application:', customizationData.mobileTriggerVerticalOffset);
            this.mobileVerticalOffset = customizationData.mobileTriggerVerticalOffset;
        }
        
        console.log('[CK] applyCustomizations() - Successfully applied all customization data');
        
        // Apply mobile offsets after all positioning has been applied
        if (this.mobileHorizontalOffset !== undefined) {
            console.log('[CK] applyCustomizations() - Applying stored mobile horizontal offset:', this.mobileHorizontalOffset);
            this.updateMobileTriggerOffset('horizontal', this.mobileHorizontalOffset);
        }
        
        if (this.mobileVerticalOffset !== undefined) {
            console.log('[CK] applyCustomizations() - Applying stored mobile vertical offset:', this.mobileVerticalOffset);
            this.updateMobileTriggerOffset('vertical', this.mobileVerticalOffset);
        }
        
        // Show the icon now that customizations have been applied
        this.showIcon();
        
    } catch (error) {
        console.error('[CK] applyCustomizations() - Error applying customization data:', error);
        
        // Show the icon even if there was an error, but with default styling
        this.showIcon();
    }
}

    // Show the icon after customizations are loaded
    showIcon() {
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (!icon) {
            console.warn('[CK] showIcon() - Icon not found in shadow DOM');
            return;
        }

        // Check device type
        const isMobile = window.innerWidth <= 768;
        const hideTrigger = this.customizationData?.hideTriggerButton === 'Yes';
        const mobileVisibility = this.customizationData?.showOnMobile; // 'Show' | 'Hide' | undefined

        console.log('[CK] showIcon() - Device check:', { isMobile, hideTrigger, mobileVisibility });

        // Desktop/Tablet logic: hide if hideTriggerButton is Yes
        if (!isMobile && hideTrigger) {
            console.log('[CK] showIcon() - Desktop/Tablet: hideTriggerButton is Yes; hiding icon');
            icon.style.display = 'none';
            icon.style.visibility = 'hidden';
            icon.style.opacity = '0';
            return;
        }

        // Mobile logic: hide if showOnMobile is Hide
        if (isMobile && mobileVisibility === 'Hide') {
            console.log('[CK] showIcon() - Mobile: showOnMobile is Hide; hiding icon on mobile');
            icon.style.display = 'none';
            icon.style.visibility = 'hidden';
            icon.style.opacity = '0';
            return;
        }

        // Show icon if visibility rules pass
        console.log('[CK] showIcon() - Showing icon (visibility rules passed)');
            icon.style.display = 'flex';
            icon.style.visibility = 'visible';
            icon.style.opacity = '1';
            icon.style.transition = 'opacity 0.3s ease';
        
        // Apply mobile positioning if on mobile and we have mobile position data
        if (isMobile && this.customizationData?.mobileTriggerHorizontalPosition && this.customizationData?.mobileTriggerVerticalPosition) {
            console.log('[CK] showIcon() - Applying mobile positioning on show');
            this.updateMobileTriggerCombinedPosition(
                this.customizationData.mobileTriggerHorizontalPosition, 
                this.customizationData.mobileTriggerVerticalPosition
            );
    }
}

    applyLanguage(language) {
        console.log('[CK] applyLanguage() - Language:', language);
        console.log('[CK] applyLanguage() - Available languages:', Object.keys(this.translations));
        
        // Save language to localStorage for persistence
        localStorage.setItem('accessibility-widget-language', language);
        console.log('[CK] applyLanguage() - Language saved to localStorage:', language);
        
        const content = this.translations[language] || this.translations.en;
        
        // Ensure toggle text is always available
        if (!content.toggleOn) {
            content.toggleOn = "ON";
        }
        if (!content.toggleOff) {
            content.toggleOff = "OFF";
        }
        console.log('[CK] applyLanguage() - Using content for language:', language);
        console.log('[CK] applyLanguage() - Content keys:', Object.keys(content));
        
        // Update panel title
        const titleElement = this.shadowRoot?.querySelector('.accessibility-panel h2');
        if (titleElement) {
            titleElement.textContent = content.title;
            console.log('[CK] Updated panel title to:', content.title);
        } else {
            console.log('[CK] Panel title element not found');
        }
        
        // Update section title
        const sectionTitle = this.shadowRoot?.querySelector('.white-content-section h3');
        if (sectionTitle) {
            sectionTitle.textContent = content.profilesTitle;
            console.log('[CK] Updated section title to:', content.profilesTitle);
        } else {
            console.log('[CK] Section title element not found');
        }
        
        // Update action buttons
        const resetBtn = this.shadowRoot?.querySelector('#reset-settings');
        if (resetBtn) {
            resetBtn.innerHTML = `<i class="fas fa-redo"></i> ${content.resetSettings}`;
            console.log('[CK] Updated reset button to:', content.resetSettings);
        } else {
            console.log('[CK] Reset button element not found');
        }
        
        const statementBtn = this.shadowRoot?.querySelector('#statement');
        if (statementBtn) {
            statementBtn.innerHTML = `<i class="fas fa-file-alt"></i> ${content.statement}`;
            console.log('[CK] Updated statement button to:', content.statement);
        } else {
            console.log('[CK] Statement button element not found');
        }
        
        const hideBtn = this.shadowRoot?.querySelector('#hide-interface');
        if (hideBtn) {
            hideBtn.innerHTML = `<i class="fas fa-eye-slash"></i> ${content.hideInterface}`;
            console.log('[CK] Updated hide button to:', content.hideInterface);
        } else {
            console.log('[CK] Hide button element not found');
        }
        
        // Update hide interface modal content if it exists
        this.updateHideInterfaceModal(content);
        
        // Setup hide interface modal event listeners
        this.setupHideInterfaceModal();
        
        // Update profile items using specific selectors
        this.updateProfileItem('seizure-safe', content.seizureSafe, content.seizureSafeDesc);
        this.updateProfileItem('vision-impaired', content.visionImpaired, content.visionImpairedDesc);
        this.updateProfileItem('adhd-friendly', content.adhdFriendly, content.adhdFriendlyDesc);
        this.updateProfileItem('cognitive-disability', content.cognitiveDisability, content.cognitiveDisabilityDesc);
        this.updateProfileItem('keyboard-nav', content.keyboardNav, content.keyboardNavDesc);
        this.updateProfileItem('screen-reader', content.screenReader, content.screenReaderDesc);
        this.updateProfileItem('content-scaling', content.contentScaling, content.contentScalingDesc);
        this.updateProfileItem('readable-font', content.readableFont, content.readableFontDesc);
        this.updateProfileItem('highlight-titles', content.highlightTitles, content.highlightTitlesDesc);
        this.updateProfileItem('highlight-links', content.highlightLinks, content.highlightLinksDesc);
        this.updateProfileItem('text-magnifier', content.textMagnifier, content.textMagnifierDesc);
        this.updateProfileItem('font-sizing', content.fontSizing, content.fontSizingDesc);
        this.updateProfileItem('align-center', content.alignCenter, content.alignCenterDesc);
        this.updateProfileItem('adjust-line-height', content.adjustLineHeight, content.adjustLineHeightDesc);
        this.updateProfileItem('adjust-letter-spacing', content.adjustLetterSpacing, content.adjustLetterSpacingDesc);
        this.updateProfileItem('align-left', content.alignLeft, content.alignLeftDesc);
        this.updateProfileItem('align-right', content.alignRight, content.alignRightDesc);
        this.updateProfileItem('dark-contrast', content.darkContrast, content.darkContrastDesc);
        this.updateProfileItem('light-contrast', content.lightContrast, content.lightContrastDesc);
        this.updateProfileItem('high-contrast', content.highContrast, content.highContrastDesc);
        this.updateProfileItem('high-saturation', content.highSaturation, content.highSaturationDesc);
        this.updateProfileItem('adjust-text-colors', content.adjustTextColors, content.adjustTextColorsDesc);
        this.updateProfileItem('monochrome', content.monochrome, content.monochromeDesc);
        this.updateProfileItem('adjust-title-colors', content.adjustTitleColors, content.adjustTitleColorsDesc);
        this.updateProfileItem('low-saturation', content.lowSaturation, content.lowSaturationDesc);
        this.updateProfileItem('adjust-bg-colors', content.adjustBgColors, content.adjustBgColorsDesc);
        this.updateProfileItem('mute-sound', content.muteSound, content.muteSoundDesc);
        this.updateProfileItem('hide-images', content.hideImages, content.hideImagesDesc);
        this.updateProfileItem('read-mode', content.readMode, content.readModeDesc);
        this.updateProfileItem('reading-guide', content.readingGuide, content.readingGuideDesc);
        this.updateProfileItem('useful-links', content.usefulLinks, content.usefulLinksDesc);
        this.updateProfileItem('stop-animation', content.stopAnimation, content.stopAnimationDesc);
        this.updateProfileItem('reading-mask', content.readingMask, content.readingMaskDesc);
        this.updateProfileItem('highlight-hover', content.highlightHover, content.highlightHoverDesc);
        this.updateProfileItem('highlight-focus', content.highlightFocus, content.highlightFocusDesc);
        this.updateProfileItem('big-black-cursor', content.bigBlackCursor, content.bigBlackCursorDesc);
        this.updateProfileItem('big-white-cursor', content.bigWhiteCursor, content.bigWhiteCursorDesc);
        
        // Update detailed descriptions and notes
        this.updateDetailedDescriptions(content);
        
        // Update toggle switch text
        this.updateToggleText(content);
        
        console.log('[CK] applyLanguage() - Language applied successfully');
    }
    
    updateProfileItem(profileId, title, description) {
        const profileItem = this.shadowRoot?.querySelector(`#${profileId}`)?.closest('.profile-item');
        if (profileItem) {
            const h4 = profileItem.querySelector('h4');
            const p = profileItem.querySelector('p');
            
            if (h4 && title) {
                h4.textContent = title;
                console.log(`[CK] Updated ${profileId} title to:`, title);
            }
            if (p && description) {
                p.textContent = description;
                console.log(`[CK] Updated ${profileId} description to:`, description);
            }
        }
    }
    
    updateDetailedDescriptions(content) {
        // Update keyboard navigation detailed description
        const keyboardNavDescription = this.shadowRoot?.querySelector('#keyboard-nav')?.closest('.profile-item')?.querySelector('.profile-description p');
        if (keyboardNavDescription && content.keyboardNavDetailed) {
            keyboardNavDescription.textContent = content.keyboardNavDetailed;
            console.log('[CK] Updated keyboard nav detailed description');
        }
        
        // Update keyboard navigation note
        const keyboardNavNote = this.shadowRoot?.querySelector('#keyboard-nav')?.closest('.profile-item')?.querySelector('.profile-description p:last-child');
        if (keyboardNavNote && content.keyboardNavNote) {
            keyboardNavNote.innerHTML = `<strong></strong> ${content.keyboardNavNote.replace('Note: ', '')}`;
            console.log('[CK] Updated keyboard nav note');
        }
        
        // Update screen reader detailed description
        const screenReaderDescription = this.shadowRoot?.querySelector('#screen-reader')?.closest('.profile-item')?.querySelector('.profile-description p');
        if (screenReaderDescription && content.screenReaderDetailed) {
            screenReaderDescription.textContent = content.screenReaderDetailed;
            console.log('[CK] Updated screen reader detailed description');
        }
        
        // Update screen reader note
        const screenReaderNote = this.shadowRoot?.querySelector('#screen-reader')?.closest('.profile-item')?.querySelector('.profile-description p:last-child');
        if (screenReaderNote && content.screenReaderNote) {
            screenReaderNote.innerHTML = `<strong></strong> ${content.screenReaderNote.replace('Note: ', '')}`;
            console.log('[CK] Updated screen reader note');
        }
        
        // Update "Activates with" text for keyboard navigation
        const keyboardNavActivates = this.shadowRoot?.querySelector('#keyboard-nav')?.closest('.profile-item')?.querySelector('small');
        if (keyboardNavActivates && content.activatesWithScreenReader) {
            keyboardNavActivates.textContent = content.activatesWithScreenReader;
            console.log('[CK] Updated keyboard nav activates text');
        }
        
        // Update "Activates with" text for screen reader
        const screenReaderActivates = this.shadowRoot?.querySelector('#screen-reader')?.closest('.profile-item')?.querySelector('small');
        if (screenReaderActivates && content.activatesWithKeyboardNav) {
            screenReaderActivates.textContent = content.activatesWithKeyboardNav;
            console.log('[CK] Updated screen reader activates text');
        }
    }
    
    updateToggleText(content) {
        console.log('[CK] updateToggleText() - Updating toggle switch text');
        console.log('[CK] updateToggleText() - Content received:', content);
        console.log('[CK] updateToggleText() - ToggleOn:', content.toggleOn);
        console.log('[CK] updateToggleText() - ToggleOff:', content.toggleOff);
        
        // Update CSS custom properties for toggle text
        if (content.toggleOn && content.toggleOff) {
            // Create style element for shadow DOM
            const style = document.createElement('style');
            style.id = 'toggle-text-translation';
            style.textContent = `
                .slider::after {
                    content: "${content.toggleOff}" !important;
                }
                input:checked + .slider::after {
                    content: "${content.toggleOn}" !important;
                }
            `;
            
            console.log('[CK] updateToggleText() - CSS to be applied:', style.textContent);
            
            // Remove existing toggle text style if it exists from shadow DOM
            const existingStyle = this.shadowRoot?.getElementById('toggle-text-translation');
            if (existingStyle) {
                console.log('[CK] updateToggleText() - Removing existing style');
                existingStyle.remove();
            }
            
            // Add the new style to shadow DOM
            if (this.shadowRoot) {
                this.shadowRoot.appendChild(style);
                console.log('[CK] updateToggleText() - Toggle text updated in shadow DOM:', {
                    toggleOn: content.toggleOn,
                    toggleOff: content.toggleOff
                });
                
                // Force a re-render to ensure the changes take effect
                const toggles = this.shadowRoot.querySelectorAll('.slider');
                toggles.forEach(toggle => {
                    toggle.style.display = 'none';
                    toggle.offsetHeight; // Trigger reflow
                    toggle.style.display = '';
                });
            } else {
                console.log('[CK] updateToggleText() - Shadow DOM not found');
            }
        } else {
            console.log('[CK] updateToggleText() - Toggle text not found in content');
        }
    }
    
    updateHideInterfaceModal(content) {
        const modalTitle = this.shadowRoot?.querySelector('#hide-modal-title');
        const modalText = this.shadowRoot?.querySelector('#hide-modal-text');
        const modalAccept = this.shadowRoot?.querySelector('#hide-modal-accept');
        const modalCancel = this.shadowRoot?.querySelector('#hide-modal-cancel');
        
        if (modalTitle && content.hideInterfaceModalTitle) {
            modalTitle.textContent = content.hideInterfaceModalTitle;
        }
        if (modalText && content.hideInterfaceModalText) {
            modalText.textContent = content.hideInterfaceModalText;
        }
        if (modalAccept && content.hideInterfaceModalAccept) {
            modalAccept.textContent = content.hideInterfaceModalAccept;
        }
        if (modalCancel && content.hideInterfaceModalCancel) {
            modalCancel.textContent = content.hideInterfaceModalCancel;
        }
    }
    
    setupHideInterfaceModal() {
        const hideBtn = this.shadowRoot?.querySelector('#hide-interface');
        const modal = this.shadowRoot?.querySelector('#hide-interface-modal');
        const modalClose = this.shadowRoot?.querySelector('#hide-modal-close');
        const modalCancel = this.shadowRoot?.querySelector('#hide-modal-cancel');
        const modalAccept = this.shadowRoot?.querySelector('#hide-modal-accept');
        
        console.log('[CK] Setting up hide interface modal:');
        console.log('[CK] Hide button found:', !!hideBtn);
        console.log('[CK] Modal found:', !!modal);
        console.log('[CK] Modal close found:', !!modalClose);
        console.log('[CK] Modal cancel found:', !!modalCancel);
        console.log('[CK] Modal accept found:', !!modalAccept);
        
        if (hideBtn && modal) {
            console.log('[CK] Adding click listener to hide button');
            hideBtn.addEventListener('click', (e) => {
                console.log('[CK] Hide button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.showHideInterfaceModal();
            });
        } else {
            console.log('[CK] Cannot setup hide button - missing elements');
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.hideHideInterfaceModal();
            });
        }
        
        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                console.log('[CK] Cancel button clicked - ensuring icon is visible');
                this.hideHideInterfaceModal();
                // Ensure icon is visible after canceling
                this.ensureIconVisible();
            });
        }
        
        if (modalAccept) {
            modalAccept.addEventListener('click', () => {
                this.acceptHideInterface();
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideHideInterfaceModal();
                }
            });
        }
    }
    
    showHideInterfaceModal() {
        console.log('[CK] showHideInterfaceModal() called');
        const modal = this.shadowRoot?.querySelector('#hide-interface-modal');
        const panel = this.shadowRoot?.querySelector('#accessibility-panel');
        console.log('[CK] Modal element found:', !!modal);
        console.log('[CK] Panel element found:', !!panel);
        
        if (modal && panel) {
            // Set modal to cover the entire panel content including scrollable areas
            const panelScrollHeight = panel.scrollHeight;
            const panelClientHeight = panel.clientHeight;
            console.log('[CK] Panel scrollHeight:', panelScrollHeight, 'clientHeight:', panelClientHeight);
            
            // Set the modal height to cover the full scrollable content
            modal.style.height = `${panelScrollHeight}px`;
            modal.style.minHeight = `${panelScrollHeight}px`;
            modal.style.display = 'flex';
            
            // Position the modal dialog in the center of the viewable area
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                // Calculate the center position of the viewable area
                const centerTop = (panelClientHeight / 2) - (modalContent.offsetHeight / 2);
                modalContent.style.position = 'absolute';
                modalContent.style.top = `${Math.max(0, centerTop)}px`;
                modalContent.style.left = '50%';
                modalContent.style.transform = 'translateX(-50%)';
                modalContent.style.margin = '0';
            }
            
            console.log('[CK] Hide interface modal shown with height:', panelScrollHeight + 'px');
        } else {
            console.log('[CK] Modal or panel not found!');
        }
    }
    
    hideHideInterfaceModal() {
        const modal = this.shadowRoot?.querySelector('#hide-interface-modal');
        if (modal) {
            modal.style.display = 'none';
            console.log('[CK] Hide interface modal hidden');
        }
    }
    
    ensureIconVisible() {
        console.log('[CK] ensureIconVisible() called');
        const icon = this.shadowRoot?.querySelector('#accessibility-icon');
        const panel = this.shadowRoot?.querySelector('#accessibility-panel');
        
        if (icon) {
            icon.style.display = 'flex';
            icon.style.visibility = 'visible';
            icon.style.opacity = '1';
            console.log('[CK] Icon made visible');
        }
        
        if (panel) {
            panel.style.display = 'none'; // Keep panel hidden unless opened
            console.log('[CK] Panel kept hidden (as expected)');
        }
    }
    
    debugFontSizeConflicts(element) {
        console.log('🔍 [FONT DEBUG] debugFontSizeConflicts() called');
        
        if (!element) {
            console.log('🔍 [FONT DEBUG] No element provided');
            return;
        }
        
        // Get computed styles
        const computedStyle = window.getComputedStyle(element);
        const fontSize = computedStyle.fontSize;
        const fontFamily = computedStyle.fontFamily;
        
        console.log('🔍 [FONT DEBUG] Element computed font-size:', fontSize);
        console.log('🔍 [FONT DEBUG] Element computed font-family:', fontFamily);
        
        // Check inline styles
        const inlineFontSize = element.style.fontSize;
        console.log('🔍 [FONT DEBUG] Element inline font-size:', inlineFontSize || 'none');
        
        // Check for any CSS rules that might be affecting font-size
        const allStyles = document.styleSheets;
        console.log('🔍 [FONT DEBUG] Total stylesheets found:', allStyles.length);
        
        // Check if element has any classes that might affect font-size
        const classes = element.className;
        console.log('🔍 [FONT DEBUG] Element classes:', classes);
        
        // Check parent element font-size
        const parent = element.parentElement;
        if (parent) {
            const parentFontSize = window.getComputedStyle(parent).fontSize;
            console.log('🔍 [FONT DEBUG] Parent element font-size:', parentFontSize);
        }
    }
    
    applyMobileButtonStacking() {
        console.log('📱 [BUTTON STACKING] applyMobileButtonStacking() called');
        
        // Find the action buttons container
        const actionButtons = this.shadowRoot?.querySelector('.action-buttons');
        const buttonRows = this.shadowRoot?.querySelectorAll('.button-row');
        
        console.log('📱 [BUTTON STACKING] Action buttons found:', !!actionButtons);
        console.log('📱 [BUTTON STACKING] Button rows found:', buttonRows?.length || 0);
        
        if (actionButtons) {
            // Stack all buttons vertically on mobile
            actionButtons.style.setProperty('flex-direction', 'column', 'important');
            actionButtons.style.setProperty('gap', '8px', 'important');
            actionButtons.style.setProperty('align-items', 'stretch', 'important');
            console.log('📱 [BUTTON STACKING] Applied vertical stacking to action-buttons');
        }
        
        if (buttonRows && buttonRows.length > 0) {
            buttonRows.forEach((row, index) => {
                // Make each button row stack vertically
                row.style.setProperty('flex-direction', 'column', 'important');
                row.style.setProperty('gap', '8px', 'important');
                row.style.setProperty('width', '100%', 'important');
                console.log(`📱 [BUTTON STACKING] Applied vertical stacking to button-row ${index + 1}`);
            });
        }
        
        // Also ensure individual buttons take full width
        const actionBtns = this.shadowRoot?.querySelectorAll('.action-btn');
        if (actionBtns && actionBtns.length > 0) {
            actionBtns.forEach((btn, index) => {
                btn.style.setProperty('width', '100%', 'important');
                btn.style.setProperty('justify-content', 'center', 'important');
                console.log(`📱 [BUTTON STACKING] Applied full width to action-btn ${index + 1}`);
            });
        }
    }
    
    applyMobileSizeReductions() {
        console.log('📱 [MOBILE SIZES] applyMobileSizeReductions() called');
        
        // Reduce action button sizes
        const actionBtns = this.shadowRoot?.querySelectorAll('.action-btn');
        if (actionBtns && actionBtns.length > 0) {
            actionBtns.forEach((btn, index) => {
                btn.style.setProperty('font-size', '11px', 'important');
                btn.style.setProperty('padding', '6px 10px', 'important');
                btn.style.setProperty('min-height', '30px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced action-btn ${index + 1} size`);
            });
        }
        
        // Reduce toggle switch sizes (label.toggle-switch contains input + span.slider)
        const toggles = this.shadowRoot?.querySelectorAll('label.toggle-switch');
        if (toggles && toggles.length > 0) {
            toggles.forEach((toggle, index) => {
                toggle.style.setProperty('width', '38px', 'important');
                toggle.style.setProperty('height', '22px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced toggle ${index + 1} size`);
            });
        }
        
        // Reduce toggle slider knob (.slider and its pseudo knob)
        const sliders = this.shadowRoot?.querySelectorAll('label.toggle-switch > span.slider');
        if (sliders && sliders.length > 0) {
            sliders.forEach((slider, index) => {
                // Track and bar
                slider.style.setProperty('height', '22px', 'important');
                slider.style.setProperty('border-radius', '22px', 'important');
                slider.style.setProperty('padding', '0', 'important');
                slider.style.setProperty('box-sizing', 'border-box', 'important');
                // Inject a tiny stylesheet to shrink the knob (:before)
                const style = document.createElement('style');
                style.textContent = `
                    @media (max-width: 768px) {
                        .toggle-switch > input + .slider:before { width: 18px !important; height: 18px !important; top: 2px !important; left: 2px !important; }
                    }
                `;
                this.shadowRoot?.appendChild(style);
                console.log(`📱 [MOBILE SIZES] Reduced toggle slider ${index + 1} size`);
            });
        }
        
        // Reduce profile item sizes
        const profileItems = this.shadowRoot?.querySelectorAll('.profile-item');
        if (profileItems && profileItems.length > 0) {
            profileItems.forEach((item, index) => {
                item.style.setProperty('padding', '8px 10px', 'important');
                item.style.setProperty('margin-bottom', '6px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced profile-item ${index + 1} size`);
            });
        }
        
        // Reduce headings and profile titles
        const headerH2 = this.shadowRoot?.querySelector('.panel-header h2');
        if (headerH2) {
            headerH2.style.setProperty('font-size', '16px', 'important');
            headerH2.style.setProperty('line-height', '20px', 'important');
            console.log('📱 [MOBILE SIZES] Reduced main title size');
        }
        const profileTitles = this.shadowRoot?.querySelectorAll('.profile-item h4');
        if (profileTitles && profileTitles.length > 0) {
            profileTitles.forEach((title, index) => {
                title.style.setProperty('font-size', '12px', 'important');
                title.style.setProperty('line-height', '1.3', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced profile-title ${index + 1} size`);
            });
        }
        
        // Reduce profile descriptions
        const profileDescs = this.shadowRoot?.querySelectorAll('.profile-item p');
        if (profileDescs && profileDescs.length > 0) {
            profileDescs.forEach((desc, index) => {
                desc.style.setProperty('font-size', '10px', 'important');
                desc.style.setProperty('line-height', '1.2', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced profile-description ${index + 1} size`);
            });
        }
        
        // Reduce section titles
        const sectionTitles = this.shadowRoot?.querySelectorAll('h3');
        if (sectionTitles && sectionTitles.length > 0) {
            sectionTitles.forEach((title, index) => {
                title.style.setProperty('font-size', '13px', 'important');
                title.style.setProperty('margin-bottom', '8px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced section title ${index + 1} size`);
            });
        }
        
        // Reduce language selector size
        const languageSelector = this.shadowRoot?.querySelector('.language-selector');
        if (languageSelector) {
            languageSelector.style.setProperty('font-size', '11px', 'important');
            languageSelector.style.setProperty('padding', '6px 8px', 'important');
            console.log('📱 [MOBILE SIZES] Reduced language selector size');
        }
        
        // Reduce close button size and fix position - match hide interface modal approach
        const closeBtn = this.shadowRoot?.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.style.setProperty('font-size', '20px', 'important');
            closeBtn.style.setProperty('width', '28px', 'important');
            closeBtn.style.setProperty('height', '28px', 'important');
            closeBtn.style.setProperty('min-width', '28px', 'important');
            closeBtn.style.setProperty('min-height', '28px', 'important');
            closeBtn.style.setProperty('max-width', '28px', 'important');
            closeBtn.style.setProperty('max-height', '28px', 'important');
            closeBtn.style.setProperty('top', '8px', 'important');
            closeBtn.style.setProperty('left', '12px', 'important');
            closeBtn.style.setProperty('display', 'flex', 'important');
            closeBtn.style.setProperty('align-items', 'center', 'important');
            closeBtn.style.setProperty('justify-content', 'center', 'important');
            closeBtn.style.setProperty('box-sizing', 'border-box', 'important');
            console.log('📱 [MOBILE SIZES] Reduced close button size and fixed position');
        }
        
        // Reduce increase/decrease buttons (arrow controls) more on mobile
        const arrowBtns = this.shadowRoot?.querySelectorAll('button[class*="arrow"], button[class*="increase"], button[class*="decrease"], .arrow-btn, .control-btn, .scaling-btn');
        if (arrowBtns && arrowBtns.length > 0) {
            arrowBtns.forEach((btn, index) => {
                btn.style.setProperty('height', '20px', 'important');
                btn.style.setProperty('min-height', '20px', 'important');
                btn.style.setProperty('padding', '1px 6px', 'important');
                btn.style.setProperty('font-size', '9px', 'important');
                btn.style.setProperty('border-radius', '4px', 'important');
                btn.style.setProperty('line-height', '1', 'important');
                btn.style.setProperty('width', 'auto', 'important');
                btn.style.setProperty('min-width', '32px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced arrow button ${index + 1} size (compact)`);
            });
        }
        
        // Add mobile-specific CSS for all control buttons
        const mobileControlStyle = document.createElement('style');
        mobileControlStyle.textContent = `
            @media (max-width: 768px) {
                .scaling-btn, button[class*="increase"], button[class*="decrease"], .arrow-btn, .control-btn {
                    height: 20px !important;
                    min-height: 20px !important;
                    padding: 1px 6px !important;
                    font-size: 9px !important;
                    border-radius: 4px !important;
                    line-height: 1 !important;
                    width: auto !important;
                    min-width: 32px !important;
                }
            }
        `;
        this.shadowRoot?.appendChild(mobileControlStyle);
        console.log('📱 [MOBILE SIZES] Added mobile-specific CSS for control buttons');
        
        // Reduce color picker sizes
        const colorPickers = this.shadowRoot?.querySelectorAll('.color-picker, .color-input, .color-preview, .color-picker-button, input[type="color"]');
        if (colorPickers && colorPickers.length > 0) {
            colorPickers.forEach((picker, index) => {
                picker.style.setProperty('width', '24px', 'important');
                picker.style.setProperty('height', '24px', 'important');
                picker.style.setProperty('min-width', '24px', 'important');
                picker.style.setProperty('min-height', '24px', 'important');
                console.log(`📱 [MOBILE SIZES] Reduced color picker ${index + 1} size`);
            });
        }
        
        // Reduce useful links dropdown size more aggressively
        const usefulLinksDropdown = this.shadowRoot?.querySelector('.useful-links-dropdown');
        if (usefulLinksDropdown) {
            usefulLinksDropdown.style.setProperty('font-size', '10px', 'important');
            usefulLinksDropdown.style.setProperty('padding', '4px 6px', 'important');
            usefulLinksDropdown.style.setProperty('min-height', '28px', 'important');
            usefulLinksDropdown.style.setProperty('margin', '6px 0', 'important');
            usefulLinksDropdown.style.setProperty('border-radius', '6px', 'important');
            console.log('📱 [MOBILE SIZES] Reduced useful links dropdown size');
        }
        
        // Reduce useful links content select size more aggressively
        const usefulLinksSelect = this.shadowRoot?.querySelector('.useful-links-content select');
        if (usefulLinksSelect) {
            usefulLinksSelect.style.setProperty('font-size', '10px', 'important');
            usefulLinksSelect.style.setProperty('padding', '4px 6px', 'important');
            usefulLinksSelect.style.setProperty('min-height', '24px', 'important');
            usefulLinksSelect.style.setProperty('height', '24px', 'important');
            usefulLinksSelect.style.setProperty('line-height', '1.1', 'important');
            usefulLinksSelect.style.setProperty('max-width', '100%', 'important');
            usefulLinksSelect.style.setProperty('box-sizing', 'border-box', 'important');
            usefulLinksSelect.style.setProperty('border-radius', '4px', 'important');
            console.log('📱 [MOBILE SIZES] Reduced useful links select size');
        }
        
        // Add mobile-specific CSS for Useful Links dropdown
        const mobileUsefulLinksStyle = document.createElement('style');
        mobileUsefulLinksStyle.textContent = `
            @media (max-width: 768px) {
                .useful-links-dropdown {
                    font-size: 10px !important;
                    padding: 4px 6px !important;
                    min-height: 28px !important;
                    margin: 6px 0 !important;
                    border-radius: 6px !important;
                }
                .useful-links-content {
                    padding: 6px !important;
                }
                .useful-links-content select {
                    font-size: 10px !important;
                    padding: 4px 6px !important;
                    min-height: 24px !important;
                    height: 24px !important;
                    line-height: 1.1 !important;
                    border-radius: 4px !important;
                }
                .useful-links-content select option {
                    font-size: 10px !important;
                    padding: 4px 6px !important;
                    line-height: 1.1 !important;
                }
            }
        `;
        this.shadowRoot?.appendChild(mobileUsefulLinksStyle);
        console.log('📱 [MOBILE SIZES] Added mobile-specific CSS for Useful Links dropdown');

        // Prevent Useful Links title from shifting when toggle is ON (mobile)
        const usefulLinksProfile = this.shadowRoot?.querySelector('.profile-item.has-dropdown');
        if (usefulLinksProfile) {
            const profileInfo = usefulLinksProfile.querySelector('.profile-info');
            const toggle = usefulLinksProfile.querySelector('.toggle-switch');
            if (profileInfo) {
                // Keep text in normal flow - don't add excessive padding
                profileInfo.style.setProperty('padding-left', '0', 'important');
                profileInfo.style.setProperty('min-width', '0', 'important');
            }
            if (toggle) {
                // Keep toggle in normal flow - don't use absolute positioning
                toggle.style.setProperty('position', 'relative', 'important');
                toggle.style.setProperty('left', 'auto', 'important');
                toggle.style.setProperty('top', 'auto', 'important');
                toggle.style.setProperty('transform', 'none', 'important');
                toggle.style.setProperty('margin', '0', 'important');
            }
            console.log('📱 [MOBILE SIZES] Adjusted Useful Links layout to prevent text shift');
        }
        
        // Increase toggle width when ON to fit text properly and fix text sliding
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .toggle-switch > input:checked + .slider { width: 100% !important; }
            }
            .profile-item .profile-info { 
                min-width: 0 !important; 
                word-wrap: break-word !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
            }
            .profile-item .profile-info h4, .profile-item .profile-info p { 
                white-space: normal !important; 
                overflow: visible !important; 
                text-overflow: unset !important; 
                max-width: 100% !important; 
                word-wrap: break-word !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                hyphens: auto !important;
            }
            /* Ensure useful links toggle works correctly */
            #useful-links:checked + .slider:before {
                transform: translateX(26px) !important;
            }
            
            /* Hide ON/OFF text on mobile screens */
            @media (max-width: 768px) {
                .toggle-switch > input + .slider::after {
                    content: "" !important;
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                .toggle-switch > input:checked + .slider::after {
                    content: "" !important;
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
            }
        `;
        this.shadowRoot?.appendChild(style);
        console.log('📱 [MOBILE SIZES] Added toggle width fix for ON state, text sliding fix, and smaller ON text');
        
        console.log('📱 [MOBILE SIZES] Mobile size reductions applied successfully');
    }
    
    removeMobileButtonStacking() {
        console.log('📱 [REMOVE BUTTON STACKING] removeMobileButtonStacking() called');
        
        // Find the action buttons container
        const actionButtons = this.shadowRoot?.querySelector('.action-buttons');
        const buttonRows = this.shadowRoot?.querySelectorAll('.button-row');
        
        console.log('📱 [REMOVE BUTTON STACKING] Action buttons found:', !!actionButtons);
        console.log('📱 [REMOVE BUTTON STACKING] Button rows found:', buttonRows?.length || 0);
        
        if (actionButtons) {
            // Restore desktop layout
            actionButtons.style.removeProperty('flex-direction');
            actionButtons.style.removeProperty('gap');
            actionButtons.style.removeProperty('align-items');
            console.log('📱 [REMOVE BUTTON STACKING] Removed mobile stacking from action-buttons');
        }
        
        if (buttonRows && buttonRows.length > 0) {
            buttonRows.forEach((row, index) => {
                // Restore desktop button row layout
                row.style.removeProperty('flex-direction');
                row.style.removeProperty('gap');
                row.style.removeProperty('width');
                console.log(`📱 [REMOVE BUTTON STACKING] Removed mobile stacking from button-row ${index + 1}`);
            });
        }
        
        // Restore individual button styles
        const actionBtns = this.shadowRoot?.querySelectorAll('.action-btn');
        if (actionBtns && actionBtns.length > 0) {
            actionBtns.forEach((btn, index) => {
                btn.style.removeProperty('width');
                btn.style.removeProperty('justify-content');
                console.log(`📱 [REMOVE BUTTON STACKING] Removed mobile styles from action-btn ${index + 1}`);
            });
        }
    }
    
    removeMobileSizeReductions() {
        console.log('📱 [REMOVE MOBILE SIZES] removeMobileSizeReductions() called');
        
        // Restore action button sizes
        const actionBtns = this.shadowRoot?.querySelectorAll('.action-btn');
        if (actionBtns && actionBtns.length > 0) {
            actionBtns.forEach((btn, index) => {
                btn.style.removeProperty('font-size');
                btn.style.removeProperty('padding');
                btn.style.removeProperty('min-height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored action-btn ${index + 1} size`);
            });
        }
        
        // Restore toggle switch sizes
        const toggles = this.shadowRoot?.querySelectorAll('.toggle-switch');
        if (toggles && toggles.length > 0) {
            toggles.forEach((toggle, index) => {
                toggle.style.removeProperty('width');
                toggle.style.removeProperty('height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored toggle ${index + 1} size`);
            });
        }
        
        // Restore toggle switch sliders
        const sliders = this.shadowRoot?.querySelectorAll('.toggle-slider');
        if (sliders && sliders.length > 0) {
            sliders.forEach((slider, index) => {
                slider.style.removeProperty('width');
                slider.style.removeProperty('height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored toggle slider ${index + 1} size`);
            });
        }
        
        // Restore profile item sizes
        const profileItems = this.shadowRoot?.querySelectorAll('.profile-item');
        if (profileItems && profileItems.length > 0) {
            profileItems.forEach((item, index) => {
                item.style.removeProperty('padding');
                item.style.removeProperty('margin-bottom');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored profile-item ${index + 1} size`);
            });
        }
        
        // Restore profile titles
        const profileTitles = this.shadowRoot?.querySelectorAll('.profile-title');
        if (profileTitles && profileTitles.length > 0) {
            profileTitles.forEach((title, index) => {
                title.style.removeProperty('font-size');
                title.style.removeProperty('line-height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored profile-title ${index + 1} size`);
            });
        }
        
        // Restore profile descriptions
        const profileDescs = this.shadowRoot?.querySelectorAll('.profile-description');
        if (profileDescs && profileDescs.length > 0) {
            profileDescs.forEach((desc, index) => {
                desc.style.removeProperty('font-size');
                desc.style.removeProperty('line-height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored profile-description ${index + 1} size`);
            });
        }
        
        // Restore section titles
        const sectionTitles = this.shadowRoot?.querySelectorAll('h3');
        if (sectionTitles && sectionTitles.length > 0) {
            sectionTitles.forEach((title, index) => {
                title.style.removeProperty('font-size');
                title.style.removeProperty('margin-bottom');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored section title ${index + 1} size`);
            });
        }
        
        // Restore language selector size
        const languageSelector = this.shadowRoot?.querySelector('.language-selector');
        if (languageSelector) {
            languageSelector.style.removeProperty('font-size');
            languageSelector.style.removeProperty('padding');
            console.log('📱 [REMOVE MOBILE SIZES] Restored language selector size');
        }
        
        // Restore close button size and position
        const closeBtn = this.shadowRoot?.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.style.removeProperty('font-size');
            closeBtn.style.removeProperty('width');
            closeBtn.style.removeProperty('height');
            closeBtn.style.removeProperty('min-width');
            closeBtn.style.removeProperty('min-height');
            closeBtn.style.removeProperty('max-width');
            closeBtn.style.removeProperty('max-height');
            closeBtn.style.removeProperty('top');
            closeBtn.style.removeProperty('left');
            closeBtn.style.removeProperty('display');
            closeBtn.style.removeProperty('align-items');
            closeBtn.style.removeProperty('justify-content');
            closeBtn.style.removeProperty('box-sizing');
            console.log('📱 [REMOVE MOBILE SIZES] Restored close button size and position');
        }
        
        // Restore increase/decrease buttons
        const arrowBtns = this.shadowRoot?.querySelectorAll('button[class*="arrow"], button[class*="increase"], button[class*="decrease"], .arrow-btn, .control-btn');
        if (arrowBtns && arrowBtns.length > 0) {
            arrowBtns.forEach((btn, index) => {
                btn.style.removeProperty('height');
                btn.style.removeProperty('min-height');
                btn.style.removeProperty('padding');
                btn.style.removeProperty('font-size');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored arrow button ${index + 1} size`);
            });
        }
        
        // Restore color picker sizes
        const colorPickers = this.shadowRoot?.querySelectorAll('.color-picker, .color-input, .color-preview, .color-picker-button, input[type="color"]');
        if (colorPickers && colorPickers.length > 0) {
            colorPickers.forEach((picker, index) => {
                picker.style.removeProperty('width');
                picker.style.removeProperty('height');
                picker.style.removeProperty('min-width');
                picker.style.removeProperty('min-height');
                console.log(`📱 [REMOVE MOBILE SIZES] Restored color picker ${index + 1} size`);
            });
        }
        
        // Restore useful links dropdown size
        const usefulLinksDropdown = this.shadowRoot?.querySelector('.useful-links-dropdown');
        if (usefulLinksDropdown) {
            usefulLinksDropdown.style.removeProperty('font-size');
            usefulLinksDropdown.style.removeProperty('padding');
            usefulLinksDropdown.style.removeProperty('min-height');
            console.log('📱 [REMOVE MOBILE SIZES] Restored useful links dropdown size');
        }
        
        // Restore useful links content select size
        const usefulLinksSelect = this.shadowRoot?.querySelector('.useful-links-content select');
        if (usefulLinksSelect) {
            usefulLinksSelect.style.removeProperty('font-size');
            usefulLinksSelect.style.removeProperty('padding');
            usefulLinksSelect.style.removeProperty('min-height');
            console.log('📱 [REMOVE MOBILE SIZES] Restored useful links select size');
        }
        
        // Remove injected toggle width styles
        const injectedStyles = this.shadowRoot?.querySelectorAll('style');
        if (injectedStyles && injectedStyles.length > 0) {
            injectedStyles.forEach(style => {
                if (style.textContent.includes('toggle-switch') || style.textContent.includes('slider:before')) {
                    style.remove();
                    console.log('📱 [REMOVE MOBILE SIZES] Removed injected toggle styles');
                }
            });
        }
        
        console.log('📱 [REMOVE MOBILE SIZES] Mobile size reductions removed successfully');
    }
    
    acceptHideInterface() {
        console.log('[CK] acceptHideInterface() called');
        
        // Set flag in localStorage to hide interface permanently
        localStorage.setItem('accessibility-widget-hidden', 'true');
        console.log('[CK] Set localStorage flag to hide interface');
        
        // Hide the panel and icon completely
        const panel = this.shadowRoot?.querySelector('#accessibility-panel');
        const icon = this.shadowRoot?.querySelector('#accessibility-icon');
        
        console.log('[CK] Found panel:', !!panel);
        console.log('[CK] Found icon:', !!icon);
        
        if (panel) {
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
            panel.style.opacity = '0';
            console.log('[CK] Hidden panel');
        }
        if (icon) {
            icon.style.display = 'none';
            icon.style.visibility = 'hidden';
            icon.style.opacity = '0';
            console.log('[CK] Hidden icon');
        }
        
        // Also hide the entire shadow root container
        const widgetContainer = this.shadowRoot?.host;
        if (widgetContainer) {
            widgetContainer.style.display = 'none';
            widgetContainer.style.visibility = 'hidden';
            console.log('[CK] Hidden widget container');
        }
        
        // Close the modal
        this.hideHideInterfaceModal();
        
        console.log('[CK] Accessibility interface hidden permanently');
    }

    updateTriggerPosition(direction, position) {
        console.log('[CK] updateTriggerPosition() - Direction:', direction, 'Position:', position);
        const normalizedDirection = (direction || '').toLowerCase();
        const pos = (position || '').toLowerCase();
        
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            if (normalizedDirection === 'vertical') {
                // Force remove any existing positioning
                icon.style.removeProperty('top');
                icon.style.removeProperty('bottom');
                icon.style.removeProperty('transform');
                
                if (pos === 'top') {
                    icon.style.setProperty('top', '20px', 'important');
                    icon.style.setProperty('bottom', 'auto', 'important');
                    console.log('[CK] Positioned icon at TOP');
                } else if (pos === 'middle') {
                    icon.style.setProperty('top', '50%', 'important');
                    icon.style.setProperty('bottom', 'auto', 'important');
                    icon.style.setProperty('transform', 'translateY(-50%)', 'important');
                    console.log('[CK] Positioned icon at MIDDLE with transform');
                } else if (pos === 'bottom') {
                    icon.style.setProperty('bottom', '20px', 'important');
                    icon.style.setProperty('top', 'auto', 'important');
                    console.log('[CK] Positioned icon at BOTTOM');
                }
            } else if (normalizedDirection === 'horizontal') {
                // Force remove any existing positioning
                icon.style.removeProperty('left');
                icon.style.removeProperty('right');
                
                if (pos === 'left') {
                    icon.style.setProperty('left', '20px', 'important');
                    icon.style.setProperty('right', 'auto', 'important');
                    console.log('[CK] Positioned icon at LEFT');
                } else if (pos === 'right') {
                    icon.style.setProperty('right', '20px', 'important');
                    icon.style.setProperty('left', 'auto', 'important');
                    console.log('[CK] Positioned icon at RIGHT');
                }
            }
            
            // Force the style to take effect
            icon.offsetHeight; // Trigger reflow
            
            // Apply stored desktop offsets if they exist
            if (this.desktopHorizontalOffset !== undefined) {
                console.log('[CK] updateTriggerPosition() - Applying stored horizontal offset:', this.desktopHorizontalOffset);
                this.updateTriggerOffset('horizontal', this.desktopHorizontalOffset);
            }
            if (this.desktopVerticalOffset !== undefined) {
                console.log('[CK] updateTriggerPosition() - Applying stored vertical offset:', this.desktopVerticalOffset);
                this.updateTriggerOffset('vertical', this.desktopVerticalOffset);
            }
        }
    }
    // Helper methods for applying customizations with actual DOM manipulation
    updateTriggerButtonColor(color) {
        console.log('[CK] updateTriggerButtonColor() - Color:', color);
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            icon.style.backgroundColor = color;
            icon.style.borderColor = color;
            // Ensure icon content is centered
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
        }
    }
    
    updateTriggerButtonShape(shape) {
        console.log('🖥️ [DESKTOP SHAPE] updateTriggerButtonShape() - Shape:', shape);
        console.log('🖥️ [DESKTOP SHAPE] Window width:', window.innerWidth);
        console.log('🖥️ [DESKTOP SHAPE] Is mobile:', window.innerWidth <= 768);
        console.log('🖥️ [DESKTOP SHAPE] Has mobile shape config:', !!this.customizationData?.mobileTriggerShape);
        console.log('🖥️ [DESKTOP SHAPE] Mobile shape config value:', this.customizationData?.mobileTriggerShape);
        
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        
        if (icon) {
            console.log('🖥️ [DESKTOP SHAPE] Icon found:', !!icon);
            console.log('🖥️ [DESKTOP SHAPE] Current icon classes:', icon.className);
            console.log('🖥️ [DESKTOP SHAPE] Current icon data-shape:', icon.getAttribute('data-shape'));
            console.log('🖥️ [DESKTOP SHAPE] Current computed border-radius:', window.getComputedStyle(icon).borderRadius);
            
            // Check if we're on mobile and have mobile shape configuration
            const isMobile = window.innerWidth <= 768;
            const hasMobileShape = this.customizationData?.mobileTriggerShape;
            
            if (isMobile && hasMobileShape) {
                console.log('🖥️ [DESKTOP SHAPE] SKIPPING DESKTOP SHAPE - Mobile device with mobile shape config detected');
                console.log('🖥️ [DESKTOP SHAPE] Mobile shape will be applied by updateMobileTriggerShape()');
                return;
            }
            
            console.log('🖥️ [DESKTOP SHAPE] Proceeding with desktop shape application...');
            
            // Set data attribute for CSS targeting
            icon.setAttribute('data-shape', shape.toLowerCase());
            console.log('🖥️ [DESKTOP SHAPE] Set data-shape to:', shape.toLowerCase());
        
            // Remove any existing border-radius properties
            icon.style.removeProperty('border-radius');
            icon.style.removeProperty('-webkit-border-radius');
            icon.style.removeProperty('-moz-border-radius');
            console.log('🖥️ [DESKTOP SHAPE] Removed existing border-radius properties');
            
            // Set the appropriate border-radius
            let borderRadius = '50%'; // Default circle
            console.log('🖥️ [DESKTOP SHAPE] Shape comparison checks:');
            console.log('🖥️ [DESKTOP SHAPE] - shape === "Circle":', shape === 'Circle');
            console.log('🖥️ [DESKTOP SHAPE] - shape === "Rounded":', shape === 'Rounded');
            console.log('🖥️ [DESKTOP SHAPE] - shape === "Square":', shape === 'Square');
            
            if (shape === 'Circle') {
                borderRadius = '50%';
                console.log('🖥️ [DESKTOP SHAPE] Detected Circle shape, setting border-radius to 50%');
            } else if (shape === 'Rounded') {
                borderRadius = '12px';
                console.log('🖥️ [DESKTOP SHAPE] Detected Rounded shape, setting border-radius to 12px for rounded square');
            } else if (shape === 'Square') {
                borderRadius = '0px';
                console.log('🖥️ [DESKTOP SHAPE] Detected Square shape, setting border-radius to 0px');
            } else {
                console.warn('🖥️ [DESKTOP SHAPE] Unknown shape:', shape, 'defaulting to 50%');
            }
            
            console.log('🖥️ [DESKTOP SHAPE] Target border-radius:', borderRadius);
            
            // Apply the border-radius with maximum specificity
            icon.style.setProperty('border-radius', borderRadius, 'important');
            icon.style.setProperty('-webkit-border-radius', borderRadius, 'important');
            icon.style.setProperty('-moz-border-radius', borderRadius, 'important');
            console.log('🖥️ [DESKTOP SHAPE] Applied border-radius with !important:', borderRadius);
            
            // Update CSS classes
            icon.classList.remove('circle', 'rounded', 'square');
            icon.classList.add(shape.toLowerCase());
            console.log('🖥️ [DESKTOP SHAPE] Updated classes to:', icon.className);
            
            // Force the shape with direct style assignment as backup
            icon.style.borderRadius = borderRadius;
            icon.style.webkitBorderRadius = borderRadius;
            icon.style.mozBorderRadius = borderRadius;
            console.log('🖥️ [DESKTOP SHAPE] Applied direct style assignment as backup');
            
            // Force a reflow to ensure styles are applied
            icon.offsetHeight;
            
            console.log('🖥️ [DESKTOP SHAPE] Applied shape:', shape, 'with border-radius:', borderRadius);
            
            // Detailed verification
            const computedStyle = window.getComputedStyle(icon);
            const appliedBorderRadius = computedStyle.borderRadius;
            console.log('🖥️ [DESKTOP SHAPE] Computed border-radius after application:', appliedBorderRadius);
            console.log('🖥️ [DESKTOP SHAPE] Inline style border-radius:', icon.style.borderRadius);
            console.log('🖥️ [DESKTOP SHAPE] Data-shape attribute:', icon.getAttribute('data-shape'));
            console.log('🖥️ [DESKTOP SHAPE] Icon classes after update:', icon.className);
            
            if (appliedBorderRadius === borderRadius) {
                console.log('🖥️ [DESKTOP SHAPE] ✅ SUCCESS: Desktop shape applied correctly!');
            } else {
                console.error('🖥️ [DESKTOP SHAPE] ❌ FAILED: Expected', borderRadius, 'but got', appliedBorderRadius);
            }
            
            // Final verification after a delay
            setTimeout(() => {
                const finalComputed = window.getComputedStyle(icon).borderRadius;
                console.log('🖥️ [DESKTOP SHAPE] Final verification after delay:', finalComputed);
                if (finalComputed === borderRadius) {
                    console.log('🖥️ [DESKTOP SHAPE] ✅ FINAL SUCCESS: Desktop shape maintained!');
                } else {
                    console.error('🖥️ [DESKTOP SHAPE] ❌ FINAL FAILED: Shape changed to', finalComputed);
                    console.log('🖥️ [DESKTOP SHAPE] 🔧 FORCING SHAPE FIX...');
                    
                    // Ultra-aggressive force fix
                    icon.style.setProperty('border-radius', borderRadius, 'important');
                    icon.style.setProperty('-webkit-border-radius', borderRadius, 'important');
                    icon.style.setProperty('-moz-border-radius', borderRadius, 'important');
                    icon.style.borderRadius = borderRadius;
                    icon.style.webkitBorderRadius = borderRadius;
                    icon.style.mozBorderRadius = borderRadius;
                    
                    // Force reflow
                    icon.offsetHeight;
                    
                    const finalFinalComputed = window.getComputedStyle(icon).borderRadius;
                    console.log('🖥️ [DESKTOP SHAPE] After force fix:', finalFinalComputed);
                    
                    // Last resort: Create a new style element with maximum specificity
                    if (finalFinalComputed !== borderRadius) {
                        console.log('🖥️ [DESKTOP SHAPE] 🔧 LAST RESORT: Injecting external style element...');
                        const style = document.createElement('style');
                        style.textContent = `
                            .accessibility-icon[data-shape="rounded"] {
                                border-radius: ${borderRadius} !important;
                                -webkit-border-radius: ${borderRadius} !important;
                                -moz-border-radius: ${borderRadius} !important;
                            }
                            .accessibility-icon.rounded {
                                border-radius: ${borderRadius} !important;
                                -webkit-border-radius: ${borderRadius} !important;
                                -moz-border-radius: ${borderRadius} !important;
                            }
                        `;
                        document.head.appendChild(style);
                        console.log('🖥️ [DESKTOP SHAPE] 🔧 External style element injected');
                    }
                }
            }, 100);
            
            // Additional debugging
            console.log('[CK] Icon inline style border-radius:', icon.style.borderRadius);
            console.log('[CK] Icon final HTML:', icon.outerHTML);
            
            // Force apply after a short delay to override any conflicting styles
            setTimeout(() => {
                console.log('[CK] === TIMEOUT FORCE APPLICATION ===');
                if (shape === 'Rounded') {
                    icon.style.setProperty('border-radius', '12px', 'important');
                    icon.style.setProperty('-webkit-border-radius', '12px', 'important');
                    icon.style.setProperty('-moz-border-radius', '12px', 'important');
                    icon.style.setProperty('border-top-left-radius', '12px', 'important');
                    icon.style.setProperty('border-top-right-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-left-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-right-radius', '12px', 'important');
                    console.log('[CK] Force applied rounded shape after timeout');
                }
                
                const finalComputedStyle = window.getComputedStyle(icon);
                const finalBorderRadius = finalComputedStyle.borderRadius;
                console.log('[CK] Final computed border-radius after timeout:', finalBorderRadius);
            }, 100);
            
            // Additional force application after external CSS loads
            setTimeout(() => {
                console.log('[CK] === EXTERNAL CSS OVERRIDE FORCE ===');
                if (shape === 'Rounded') {
                    icon.style.setProperty('border-radius', '12px', 'important');
                    icon.style.setProperty('-webkit-border-radius', '12px', 'important');
                    icon.style.setProperty('-moz-border-radius', '12px', 'important');
                    icon.style.setProperty('border-top-left-radius', '12px', 'important');
                    icon.style.setProperty('border-top-right-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-left-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-right-radius', '12px', 'important');
                    console.log('[CK] External CSS override applied');
                }
                
                const finalComputedStyle2 = window.getComputedStyle(icon);
                const finalBorderRadius2 = finalComputedStyle2.borderRadius;
                console.log('[CK] Final computed border-radius after external CSS override:', finalBorderRadius2);
            }, 500);
            
            // Final aggressive force application
            setTimeout(() => {
                console.log('[CK] === FINAL AGGRESSIVE FORCE ===');
                if (shape === 'Rounded') {
                    // Remove any conflicting styles first
                    icon.style.removeProperty('border-radius');
                    icon.style.removeProperty('-webkit-border-radius');
                    icon.style.removeProperty('-moz-border-radius');
                    
                    // Apply rounded shape with maximum force
                    icon.style.setProperty('border-radius', '12px', 'important');
                    icon.style.setProperty('-webkit-border-radius', '12px', 'important');
                    icon.style.setProperty('-moz-border-radius', '12px', 'important');
                    icon.style.setProperty('border-top-left-radius', '12px', 'important');
                    icon.style.setProperty('border-top-right-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-left-radius', '12px', 'important');
                    icon.style.setProperty('border-bottom-right-radius', '12px', 'important');
                    
                    // Force reflow
                    icon.offsetHeight;
                    
                    console.log('[CK] Final aggressive force applied');
                }
                
                const finalComputedStyle3 = window.getComputedStyle(icon);
                const finalBorderRadius3 = finalComputedStyle3.borderRadius;
                console.log('[CK] Final computed border-radius after aggressive force:', finalBorderRadius3);
            }, 1000);
        } else {
            console.error('[CK] Icon not found!');
        }
    }
    
    // Ensure base panel CSS is always applied
    ensureBasePanelCSS() {
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        if (panel) {
            // Apply essential base CSS properties that should never be removed
            panel.style.setProperty('position', 'fixed', 'important');
            panel.style.setProperty('z-index', '100000', 'important');
            panel.style.setProperty('background', '#ffffff', 'important');
            panel.style.setProperty('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 'important');
            panel.style.setProperty('border-radius', '8px', 'important');
            panel.style.setProperty('font-family', "'DM Sans', sans-serif", 'important');
            panel.style.setProperty('pointer-events', 'auto', 'important');
            panel.style.setProperty('overflow-y', 'auto', 'important');
            panel.style.setProperty('overflow-x', 'hidden', 'important');
            panel.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
            panel.style.setProperty('scroll-behavior', 'smooth', 'important');
            panel.style.setProperty('overscroll-behavior', 'contain', 'important');
            
            // Add text wrapping to ensure all text is visible
            panel.style.setProperty('word-wrap', 'break-word', 'important');
            panel.style.setProperty('word-break', 'break-word', 'important');
            panel.style.setProperty('overflow-wrap', 'break-word', 'important');
            panel.style.setProperty('hyphens', 'auto', 'important');
            
            console.log('🔧 [BASE CSS] Applied essential panel CSS properties');
        }
    }
    
    // Force apply mobile responsive styles
    applyMobileResponsiveStyles() {
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        
        console.log('📱 [MOBILE RESPONSIVE] applyMobileResponsiveStyles() called');
        console.log('📱 [MOBILE RESPONSIVE] Panel found:', !!panel);
        console.log('📱 [MOBILE RESPONSIVE] Icon found:', !!icon);
        
        if (panel && icon) {
            // First ensure base CSS is applied
            this.ensureBasePanelCSS();
            
            const screenWidth = window.innerWidth;
            console.log('📱 [MOBILE RESPONSIVE] Screen width:', screenWidth);
            
            // Log current font sizes before changes
            const currentPanelFontSize = window.getComputedStyle(panel).fontSize;
            console.log('📱 [MOBILE RESPONSIVE] Current panel font-size:', currentPanelFontSize);
            
            if (screenWidth <= 480) {
                // Mobile Portrait - Wider but compact
                console.log('📱 [MOBILE RESPONSIVE] Applying mobile portrait styles (≤480px)');
                console.log('📱 [MOBILE RESPONSIVE] Setting panel font-size to 12px');
                panel.style.setProperty('width', '75vw', 'important');
                panel.style.setProperty('max-width', '320px', 'important');
                panel.style.setProperty('left', '12.5vw', 'important');
                panel.style.setProperty('font-size', '12px', 'important');
                panel.style.setProperty('padding', '12px', 'important');
                panel.style.setProperty('max-height', '70vh', 'important');
                
                // Verify font-size was applied
                const newPanelFontSize = window.getComputedStyle(panel).fontSize;
                console.log('📱 [MOBILE RESPONSIVE] New panel font-size after setting:', newPanelFontSize);
                
                // Apply mobile button stacking
                this.applyMobileButtonStacking();
                
                // Apply mobile size reductions
                this.applyMobileSizeReductions();
                
                // Debug any font-size conflicts
                this.debugFontSizeConflicts(panel);
                
                icon.style.setProperty('width', '40px', 'important');
                icon.style.setProperty('height', '40px', 'important');
                
                const iconI = icon.querySelector('i');
                if (iconI) {
                    console.log('📱 [MOBILE RESPONSIVE] Setting icon font-size to 16px');
                    iconI.style.setProperty('font-size', '16px', 'important');
                    const newIconFontSize = window.getComputedStyle(iconI).fontSize;
                    console.log('📱 [MOBILE RESPONSIVE] New icon font-size after setting:', newIconFontSize);
                } else {
                    console.log('📱 [MOBILE RESPONSIVE] Icon <i> element not found!');
                }
            } else if (screenWidth <= 768) {
                // Mobile Landscape - Wider panel
                console.log('📱 [MOBILE RESPONSIVE] Applying mobile landscape styles (≤768px)');
                console.log('📱 [MOBILE RESPONSIVE] Setting panel font-size to 13px');
                panel.style.setProperty('width', '80vw', 'important');
                panel.style.setProperty('max-width', '380px', 'important');
                panel.style.setProperty('left', '10vw', 'important');
                panel.style.setProperty('font-size', '13px', 'important');
                panel.style.setProperty('padding', '14px', 'important');
                panel.style.setProperty('max-height', '75vh', 'important');
                
                // Apply mobile button stacking
                this.applyMobileButtonStacking();
                
                // Apply mobile size reductions
                this.applyMobileSizeReductions();
                
                // Verify font-size was applied
                const newPanelFontSize = window.getComputedStyle(panel).fontSize;
                console.log('📱 [MOBILE RESPONSIVE] New panel font-size after setting:', newPanelFontSize);
                
                // Debug any font-size conflicts
                this.debugFontSizeConflicts(panel);
                
                icon.style.setProperty('width', '45px', 'important');
                icon.style.setProperty('height', '45px', 'important');
                
                const iconI = icon.querySelector('i');
                if (iconI) {
                    console.log('📱 [MOBILE RESPONSIVE] Setting icon font-size to 18px');
                    iconI.style.setProperty('font-size', '18px', 'important');
                    const newIconFontSize = window.getComputedStyle(iconI).fontSize;
                    console.log('📱 [MOBILE RESPONSIVE] New icon font-size after setting:', newIconFontSize);
                } else {
                    console.log('📱 [MOBILE RESPONSIVE] Icon <i> element not found!');
                }
            } else if (screenWidth >= 1025 && screenWidth <= 1366) {
                // Large Tablets (iPad Air, iPad Pro, Surface Pro, etc.) - Position panel very close to icon
                console.log('[CK] Applying large tablet styles - positioning very close to icon');
                panel.style.setProperty('width', '65vw', 'important');
                panel.style.setProperty('max-width', '450px', 'important');
                panel.style.setProperty('left', '0.5vw', 'important');
                panel.style.setProperty('font-size', '15px');
                panel.style.setProperty('padding', '18px', 'important');
                panel.style.setProperty('max-height', '85vh', 'important');
                
                icon.style.setProperty('width', '55px', 'important');
                icon.style.setProperty('height', '55px', 'important');
                
                const iconI = icon.querySelector('i');
                if (iconI) {
                    iconI.style.setProperty('font-size', '22px');
                }
            } else if (screenWidth >= 820 && screenWidth <= 1024) {
                // Tablet/iPad 820px+ - Position panel very close to icon
                console.log('[CK] Applying tablet 820px+ styles - positioning very close to icon');
                panel.style.setProperty('width', '75vw', 'important');
                panel.style.setProperty('max-width', '380px', 'important');
                panel.style.setProperty('left', '1vw', 'important');
                panel.style.setProperty('font-size', '14px');
                panel.style.setProperty('padding', '16px', 'important');
                panel.style.setProperty('max-height', '80vh', 'important');
                
                icon.style.setProperty('width', '50px', 'important');
                icon.style.setProperty('height', '50px', 'important');
                
                const iconI = icon.querySelector('i');
                if (iconI) {
                    iconI.style.setProperty('font-size', '20px');
                }
            } else if (screenWidth <= 1024) {
                // iPad Mini - Much wider panel positioned close to icon
                console.log('[CK] Applying iPad mini styles - positioning close to icon');
                panel.style.setProperty('width', '85vw', 'important');
                panel.style.setProperty('max-width', '450px', 'important');
                panel.style.setProperty('left', '5vw', 'important');
                panel.style.setProperty('font-size', '14px');
                panel.style.setProperty('padding', '16px', 'important');
                panel.style.setProperty('max-height', '80vh', 'important');
                
                icon.style.setProperty('width', '50px', 'important');
                icon.style.setProperty('height', '50px', 'important');
                
                const iconI = icon.querySelector('i');
                if (iconI) {
                    iconI.style.setProperty('font-size', '20px');
                }
            }
            
            // Common mobile styles
            panel.style.setProperty('right', 'auto', 'important');
            panel.style.setProperty('top', '50%', 'important');
            panel.style.setProperty('transform', 'translateY(-50%)', 'important');
            panel.style.setProperty('overflow-y', 'auto', 'important');
            panel.style.setProperty('position', 'fixed', 'important');
            panel.style.setProperty('z-index', '9999', 'important');
        }
    }
    
    // Remove mobile responsive styles for desktop
    removeMobileResponsiveStyles() {
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        
        console.log('📱 [REMOVE MOBILE] removeMobileResponsiveStyles() called');
        console.log('📱 [REMOVE MOBILE] Panel found:', !!panel);
        console.log('📱 [REMOVE MOBILE] Icon found:', !!icon);
        
        if (panel && icon) {
            // First ensure base CSS is applied
            this.ensureBasePanelCSS();
            
            // Log current font sizes before removing
            const currentPanelFontSize = window.getComputedStyle(panel).fontSize;
            console.log('📱 [REMOVE MOBILE] Current panel font-size before removal:', currentPanelFontSize);
            
            console.log('📱 [REMOVE MOBILE] Removing mobile responsive styles - restoring desktop styles');
            
            // Remove mobile-specific styles to allow desktop CSS to take over
            console.log('📱 [REMOVE MOBILE] Removing panel font-size property');
            panel.style.removeProperty('width');
            panel.style.removeProperty('max-width');
            panel.style.removeProperty('left');
            panel.style.removeProperty('right');
            panel.style.removeProperty('top');
            panel.style.removeProperty('transform');
            panel.style.removeProperty('max-height');
            panel.style.removeProperty('font-size');
            panel.style.removeProperty('padding');
            
            // Check font-size after removal
            const newPanelFontSize = window.getComputedStyle(panel).fontSize;
            console.log('📱 [REMOVE MOBILE] Panel font-size after removal:', newPanelFontSize);
            
            // Check for any CSS rules that might be overriding font-size
            this.debugFontSizeConflicts(panel);
            
            // Remove mobile button stacking
            this.removeMobileButtonStacking();
            
            // Remove mobile size reductions
            this.removeMobileSizeReductions();
            
            // Remove mobile icon styles
            icon.style.removeProperty('width');
            icon.style.removeProperty('height');
            
            const iconI = icon.querySelector('i');
            if (iconI) {
                iconI.style.removeProperty('font-size');
            }
        }
    }
    
    
    updateTriggerOffset(direction, offset) {
        console.log('[CK] updateTriggerOffset() - Direction:', direction, 'Offset:', offset);
        
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            console.log('[CK] updateTriggerOffset() - Is mobile:', isMobile);
            
            // Only apply desktop offsets on desktop/tablet
            if (!isMobile) {
                console.log('[CK] updateTriggerOffset() - Applying desktop offset');
                const cs = window.getComputedStyle(icon);
                const currentLeftRaw = icon.style.left || cs.left;
                const currentRightRaw = icon.style.right || cs.right;
                const currentTopRaw = icon.style.top || cs.top;
                const currentBottomRaw = icon.style.bottom || cs.bottom;
                const currentTransformRaw = icon.style.transform || cs.transform || '';

                console.log('[CK] updateTriggerOffset() - Current positioning (computed):');
                console.log('[CK] updateTriggerOffset() - left:', currentLeftRaw);
                console.log('[CK] updateTriggerOffset() - right:', currentRightRaw);
                console.log('[CK] updateTriggerOffset() - top:', currentTopRaw);
                console.log('[CK] updateTriggerOffset() - bottom:', currentBottomRaw);
                console.log('[CK] updateTriggerOffset() - transform:', currentTransformRaw);

                const normalizedOffset = (typeof offset === 'number' || /^-?\d+$/.test(String(offset))) ? `${offset}px` : String(offset);
                
            if (direction === 'horizontal') {
                    // Check which side the icon is positioned on
                    console.log('[CK] updateTriggerOffset() - Checking horizontal positioning...');
                    console.log('[CK] updateTriggerOffset() - currentLeftRaw:', currentLeftRaw, 'is not auto:', currentLeftRaw !== 'auto', 'is not 0px:', currentLeftRaw !== '0px');
                    console.log('[CK] updateTriggerOffset() - currentRightRaw:', currentRightRaw, 'is not auto:', currentRightRaw !== 'auto', 'is not 0px:', currentRightRaw !== '0px');
                    
                    if (currentLeftRaw && currentLeftRaw !== 'auto' && currentLeftRaw !== '0px' && currentLeftRaw !== '0') {
                        // Icon is positioned from left
                        const currentLeft = currentLeftRaw;
                        const newLeft = currentLeft.includes('calc') ? 
                            currentLeft.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentLeft} + ${normalizedOffset})`;
                        icon.style.setProperty('left', newLeft, 'important');
                        console.log('[CK] updateTriggerOffset() - Applied horizontal offset to left:', newLeft);
                    } else if (currentRightRaw && currentRightRaw !== 'auto' && currentRightRaw !== '0px' && currentRightRaw !== '0') {
                        // Icon is positioned from right
                        const currentRight = currentRightRaw;
                        const newRight = currentRight.includes('calc') ? 
                            currentRight.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentRight} + ${normalizedOffset})`;
                        icon.style.setProperty('right', newRight, 'important');
                        console.log('[CK] updateTriggerOffset() - Applied horizontal offset to right:', newRight);
                    } else {
                        console.log('[CK] updateTriggerOffset() - No valid horizontal positioning found, trying to apply to left as default');
                        // Default to left positioning if no clear positioning is found
                        const defaultLeft = '20px';
                        const newLeft = `calc(${defaultLeft} + ${normalizedOffset})`;
                        icon.style.setProperty('left', newLeft, 'important');
                        icon.style.setProperty('right', 'auto', 'important');
                        console.log('[CK] updateTriggerOffset() - Applied horizontal offset to default left:', newLeft);
                }
            } else if (direction === 'vertical') {
                    // Check which side the icon is positioned on
                    console.log('[CK] updateTriggerOffset() - Checking vertical positioning...');
                    console.log('[CK] updateTriggerOffset() - currentTopRaw:', currentTopRaw, 'is not auto:', currentTopRaw !== 'auto', 'is not 0px:', currentTopRaw !== '0px');
                    console.log('[CK] updateTriggerOffset() - currentBottomRaw:', currentBottomRaw, 'is not auto:', currentBottomRaw !== 'auto', 'is not 0px:', currentBottomRaw !== '0px');
                    
                    if (currentTopRaw && currentTopRaw !== 'auto' && currentTopRaw !== '0px' && currentTopRaw !== '0') {
                        // Icon is positioned from top
                        const currentTop = currentTopRaw;
                        if (currentTop === '50%') {
                            // For middle position, adjust the transform
                            const currentTransform = currentTransformRaw || 'translateY(-50%)';
                            const newTransform = currentTransform.includes('calc') ? 
                                currentTransform.replace(')', ` + ${normalizedOffset})`) : 
                                `translateY(calc(-50% + ${normalizedOffset}))`;
                            icon.style.setProperty('transform', newTransform, 'important');
                            console.log('[CK] updateTriggerOffset() - Applied vertical offset to middle position:', newTransform);
                    } else {
                            const newTop = currentTop.includes('calc') ? 
                                currentTop.replace(')', ` + ${normalizedOffset})`) : 
                                `calc(${currentTop} + ${normalizedOffset})`;
                            icon.style.setProperty('top', newTop, 'important');
                            console.log('[CK] updateTriggerOffset() - Applied vertical offset to top:', newTop);
                        }
                    } else if (currentBottomRaw && currentBottomRaw !== 'auto' && currentBottomRaw !== '0px' && currentBottomRaw !== '0') {
                        // Icon is positioned from bottom
                        const currentBottom = currentBottomRaw;
                        const newBottom = currentBottom.includes('calc') ? 
                            currentBottom.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentBottom} + ${normalizedOffset})`;
                        icon.style.setProperty('bottom', newBottom, 'important');
                        console.log('[CK] updateTriggerOffset() - Applied vertical offset to bottom:', newBottom);
                    } else {
                        console.log('[CK] updateTriggerOffset() - No valid vertical positioning found, trying to apply to top as default');
                        // Default to top positioning if no clear positioning is found
                        const defaultTop = '20px';
                        const newTop = `calc(${defaultTop} + ${normalizedOffset})`;
                        icon.style.setProperty('top', newTop, 'important');
                        icon.style.setProperty('bottom', 'auto', 'important');
                        console.log('[CK] updateTriggerOffset() - Applied vertical offset to default top:', newTop);
                    }
                }
                
                console.log('[CK] updateTriggerOffset() - Final positioning after offset:');
                console.log('[CK] updateTriggerOffset() - left:', icon.style.left);
                console.log('[CK] updateTriggerOffset() - right:', icon.style.right);
                console.log('[CK] updateTriggerOffset() - top:', icon.style.top);
                console.log('[CK] updateTriggerOffset() - bottom:', icon.style.bottom);
                console.log('[CK] updateTriggerOffset() - transform:', icon.style.transform);
            } else {
                console.log('[CK] updateTriggerOffset() - On mobile, storing offset for later application');
                // Store the offset values for when desktop positioning is applied
                this.desktopHorizontalOffset = direction === 'horizontal' ? offset : (this.desktopHorizontalOffset || 0);
                this.desktopVerticalOffset = direction === 'vertical' ? offset : (this.desktopVerticalOffset || 0);
            }
        }
    }
    
    updateTriggerButtonSize(size) {
        console.log('[CK] updateTriggerButtonSize() - Size:', size);
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            if (size === 'Small') {
                icon.style.width = '40px';
                icon.style.height = '40px';
                icon.style.fontSize = '16px';
            } else if (size === 'Medium') {
                icon.style.width = '50px';
                icon.style.height = '50px';
                icon.style.fontSize = '20px';
            } else if (size === 'Large') {
                icon.style.width = '60px';
                icon.style.height = '60px';
                icon.style.fontSize = '24px';
            }
        }
    }
    
    updateTriggerVisibility(hidden) {
        console.log('[CK] updateTriggerVisibility() - Hidden:', hidden);
        // Instead of directly manipulating styles, call showIcon() to re-evaluate all visibility rules
        console.log('[CK] updateTriggerVisibility() - Calling showIcon() to re-evaluate visibility');
        this.showIcon();
    }
    
    updateInterfaceColor(color) {
        console.log('[CK] updateInterfaceColor() - Color:', color);
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        if (panel) {
            panel.style.backgroundColor = color;
        }
    }
    
    updateInterfacePosition() {
        console.log('[CK] updateInterfacePosition() - Positioning panel on top of icon');
        
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        
        if (icon && panel) {
            const iconRect = icon.getBoundingClientRect();
            const panelWidth = 500;
            const panelHeight = 700;
            
            console.log('[CK] Icon position:', {
                left: iconRect.left,
                right: iconRect.right,
                top: iconRect.top,
                bottom: iconRect.bottom,
                width: iconRect.width,
                height: iconRect.height
            });
            
            // Force remove all positioning first
            panel.style.removeProperty('left');
            panel.style.removeProperty('right');
            panel.style.removeProperty('top');
            panel.style.removeProperty('bottom');
            panel.style.removeProperty('transform');

            // Position panel on top of the icon (centered horizontally)
            const iconCenterX = iconRect.left + (iconRect.width / 2);
            const panelLeft = iconCenterX - (panelWidth / 2);
            
            // Ensure panel doesn't go outside viewport horizontally
            const finalLeft = Math.max(20, Math.min(panelLeft, window.innerWidth - panelWidth - 20));
            
            // Position panel vertically centered with icon
            const iconCenterY = iconRect.top + (iconRect.height / 2);
            const panelCenterY = iconCenterY;
            const topPosition = panelCenterY - (panelHeight / 2);
            
            // Ensure panel doesn't go above or below viewport
            const finalTop = Math.max(20, Math.min(topPosition, window.innerHeight - panelHeight - 20));
            
            panel.style.setProperty('left', `${finalLeft}px`, 'important');
            panel.style.setProperty('right', 'auto', 'important');
            panel.style.setProperty('bottom', 'auto', 'important');
            panel.style.setProperty('top', `${finalTop}px`, 'important');
            panel.style.setProperty('transform', 'none', 'important');
            panel.style.setProperty('z-index', '100001', 'important'); // Higher than icon
            panel.style.setProperty('position', 'fixed', 'important');
            
            console.log('[CK] Panel positioned on top of icon at:', {
                left: finalLeft + 'px',
                top: finalTop + 'px',
                iconCenterX: iconCenterX,
                iconCenterY: iconCenterY,
                panelWidth: panelWidth,
                panelHeight: panelHeight
            });
        }
    }

    updateInterfaceFooter(content) {
        console.log('[CK] updateInterfaceFooter() - Content:', content);
        let footer = this.shadowRoot?.getElementById('accessibility-footer');
        if (!footer) {
            // Create footer if it doesn't exist
            footer = document.createElement('div');
            footer.id = 'accessibility-footer';
            footer.style.padding = '10px';
            footer.style.borderTop = '1px solid #eee';
            footer.style.fontSize = '12px';
            footer.style.color = '#666';
            const panel = this.shadowRoot?.getElementById('accessibility-panel');
            if (panel) {
                panel.appendChild(footer);
            }
        }
        if (footer) {
            footer.textContent = content;
        }
    }
    
    updateAccessibilityStatementLink(link) {
        console.log('[CK] updateAccessibilityStatementLink() - Link:', link);
        let statementLink = this.shadowRoot?.getElementById('accessibility-statement-link');
        if (!statementLink) {
            // Create link if it doesn't exist
            statementLink = document.createElement('a');
            statementLink.id = 'accessibility-statement-link';
            statementLink.style.display = 'block';
            statementLink.style.padding = '10px';
            statementLink.style.textAlign = 'center';
            statementLink.style.color = '#007bff';
            statementLink.style.textDecoration = 'none';
            statementLink.style.fontSize = '12px';
            statementLink.target = '_blank';
            const panel = this.shadowRoot?.getElementById('accessibility-panel');
            if (panel) {
                panel.appendChild(statementLink);
            }
        }
        if (statementLink) {
            statementLink.href = link;
            statementLink.textContent = 'Accessibility Statement';
        }
    }
    
    updateSelectedIcon(icon) {
        console.log('[CK] updateSelectedIcon() - Icon:', icon);
        const iconElement = this.shadowRoot?.getElementById('accessibility-icon');
        if (iconElement) {
            // Map icon names to FontAwesome classes
            const iconMap = {
                'accessibility': 'fas fa-universal-access',
                'wheelchair': 'fas fa-wheelchair',
                'eye': 'fas fa-eye',
                'ear': 'fas fa-deaf',
                'brain': 'fas fa-brain',
                'hand': 'fas fa-hand-paper',
                'heart': 'fas fa-heart',
                'star': 'fas fa-star',
                'gear': 'fas fa-cog',
                'settings': 'fas fa-sliders-h'
            };
            
            const iconClass = iconMap[icon] || 'fas fa-universal-access';
            
            // Clear existing content and add the new icon
            iconElement.innerHTML = `<i class="${iconClass}"></i>`;
            
            // Ensure proper styling
            iconElement.style.display = 'flex';
            iconElement.style.alignItems = 'center';
            iconElement.style.justifyContent = 'center';
            iconElement.style.color = '#ffffff';
            iconElement.style.fontSize = 'inherit';
        }
    }
    
    updateSelectedIconName(name) {
        console.log('[CK] updateSelectedIconName() - Name:', name);
        // This is mainly for reference, the icon name is used in updateSelectedIcon
        // You could add a title attribute or aria-label here if needed
        const iconElement = this.shadowRoot?.getElementById('accessibility-icon');
        if (iconElement) {
            iconElement.setAttribute('aria-label', name);
            iconElement.setAttribute('title', name);
        }
    }
    
    updateMobileVisibility(visible) {
        console.log('[CK] updateMobileVisibility() - Visible:', visible);
        // Instead of directly manipulating styles, call showIcon() to re-evaluate all visibility rules
        console.log('[CK] updateMobileVisibility() - Calling showIcon() to re-evaluate visibility');
        this.showIcon();
    }
    
    updateMobileTriggerPosition(direction, position) {
        console.log('[CK] updateMobileTriggerPosition() - Direction:', direction, 'Position:', position);
        const normalizedDirection = (direction || '').toLowerCase();
        const pos = (position || '').toLowerCase();
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // First, clear all existing positioning
                icon.style.removeProperty('top');
                icon.style.removeProperty('bottom');
                icon.style.removeProperty('left');
                icon.style.removeProperty('right');
                icon.style.removeProperty('transform');
                
                if (normalizedDirection === 'horizontal') {
                    if (pos === 'left') {
                        icon.style.setProperty('left', '10px');
                        icon.style.setProperty('right', 'auto');
                        console.log('[CK] Mobile icon positioned LEFT');
                    } else if (pos === 'right') {
                        icon.style.setProperty('right', '10px');
                        icon.style.setProperty('left', 'auto');
                        console.log('[CK] Mobile icon positioned RIGHT');
                    }
                } else if (normalizedDirection === 'vertical') {
                    if (pos === 'top') {
                        icon.style.setProperty('top', '10px');
                        icon.style.setProperty('bottom', 'auto');
                        icon.style.setProperty('transform', 'none');
                        console.log('[CK] Mobile icon positioned TOP');
                    } else if (pos === 'bottom') {
                        icon.style.setProperty('bottom', '10px');
                        icon.style.setProperty('top', 'auto');
                        icon.style.setProperty('transform', 'none');
                        console.log('[CK] Mobile icon positioned BOTTOM');
                    } else if (pos === 'middle') {
                        icon.style.setProperty('top', '50%');
                        icon.style.setProperty('bottom', 'auto');
                        icon.style.setProperty('transform', 'translateY(-50%)');
                        console.log('[CK] Mobile icon positioned MIDDLE with transform');
                    }
                }
            }
        }
    }
    
    // New method to handle combined positioning (e.g., "right middle")
    updateMobileTriggerCombinedPosition(horizontalPos, verticalPos) {
        console.log('📱 [MOBILE POSITION] updateMobileTriggerCombinedPosition() - Horizontal:', horizontalPos, 'Vertical:', verticalPos);
        console.log('📱 [MOBILE POSITION] Window width:', window.innerWidth);
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        console.log('📱 [MOBILE POSITION] Icon element found:', !!icon);
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            console.log('📱 [MOBILE POSITION] Is mobile:', isMobile);
            if (isMobile) {
                console.log('📱 [MOBILE POSITION] BEFORE CLEARING - Current styles:');
                console.log('📱 [MOBILE POSITION] - left:', icon.style.left);
                console.log('📱 [MOBILE POSITION] - right:', icon.style.right);
                console.log('📱 [MOBILE POSITION] - top:', icon.style.top);
                console.log('📱 [MOBILE POSITION] - bottom:', icon.style.bottom);
                console.log('📱 [MOBILE POSITION] - transform:', icon.style.transform);
                console.log('📱 [MOBILE POSITION] - position:', icon.style.position);
                console.log('📱 [MOBILE POSITION] - inset:', icon.style.inset);
                
                // Clear all existing positioning properties more aggressively
                icon.style.removeProperty('top');
                icon.style.removeProperty('bottom');
                icon.style.removeProperty('left');
                icon.style.removeProperty('right');
                icon.style.removeProperty('transform');
                icon.style.removeProperty('inset');
                icon.style.removeProperty('position');
                icon.style.removeProperty('z-index');
                
                console.log('📱 [MOBILE POSITION] AFTER CLEARING - Current styles:');
                console.log('📱 [MOBILE POSITION] - left:', icon.style.left);
                console.log('📱 [MOBILE POSITION] - right:', icon.style.right);
                console.log('📱 [MOBILE POSITION] - top:', icon.style.top);
                console.log('📱 [MOBILE POSITION] - bottom:', icon.style.bottom);
                console.log('📱 [MOBILE POSITION] - transform:', icon.style.transform);
                
                // Set base positioning with higher specificity
                icon.style.setProperty('position', 'fixed', 'important');
                icon.style.setProperty('z-index', '9999', 'important');
                
                console.log('📱 [MOBILE POSITION] BASE POSITIONING SET:');
                console.log('📱 [MOBILE POSITION] - position:', icon.style.position);
                console.log('📱 [MOBILE POSITION] - z-index:', icon.style.zIndex);
                
                // Apply horizontal positioning with !important
                console.log('📱 [MOBILE POSITION] Applying horizontal positioning:', horizontalPos);
                if (horizontalPos === 'Left' || horizontalPos === 'left') {
                    icon.style.setProperty('left', '20px', 'important');
                    icon.style.setProperty('right', 'auto', 'important');
                    console.log('📱 [MOBILE POSITION] Set left: 20px, right: auto with !important');
                } else if (horizontalPos === 'Right' || horizontalPos === 'right') {
                    icon.style.setProperty('right', '20px', 'important');
                    icon.style.setProperty('left', 'auto', 'important');
                    console.log('📱 [MOBILE POSITION] Set right: 20px, left: auto with !important');
                }
                
                // Apply vertical positioning with !important
                console.log('📱 [MOBILE POSITION] Applying vertical positioning:', verticalPos);
                if (verticalPos === 'Top' || verticalPos === 'top') {
                    icon.style.setProperty('top', '20px', 'important');
                    icon.style.setProperty('bottom', 'auto', 'important');
                    icon.style.setProperty('transform', 'none', 'important');
                    console.log('📱 [MOBILE POSITION] Set top: 20px, bottom: auto, transform: none with !important');
                } else if (verticalPos === 'Bottom' || verticalPos === 'bottom') {
                    icon.style.setProperty('bottom', '20px', 'important');
                    icon.style.setProperty('top', 'auto', 'important');
                    icon.style.setProperty('transform', 'none', 'important');
                    console.log('📱 [MOBILE POSITION] Set bottom: 20px, top: auto, transform: none with !important');
                } else if (verticalPos === 'Middle' || verticalPos === 'middle') {
                    icon.style.setProperty('top', '50%', 'important');
                    icon.style.setProperty('bottom', 'auto', 'important');
                    icon.style.setProperty('transform', 'translateY(-50%)', 'important');
                    console.log('📱 [MOBILE POSITION] Set top: 50%, bottom: auto, transform: translateY(-50%) with !important');
                }

                // Force a reflow to ensure styles are applied
                icon.offsetHeight;
                
                console.log('📱 [MOBILE POSITION] IMMEDIATELY AFTER SETTING - Current styles:');
                console.log('📱 [MOBILE POSITION] - left:', icon.style.left);
                console.log('📱 [MOBILE POSITION] - right:', icon.style.right);
                console.log('📱 [MOBILE POSITION] - top:', icon.style.top);
                console.log('📱 [MOBILE POSITION] - bottom:', icon.style.bottom);
                console.log('📱 [MOBILE POSITION] - transform:', icon.style.transform);
                console.log('📱 [MOBILE POSITION] - position:', icon.style.position);
                console.log('📱 [MOBILE POSITION] - z-index:', icon.style.zIndex);
                
                // Additional force with a small delay to ensure positioning sticks
                setTimeout(() => {
                    // Re-apply positioning to ensure it sticks after any other CSS loads
                    if (verticalPos === 'Middle' || verticalPos === 'middle') {
                        icon.style.setProperty('top', '50%', 'important');
                        icon.style.setProperty('bottom', 'auto', 'important');
                        icon.style.setProperty('transform', 'translateY(-50%)', 'important');
                        console.log('📱 [MOBILE POSITION] RE-APPLIED MIDDLE POSITIONING');
                    }
                    
                    // Re-apply stored offsets after re-positioning
                    if (this.mobileHorizontalOffset !== undefined) {
                        console.log('📱 [MOBILE POSITION] Re-applying stored horizontal offset after timeout:', this.mobileHorizontalOffset);
                        this.updateMobileTriggerOffset('horizontal', this.mobileHorizontalOffset);
                    }
                    if (this.mobileVerticalOffset !== undefined) {
                        console.log('📱 [MOBILE POSITION] Re-applying stored vertical offset after timeout:', this.mobileVerticalOffset);
                        this.updateMobileTriggerOffset('vertical', this.mobileVerticalOffset);
                    }
                    
                    console.log('📱 [MOBILE POSITION] FINAL VERIFICATION:');
                    console.log('📱 [MOBILE POSITION] - top:', icon.style.top);
                    console.log('📱 [MOBILE POSITION] - transform:', icon.style.transform);
                    console.log('📱 [MOBILE POSITION] - computed top:', window.getComputedStyle(icon).top);
                    console.log('📱 [MOBILE POSITION] - computed transform:', window.getComputedStyle(icon).transform);
                }, 100);
                
                // Apply stored offsets if they exist
                if (this.mobileHorizontalOffset !== undefined) {
                    console.log('📱 [MOBILE POSITION] Applying stored horizontal offset:', this.mobileHorizontalOffset);
                    this.updateMobileTriggerOffset('horizontal', this.mobileHorizontalOffset);
                }
                if (this.mobileVerticalOffset !== undefined) {
                    console.log('📱 [MOBILE POSITION] Applying stored vertical offset:', this.mobileVerticalOffset);
                    this.updateMobileTriggerOffset('vertical', this.mobileVerticalOffset);
                }
                
                console.log('📱 [MOBILE POSITION] Mobile icon positioned:', horizontalPos, verticalPos, '- COMPLETED');
            }
        }
    }
    
    updateMobileTriggerSize(size) {
        console.log('[CK] updateMobileTriggerSize() - Size:', size);
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                if (size === 'Small') {
                    icon.style.setProperty('width', '35px', 'important');
                    icon.style.setProperty('height', '35px', 'important');
                    icon.style.setProperty('font-size', '14px');
                } else if (size === 'Medium') {
                    icon.style.setProperty('width', '45px', 'important');
                    icon.style.setProperty('height', '45px', 'important');
                    icon.style.setProperty('font-size', '18px');
                } else if (size === 'Large') {
                    icon.style.setProperty('width', '55px', 'important');
                    icon.style.setProperty('height', '55px', 'important');
                    icon.style.setProperty('font-size', '22px');
                }
            }
        }
    }
    
    updateMobileTriggerShape(shape) {
        console.log('📱 [MOBILE SHAPE] updateMobileTriggerShape() - Shape:', shape);
        console.log('📱 [MOBILE SHAPE] Window width:', window.innerWidth);
        console.log('📱 [MOBILE SHAPE] Is mobile:', window.innerWidth <= 768);
        console.log('📱 [MOBILE SHAPE] Shape type check:');
        console.log('📱 [MOBILE SHAPE] - shape === "Circle":', shape === 'Circle');
        console.log('📱 [MOBILE SHAPE] - shape === "Rounded":', shape === 'Rounded');
        console.log('📱 [MOBILE SHAPE] - shape === "Square":', shape === 'Square');
        console.log('📱 [MOBILE SHAPE] - shape === "circle":', shape === 'circle');
        console.log('📱 [MOBILE SHAPE] - shape === "rounded":', shape === 'rounded');
        console.log('📱 [MOBILE SHAPE] - shape === "square":', shape === 'square');
        
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                console.log('📱 [MOBILE SHAPE] BEFORE SHAPE CHANGE:');
                console.log('📱 [MOBILE SHAPE] - Current classes:', icon.className);
                console.log('📱 [MOBILE SHAPE] - Current data-shape:', icon.getAttribute('data-shape'));
                console.log('📱 [MOBILE SHAPE] - Current border-radius:', icon.style.borderRadius);
                console.log('📱 [MOBILE SHAPE] - Computed border-radius:', window.getComputedStyle(icon).borderRadius);
                
                console.log('[CK] Applying mobile shape:', shape);
                
                // Clear existing shape properties
                icon.style.removeProperty('border-radius');
                icon.style.removeProperty('-webkit-border-radius');
                icon.style.removeProperty('-moz-border-radius');
                
                icon.setAttribute('data-shape', shape.toLowerCase());
                
                let borderRadius = '50%';
                if (shape === 'Circle' || shape === 'circle') {
                    borderRadius = '50%';
                    console.log('📱 [MOBILE SHAPE] Detected Circle shape, setting border-radius to 50%');
                } else if (shape === 'Rounded' || shape === 'rounded') {
                    borderRadius = '12px';
                    console.log('📱 [MOBILE SHAPE] Detected Rounded shape, setting border-radius to 12px for rounded square');
                } else if (shape === 'Square' || shape === 'square') {
                    borderRadius = '0px';
                    console.log('📱 [MOBILE SHAPE] Detected Square shape, setting border-radius to 0px');
                } else {
                    console.warn('📱 [MOBILE SHAPE] Unknown shape:', shape, 'defaulting to 50%');
                }
                
                console.log('📱 [MOBILE SHAPE] AFTER CLEARING:');
                console.log('📱 [MOBILE SHAPE] - Border-radius after clearing:', icon.style.borderRadius);
                console.log('📱 [MOBILE SHAPE] - Computed after clearing:', window.getComputedStyle(icon).borderRadius);
                console.log('📱 [MOBILE SHAPE] - Target border-radius:', borderRadius);
                
                // Apply with maximum force - multiple attempts to override any external CSS
                icon.style.setProperty('border-radius', borderRadius, 'important');
                icon.style.setProperty('-webkit-border-radius', borderRadius, 'important');
                icon.style.setProperty('-moz-border-radius', borderRadius, 'important');
                icon.style.setProperty('display', 'flex', 'important');
                icon.style.setProperty('align-items', 'center', 'important');
                icon.style.setProperty('justify-content', 'center', 'important');
                
                // Force the shape with multiple approaches
                icon.setAttribute('data-shape', 'rounded');
                icon.classList.remove('circle', 'square');
                icon.classList.add('rounded');
                
                // Additional force with direct style assignment
                icon.style.borderRadius = borderRadius;
                icon.style.webkitBorderRadius = borderRadius;
                icon.style.mozBorderRadius = borderRadius;
                
                console.log('📱 [MOBILE SHAPE] IMMEDIATELY AFTER SETTING:');
                console.log('📱 [MOBILE SHAPE] - Inline border-radius:', icon.style.borderRadius);
                console.log('📱 [MOBILE SHAPE] - Computed border-radius:', window.getComputedStyle(icon).borderRadius);
                console.log('📱 [MOBILE SHAPE] - Expected border-radius:', borderRadius);
                
                // Force reapply after delay
                setTimeout(() => {
                    console.log('📱 [MOBILE SHAPE] REAPPLYING SHAPE AFTER DELAY...');
                    icon.style.setProperty('border-radius', borderRadius, 'important');
                    icon.style.setProperty('-webkit-border-radius', borderRadius, 'important');
                    icon.style.setProperty('-moz-border-radius', borderRadius, 'important');
                    
                    console.log('📱 [MOBILE SHAPE] FINAL SHAPE AFTER DELAY:');
                    console.log('📱 [MOBILE SHAPE] - Inline border-radius:', icon.style.borderRadius);
                    console.log('📱 [MOBILE SHAPE] - Computed border-radius:', window.getComputedStyle(icon).borderRadius);
                    console.log('📱 [MOBILE SHAPE] - Expected border-radius:', borderRadius);
                    
                // Final verification and force fix if needed
                const finalComputed = window.getComputedStyle(icon).borderRadius;
                if (finalComputed === borderRadius) {
                    console.log('📱 [MOBILE SHAPE] ✅ SUCCESS: Shape applied correctly!');
                } else {
                    console.error('📱 [MOBILE SHAPE] ❌ FAILED: Expected', borderRadius, 'but got', finalComputed);
                    console.log('📱 [MOBILE SHAPE] 🔧 FORCING SHAPE FIX...');
                    
                    // Force the shape with maximum aggression
                    icon.style.setProperty('border-radius', borderRadius, 'important');
                    icon.style.setProperty('-webkit-border-radius', borderRadius, 'important');
                    icon.style.setProperty('-moz-border-radius', borderRadius, 'important');
                    icon.style.borderRadius = borderRadius;
                    icon.style.webkitBorderRadius = borderRadius;
                    icon.style.mozBorderRadius = borderRadius;
                    
                    // Force reflow
                    icon.offsetHeight;
                    
                    const finalComputedAfterFix = window.getComputedStyle(icon).borderRadius;
                    if (finalComputedAfterFix === borderRadius) {
                        console.log('📱 [MOBILE SHAPE] ✅ FIXED: Shape applied after force fix!');
                    } else {
                        console.error('📱 [MOBILE SHAPE] ❌ STILL FAILED: Shape could not be applied');
                        
                        // Last resort: Create a new style element with maximum specificity
                        const style = document.createElement('style');
                        style.textContent = `
                            .accessibility-icon[data-shape="rounded"] {
                                border-radius: ${borderRadius} !important;
                                -webkit-border-radius: ${borderRadius} !important;
                                -moz-border-radius: ${borderRadius} !important;
                            }
                            .accessibility-icon.rounded {
                                border-radius: ${borderRadius} !important;
                                -webkit-border-radius: ${borderRadius} !important;
                                -moz-border-radius: ${borderRadius} !important;
                            }
                        `;
                        document.head.appendChild(style);
                        console.log('📱 [MOBILE SHAPE] 🔧 Added external style element as last resort');
                    }
                }
                }, 100);
                
                // Check computed style
                const computedStyle = window.getComputedStyle(icon).borderRadius;
                console.log('📱 [MOBILE SHAPE] Mobile shape applied:', shape, 'border-radius:', borderRadius);
                console.log('📱 [MOBILE SHAPE] Mobile computed border-radius:', computedStyle);
                console.log('📱 [MOBILE SHAPE] Mobile inline style border-radius:', icon.style.borderRadius);
                console.log('📱 [MOBILE SHAPE] Mobile data-shape attribute:', icon.getAttribute('data-shape'));
                console.log('📱 [MOBILE SHAPE] Mobile icon classes:', icon.className);
                
                if (computedStyle !== borderRadius) {
                    console.error('📱 [MOBILE SHAPE] ❌ MOBILE SHAPE FAILED! Expected:', borderRadius, 'Got:', computedStyle);
                } else {
                    console.log('📱 [MOBILE SHAPE] ✅ Mobile shape applied successfully!');
                }
            } else {
                console.log('[CK] Not mobile, skipping mobile shape application');
            }
        }
    }
    
    updateMobileTriggerOffset(direction, offset) {
        console.log('[CK] updateMobileTriggerOffset() - Direction:', direction, 'Offset:', offset);
        const icon = this.shadowRoot?.getElementById('accessibility-icon');
        if (icon) {
            const isMobile = window.innerWidth <= 768;
            console.log('[CK] updateMobileTriggerOffset() - Is mobile:', isMobile);
            
            if (isMobile) {
                console.log('[CK] updateMobileTriggerOffset() - Applying mobile offset');
                const cs = window.getComputedStyle(icon);
                const currentLeftRaw = icon.style.left || cs.left;
                const currentRightRaw = icon.style.right || cs.right;
                const currentTopRaw = icon.style.top || cs.top;
                const currentBottomRaw = icon.style.bottom || cs.bottom;
                const currentTransformRaw = icon.style.transform || cs.transform || '';

                console.log('[CK] updateMobileTriggerOffset() - Current positioning (computed):');
                console.log('[CK] updateMobileTriggerOffset() - left:', currentLeftRaw);
                console.log('[CK] updateMobileTriggerOffset() - right:', currentRightRaw);
                console.log('[CK] updateMobileTriggerOffset() - top:', currentTopRaw);
                console.log('[CK] updateMobileTriggerOffset() - bottom:', currentBottomRaw);
                console.log('[CK] updateMobileTriggerOffset() - transform:', currentTransformRaw);

                const normalizedOffset = (typeof offset === 'number' || /^-?\d+$/.test(String(offset))) ? `${offset}px` : String(offset);
                
                if (direction === 'horizontal') {
                    // Check which side the icon is positioned on
                    if (currentLeftRaw && currentLeftRaw !== 'auto' && currentLeftRaw !== '0px') {
                        // Icon is positioned from left
                        const currentLeft = currentLeftRaw;
                        const newLeft = currentLeft.includes('calc') ? 
                            currentLeft.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentLeft} + ${normalizedOffset})`;
                        icon.style.setProperty('left', newLeft, 'important');
                        console.log('[CK] updateMobileTriggerOffset() - Applied horizontal offset to left:', newLeft);
                    } else if (currentRightRaw && currentRightRaw !== 'auto' && currentRightRaw !== '0px') {
                        // Icon is positioned from right
                        const currentRight = currentRightRaw;
                        const newRight = currentRight.includes('calc') ? 
                            currentRight.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentRight} + ${normalizedOffset})`;
                        icon.style.setProperty('right', newRight, 'important');
                        console.log('[CK] updateMobileTriggerOffset() - Applied horizontal offset to right:', newRight);
                    }
                } else if (direction === 'vertical') {
                    // Check which side the icon is positioned on
                    if (currentTopRaw && currentTopRaw !== 'auto' && currentTopRaw !== '0px') {
                        // Icon is positioned from top
                        const currentTop = currentTopRaw;
                        if (currentTop === '50%') {
                            // For middle position, adjust the transform
                            const currentTransform = currentTransformRaw || 'translateY(-50%)';
                            const newTransform = currentTransform.includes('calc') ? 
                                currentTransform.replace(')', ` + ${normalizedOffset})`) : 
                                `translateY(calc(-50% + ${normalizedOffset}))`;
                            icon.style.setProperty('transform', newTransform, 'important');
                            console.log('[CK] updateMobileTriggerOffset() - Applied vertical offset to middle position:', newTransform);
                        } else {
                            const newTop = currentTop.includes('calc') ? 
                                currentTop.replace(')', ` + ${normalizedOffset})`) : 
                                `calc(${currentTop} + ${normalizedOffset})`;
                            icon.style.setProperty('top', newTop, 'important');
                            console.log('[CK] updateMobileTriggerOffset() - Applied vertical offset to top:', newTop);
                        }
                    } else if (currentBottomRaw && currentBottomRaw !== 'auto' && currentBottomRaw !== '0px') {
                        // Icon is positioned from bottom
                        const currentBottom = currentBottomRaw;
                        const newBottom = currentBottom.includes('calc') ? 
                            currentBottom.replace(')', ` + ${normalizedOffset})`) : 
                            `calc(${currentBottom} + ${normalizedOffset})`;
                        icon.style.setProperty('bottom', newBottom, 'important');
                        console.log('[CK] updateMobileTriggerOffset() - Applied vertical offset to bottom:', newBottom);
                    }
                }
                
                console.log('[CK] updateMobileTriggerOffset() - Final positioning after offset:');
                console.log('[CK] updateMobileTriggerOffset() - left:', icon.style.left);
                console.log('[CK] updateMobileTriggerOffset() - right:', icon.style.right);
                console.log('[CK] updateMobileTriggerOffset() - top:', icon.style.top);
                console.log('[CK] updateMobileTriggerOffset() - bottom:', icon.style.bottom);
                console.log('[CK] updateMobileTriggerOffset() - transform:', icon.style.transform);
            } else {
                console.log('[CK] updateMobileTriggerOffset() - Not on mobile, storing offset for later application');
                // Store the offset values for when mobile positioning is applied
                this.mobileHorizontalOffset = direction === 'horizontal' ? offset : (this.mobileHorizontalOffset || 0);
                this.mobileVerticalOffset = direction === 'vertical' ? offset : (this.mobileVerticalOffset || 0);
            }
        }
    }
    
    // Helper function to update panel visibility based on position
    updatePanelVisibility(isOpen) {
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        if (panel) {
            const currentTransform = panel.style.transform;
            if (isOpen) {
                // Show panel
                if (currentTransform.includes('translateX(-100%)')) {
                    panel.style.transform = 'translateX(0)';
                } else if (currentTransform.includes('translateX(100%)')) {
                    panel.style.transform = 'translateX(0)';
                } else {
                    panel.style.transform = 'translateX(0)';
                }
            } else {
                // Hide panel
                if (currentTransform.includes('translateX(-100%)') || panel.style.left === '0px') {
                    panel.style.transform = 'translateX(-100%)';
                } else if (currentTransform.includes('translateX(100%)') || panel.style.right === '0px') {
                    panel.style.transform = 'translateX(100%)';
                } else {
                    panel.style.transform = 'translateX(-100%)';
                }
            }
        }
    }

    // Language Dropdown Functions
    setupLanguageDropdownListeners() {
        console.log('Accessibility Widget: Setting up language dropdown listeners...');
        
        const dropdown = this.shadowRoot?.getElementById('language-dropdown');
        if (!dropdown) {
            console.error('Accessibility Widget: Language dropdown not found!');
            return;
        }

        // Get all language options
        const languageOptions = dropdown.querySelectorAll('.language-option');
        console.log('Accessibility Widget: Found language options:', languageOptions.length);

        languageOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const langCode = option.getAttribute('data-lang');
                const langName = option.querySelector('.language-name')?.textContent;
                
                console.log('Accessibility Widget: Language selected:', langCode, langName);
                
                // Update the header to show selected language
                const currentLanguageHeader = this.shadowRoot?.getElementById('current-language-header');
                if (currentLanguageHeader && langName) {
                    currentLanguageHeader.textContent = langName.toUpperCase();
                }
                
                // Apply the language
                if (langCode) {
                    this.applyLanguage(langCode);
                }
                
                // Hide dropdown
                this.toggleLanguageDropdown();
            });
        });

        console.log('Accessibility Widget: Language dropdown listeners set up successfully');
    }

    getLanguageNameFromCode(code) {
        const languageMap = {
            'en': 'English',
            'de': 'German', 
            'fr': 'French',
            'he': 'Hebrew',
            'ru': 'Russian',
            'ar': 'Arabic',
            'es': 'Spanish',
            'pt': 'Portuguese',
            'it': 'Italian',
            'tw': 'Chinese'
        };
        return languageMap[code] || 'English';
    }

    toggleLanguageDropdown() {
        console.log('Accessibility Widget: Toggling language dropdown...');
        
        const dropdown = this.shadowRoot?.getElementById('language-dropdown');
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        
        if (!dropdown || !panel) {
            console.error('Accessibility Widget: Dropdown or panel not found!');
            return;
        }

        const isVisible = dropdown.style.display !== 'none';
        
        if (isVisible) {
            // Hide dropdown
            dropdown.style.display = 'none';
            console.log('Accessibility Widget: Language dropdown hidden');
        } else {
            // Position dropdown relative to panel
            this.positionLanguageDropdown();
            
            // Show dropdown
            dropdown.style.display = 'block';
            console.log('Accessibility Widget: Language dropdown shown');
            
            // Add click outside handler to close dropdown
            setTimeout(() => {
                const handleClickOutside = (e) => {
                    if (!dropdown.contains(e.target) && !panel.querySelector('.language-selector-header').contains(e.target)) {
                        dropdown.style.display = 'none';
                        document.removeEventListener('click', handleClickOutside);
                    }
                };
                document.addEventListener('click', handleClickOutside);
            }, 100);
        }
    }

    positionLanguageDropdown() {
        const dropdown = this.shadowRoot?.getElementById('language-dropdown');
        const panel = this.shadowRoot?.getElementById('accessibility-panel');
        
        if (!dropdown || !panel) {
            console.error('Accessibility Widget: Cannot position dropdown - elements not found');
            return;
        }

        // Get panel position and dimensions
        const panelRect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        console.log('Accessibility Widget: Panel position:', {
            left: panelRect.left,
            top: panelRect.top,
            right: panelRect.right,
            bottom: panelRect.bottom,
            width: panelRect.width,
            height: panelRect.height
        });

        // Determine if panel is on left or right side of screen
        const isPanelOnLeft = panelRect.left < (viewportWidth / 2);
        console.log('Accessibility Widget: Panel is on left side:', isPanelOnLeft);

        // Position dropdown INSIDE the panel, aligned with panel's side
        let dropdownLeft = 0;
        let dropdownTop = 10; // Small offset from top of panel

        if (isPanelOnLeft) {
            // Panel is on LEFT - position dropdown on LEFT side of panel
            dropdownLeft = 10; // Small margin from left edge of panel
            console.log('Accessibility Widget: Positioning dropdown on LEFT side of panel');
        } else {
            // Panel is on RIGHT - position dropdown on RIGHT side of panel
            dropdownLeft = panelRect.width - 410; // Position from right edge (dropdown width ~400px + 10px margin)
            console.log('Accessibility Widget: Positioning dropdown on RIGHT side of panel');
        }

        // Apply positioning with !important to override any conflicting CSS
        dropdown.style.setProperty('left', `${dropdownLeft}px`, 'important');
        dropdown.style.setProperty('top', `${dropdownTop}px`, 'important');
        dropdown.style.setProperty('position', 'absolute', 'important');
        dropdown.style.setProperty('z-index', '100002', 'important'); // Higher than panel
        
        // Ensure dropdown is positioned relative to panel, not viewport
        dropdown.style.setProperty('transform', 'none', 'important');
        
        console.log('Accessibility Widget: Dropdown positioned INSIDE panel at:', {
            left: dropdownLeft,
            top: dropdownTop,
            panelSide: isPanelOnLeft ? 'LEFT' : 'RIGHT'
        });
    }

}



// Initialize the widget when DOM is loaded

let accessibilityWidget;



// Wait for DOM to be ready

function initWidget() {

    console.log('Accessibility Widget: Starting initialization...');

    accessibilityWidget = new AccessibilityWidget();

}



// Try multiple ways to initialize

if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initWidget);

} else {

    // DOM is already loaded

    initWidget();

}



// Also try with a small delay as backup

setTimeout(() => {

    if (!accessibilityWidget) {

        console.log('Accessibility Widget: Initializing with timeout...');

        initWidget();

    }

}, 1000);



// Add global error handler for accessibilityWidget

window.addEventListener('error', (e) => {

    if (e.message.includes('accessibilityWidget')) {

        console.error('Accessibility Widget: Error accessing accessibilityWidget object:', e.message);

        console.log('Accessibility Widget: Current accessibilityWidget state:', accessibilityWidget);

    }
    
});