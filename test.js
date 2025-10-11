// CRITICAL: Immediate seizure-safe check - runs before any animations can start
(function() {
    try {
        // Check localStorage immediately for seizure-safe mode
        const seizureSafeFromStorage = localStorage.getItem('accessibility-widget-seizure-safe');
        if (seizureSafeFromStorage === 'true') {
            console.log('Accessibility Widget: IMMEDIATE seizure-safe mode detected, applying instantly');
            document.body.classList.add('seizure-safe');
            
            // Apply immediate CSS to stop all animations
            const immediateStyle = document.createElement('style');
            immediateStyle.id = 'accessibility-seizure-immediate-early';
            immediateStyle.textContent = `
                /* ULTRA-MINIMAL SEIZURE-SAFE: Only stop animations, preserve everything else */
                body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after {
                    animation: none !important;
                    transition: none !important;
                    animation-play-state: paused !important;
                    animation-fill-mode: forwards !important;
                }
                /* CRITICAL: Only stop animations - do NOT touch ANY layout properties */
                body.seizure-safe * {
                    /* ONLY animation properties - do NOT touch anything else */
                    animation: none !important;
                    transition: none !important;
                    animation-play-state: paused !important;
                    animation-fill-mode: forwards !important;
                    /* DO NOT touch: transform, position, width, height, opacity, visibility, display */
                }
                /* SAFE: Preserve SVG visibility - do NOT hide SVGs */
                body.seizure-safe svg, body.seizure-safe svg * {
                    animation: none !important;
                    transition: none !important;
                    /* DO NOT touch: opacity, visibility, display, transform */
                }
                /* SAFE: Preserve text animations without breaking layout */
                body.seizure-safe [data-splitting], body.seizure-safe .split, body.seizure-safe .char, body.seizure-safe .word, body.seizure-safe [class*="split"], body.seizure-safe [class*="char"], body.seizure-safe [class*="word"], body.seizure-safe [class*="letter"], body.seizure-safe [class*="text-animation"], body.seizure-safe [class*="typing"], body.seizure-safe [class*="typewriter"], body.seizure-safe [class*="reveal"], body.seizure-safe [class*="unveil"], body.seizure-safe [class*="show-text"], body.seizure-safe [class*="text-effect"] {
                    animation: none !important;
                    transition: none !important;
                    animation-delay: 0s !important;
                    transition-delay: 0s !important;
                    /* DO NOT touch: opacity, visibility, display, transform, height */
                }
                /* Ensure interactive elements still show pointer cursor in seizure-safe mode */
                body.seizure-safe a[href], body.seizure-safe button, body.seizure-safe [role="button"], body.seizure-safe [onclick], body.seizure-safe input[type="button"], body.seizure-safe input[type="submit"], body.seizure-safe input[type="reset"], body.seizure-safe .btn, body.seizure-safe .button, body.seizure-safe [class*="btn"], body.seizure-safe [class*="button"], body.seizure-safe [tabindex]:not([tabindex="-1"]) {
                    cursor: pointer !important;
                }
                /* Keep text cursor for text-editable fields */
                body.seizure-safe input[type="text"], body.seizure-safe input[type="email"], body.seizure-safe input[type="search"], body.seizure-safe input[type="tel"], body.seizure-safe input[type="url"], body.seizure-safe input[type="password"], body.seizure-safe textarea, body.seizure-safe [contenteditable="true"] {
                    cursor: text !important;
                }
                /* END OF MINIMAL SEIZURE-SAFE CSS - No more aggressive rules */
            `;
            document.head.appendChild(immediateStyle);
            
            // Reinforce at root: cover both html.seizure-safe and body.seizure-safe
            try {
                if (!document.getElementById('accessibility-seizure-reinforce')) {
                    const reinforce = document.createElement('style');
                    reinforce.id = 'accessibility-seizure-reinforce';
                    reinforce.textContent = `
                        html.seizure-safe *, html.seizure-safe *::before, html.seizure-safe *::after,
                        body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after {
                            animation: none !important;
                            animation-name: none !important;
                            animation-duration: 0.0001s !important;
                            animation-play-state: paused !important;
                            transition: none !important;
                            transition-property: none !important;
                        }
                    `;
                    document.head.appendChild(reinforce);
                }
            } catch (_) {}
            
            // Master layer: globally disable CSS animations/transitions without altering layout
            try {
                if (!document.getElementById('accessibility-seizure-master')) {
                    const master = document.createElement('style');
                    master.id = 'accessibility-seizure-master';
                    master.textContent = `
                        /* Hard stop for CSS animations and transitions */
                        body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after {
                            animation: none !important;
                            animation-name: none !important;
                            animation-duration: 0.0001s !important;
                            animation-iteration-count: 1 !important;
                            animation-play-state: paused !important;
                            transition: none !important;
                            transition-property: none !important;
                            transition-duration: 0s !important;
                            scroll-behavior: auto !important;
                        }
                        /* Do not affect cursor appearance */
                        body.seizure-safe * {
                            cursor: inherit;
                        }
                    `;
                    document.head.appendChild(master);
                }
            } catch (_) {}
            
            // Correction layer: preserve site layout styles while keeping animations disabled
            try {
                if (!document.getElementById('accessibility-seizure-correction')) {
                    const correction = document.createElement('style');
                    correction.id = 'accessibility-seizure-correction';
                    correction.textContent = `
                        /* Keep animations disabled */
                        body.seizure-safe * {
                            animation: none !important;
                            transition: none !important;
                        }
                        /* Restore layout-affecting properties to stylesheet values */
                        body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after {
                            transform: unset !important;
                            translate: unset !important;
                            scale: unset !important;
                            rotate: unset !important;
                            opacity: unset !important;
                            visibility: unset !important;
                            position: unset !important;
                            top: unset !important;
                            left: unset !important;
                            right: unset !important;
                            bottom: unset !important;
                            width: unset !important;
                            height: unset !important;
                        }
                        /* Preserve only genuine navigation/header and explicit opt-outs */
                        body.seizure-safe nav, body.seizure-safe header, body.seizure-safe .navbar, body.seizure-safe [role="navigation"], body.seizure-safe [data-allow-transform] {
                            transform: unset !important;
                            position: unset !important;
                            opacity: unset !important;
                            visibility: unset !important;
                        }
                    `;
                    document.head.appendChild(correction);
                }
            } catch (_) {}
            
            // Enforce no-scroll-animations for known libraries/selectors with high specificity
            try {
                if (!document.getElementById('accessibility-seizure-animation-enforcer')) {
                    const enforce = document.createElement('style');
                    enforce.id = 'accessibility-seizure-animation-enforcer';
                    enforce.textContent = `
                        /* Target common scroll animation libs without affecting layout of others */
                        body.seizure-safe [data-aos], body.seizure-safe .aos-init, body.seizure-safe .aos-animate, body.seizure-safe [data-scroll], body.seizure-safe [data-animate], body.seizure-safe .wow, body.seizure-safe .animate__animated, body.seizure-safe .fade-up, body.seizure-safe .fade-in, body.seizure-safe .slide-in, body.seizure-safe .reveal, body.seizure-safe [class*="fade-"], body.seizure-safe [class*="slide-"], body.seizure-safe [class*="reveal"], body.seizure-safe [class*="animate"] {
                            animation: none !important;
                            transition: none !important;
                            opacity: 1 !important;
                            will-change: auto !important;
                        }
                    `;
                    document.head.appendChild(enforce);
                }
            } catch (_) {}
            
            try { document.documentElement.classList.add('seizure-safe'); } catch (_) {}
            try { document.documentElement.setAttribute('data-seizure-safe', 'true'); } catch (_) {}
            
            // Runtime guards: stop JS-driven animations and reveal typewriter/progress instantly
            try {
                if (!window.__seizureGuardsApplied) {
                    window.__seizureGuardsApplied = true;
                    
                    // NOTE: Do not globally override timers/animation frames to avoid breaking sticky/nav behavior
                    if (!window.__origRequestAnimationFrame) window.__origRequestAnimationFrame = window.requestAnimationFrame;
                    if (!window.__origCancelAnimationFrame) window.__origCancelAnimationFrame = window.cancelAnimationFrame;
                    if (!window.__origSetInterval) window.__origSetInterval = window.setInterval;
                    if (!window.__origSetTimeout) window.__origSetTimeout = window.setTimeout;
                    if (!window.__origClearInterval) window.__origClearInterval = window.clearInterval;
                    if (!window.__origClearTimeout) window.__origClearTimeout = window.clearTimeout;
                    
                    // Ensure originals are active
                    window.requestAnimationFrame = window.__origRequestAnimationFrame;
                    window.cancelAnimationFrame = window.__origCancelAnimationFrame;
                    window.setInterval = window.__origSetInterval;
                    window.setTimeout = window.__origSetTimeout;
                    window.clearInterval = window.__origClearInterval;
                    window.clearTimeout = window.__origClearTimeout;
                    
                    // Disable Web Animations API
                    try {
                        if (!window.__origElementAnimate) {
                            window.__origElementAnimate = Element.prototype.animate;
                            Element.prototype.animate = function() {
                                // return a stub Animation
                                return {
                                    cancel: function(){}, finish: function(){}, play: function(){}, pause: function(){},
                                    reverse: function(){}, updatePlaybackRate: function(){}, addEventListener: function(){},
                                    removeEventListener: function(){}, dispatchEvent: function(){ return false; },
                                    currentTime: 0, playState: 'finished',
                                };
                            };
                        }
                    } catch (_) { /* ignore */ }
                    
                    // Helper to reveal typewriter text and freeze progress visuals
                    window.__applySeizureSafeDOMFreeze = function() {
                        try {
                            // Reveal typewriter/typing effects by consolidating text immediately
                            const typeSelectors = [
                                '[class*="typewriter"]', '[class*="typing"]', '[data-typing]', '[data-typewriter]',
                                '[data-splitting]', '.split', '.char', '.word', '[class*="split"]', '[class*="char"]',
                                '[class*="word"]', '[class*="letter"]', '[class*="text-animation"]', '[class*="reveal"]',
                                '[class*="unveil"]', '[class*="show-text"]', '[class*="text-effect"]'
                            ];
                            document.querySelectorAll(typeSelectors.join(',')).forEach(el => {
                                try {
                                    // Force immediate final state
                                    el.style.animation = 'none';
                                    el.style.transition = 'none';
                                    el.style.opacity = '1';
                                    el.style.visibility = 'visible';
                                    el.style.display = 'inline';
                                    el.style.animationDelay = '0s';
                                    el.style.transitionDelay = '0s';
                                    
                                    const datasetText = el.getAttribute('data-full-text') || el.getAttribute('data-text') || '';
                                    if (datasetText) { el.textContent = datasetText; return; }
                                    // If split into character spans, join them
                                    const charSpans = el.querySelectorAll('.char, [class*="char"], .letter, [class*="letter"]');
                                    if (charSpans && charSpans.length > 0) {
                                        let joined = '';
                                        charSpans.forEach(n => { joined += n.textContent || ''; });
                                        el.textContent = joined;
                                    }
                                } catch (_) { /* ignore per-element errors */ }
                            });
                        } catch (err) {
                            console.warn('Accessibility Widget: DOM freeze failed', err);
                        }
                    };
                    
                    // Apply immediately and also on DOMContentLoaded as a second safety
                    window.__applySeizureSafeDOMFreeze();
                }
            } catch (guardErr) {
                console.warn('Accessibility Widget: runtime seizure-safe guards failed', guardErr);
            }
        }
    } catch (e) {
        console.warn('Accessibility Widget: Immediate seizure-safe check failed', e);
    }
})();

// Ensure the seizure-safe toggle actually applies classes and storage immediately
(function() {
    try {
        function bindSeizureSafeToggle() {
            const input = document.getElementById('seizure-safe');
            if (!input) return;
            const enabled = localStorage.getItem('accessibility-widget-seizure-safe') === 'true';
            try { input.checked = enabled; } catch (_) {}
            if (!input.__seizureBound) {
                input.addEventListener('change', function() {
                    const on = !!this.checked;
                    localStorage.setItem('accessibility-widget-seizure-safe', on ? 'true' : 'false');
                    try { document.documentElement.classList.toggle('seizure-safe', on); } catch (_) {}
                    try { document.body.classList.toggle('seizure-safe', on); } catch (_) {}
                    if (on) {
                        try { window.__applySeizureSafeDOMFreeze && window.__applySeizureSafeDOMFreeze(); } catch (_) {}
                    }
                });
                input.__seizureBound = true;
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindSeizureSafeToggle, { once: true });
        } else {
            bindSeizureSafeToggle();
        }
    } catch (e) {
        console.warn('Accessibility Widget: Seizure-safe toggle binding failed', e);
    }
})();

// Universal Stop Motion helper: CSS + Lottie + GSAP + GIF/APNG handling
function applyUniversalStopMotion(enabled) {
    try {
        // CSS injection to force-stop CSS animations/transitions and smooth scroll
        let css = document.getElementById('a11y-universal-motion-block');
        if (enabled) {
            if (!css) {
                css = document.createElement('style');
                css.id = 'a11y-universal-motion-block';
                document.head.appendChild(css);
            }
            css.textContent = `
                html.seizure-safe *, html.seizure-safe *::before, html.seizure-safe *::after,
                body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after,
                body.stop-animation *, body.stop-animation *::before, body.stop-animation *::after {
                    animation-duration: 0s !important;
                    transition-duration: 0s !important;
                    animation-iteration-count: 1 !important;
                    scroll-behavior: auto !important;
                }
            `;
        } else if (css) {
            css.remove();
        }
        
        // Lottie: stop all registered animations
        try {
            if (enabled && typeof window.lottie !== 'undefined' && window.lottie.getRegisteredAnimations) {
                const all = window.lottie.getRegisteredAnimations();
                all && all.forEach(anim => { try { anim.stop && anim.stop(); } catch (_) {} });
                try { window.lottie.freeze && window.lottie.freeze(); } catch (_) {}
            }
        } catch (_) {}
        
        // GSAP: pause global timeline
        try {
            if (enabled && typeof window.gsap !== 'undefined' && window.gsap.globalTimeline) {
                window.gsap.globalTimeline.pause();
            }
        } catch (_) {}
        
        // GIF/APNG replacement
        const STATIC_FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        if (enabled) {
            document.querySelectorAll('img[src$=".gif"], img[src$=".apng"]').forEach(img => {
                try {
                    if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
                    img.src = STATIC_FALLBACK;
                } catch (_) {}
            });
        } else {
            document.querySelectorAll('img[data-original-src]').forEach(img => {
                try { img.src = img.dataset.originalSrc; delete img.dataset.originalSrc; } catch (_) {}
            });
        }
        
        // Observe for future Lottie/GIF inserts
        if (enabled) {
            if (!window.__universalMotionObserver) {
                const obs = new MutationObserver(mutations => {
                    const active = document.body.classList.contains('seizure-safe') || document.body.classList.contains('stop-animation');
                    if (!active) return;
                    try {
                        if (typeof window.lottie !== 'undefined' && window.lottie.getRegisteredAnimations) {
                            const all = window.lottie.getRegisteredAnimations();
                            all && all.forEach(anim => { try { anim.stop && anim.stop(); } catch (_) {} });
                        }
                    } catch (_) {}
                    try {
                        mutations.forEach(m => m.addedNodes && m.addedNodes.forEach(node => {
                            if (node && node.tagName === 'IMG') {
                                if (!node.dataset.originalSrc) node.dataset.originalSrc = node.src;
                                node.src = STATIC_FALLBACK;
                            }
                        }));
                    } catch (_) {}
                });
                obs.observe(document.documentElement, { subtree: true, childList: true });
                window.__universalMotionObserver = obs;
            }
        } else if (window.__universalMotionObserver) {
            try { window.__universalMotionObserver.disconnect(); } catch (_) {}
            window.__universalMotionObserver = null;
        }
    } catch (_) {}
}

// Vision Impaired helper: apply comprehensive website scaling and contrast enhancement
function applyVisionImpaired(on) {
    try {
        // Toggle root classes
        document.documentElement.classList.toggle('vision-impaired', !!on);
        document.body.classList.toggle('vision-impaired', !!on);
        
        // Set vision scale CSS variable
        const scaleValue = '1.05';
        if (on) {
            document.documentElement.style.setProperty('--vision-scale', scaleValue);
        } else {
            document.documentElement.style.setProperty('--vision-scale', '1');
        }
    } catch (_) {}
}

// AccessibilityWidget class
class AccessibilityWidget {
    constructor() {
        this.settings = {};
        this.contentScale = 100; // Start at 100% (normal size)
        this.fontSize = 100;
        this.lineHeight = 100;
        this.letterSpacing = 100;
        this.textMagnifierHandlers = new Map();
        this.originalLineHeight = null;
        this.originalFontSizes = new Map();
        this.currentlyFocusedElement = null;
        this.isKeyboardNavigation = false;
        this.lastInteractionMethod = null;
        this.currentLanguage = this.getCurrentLanguage();
        this.translations = this.getTranslations();
        this.isOpeningDropdown = false;
        this.kvApiUrl = 'https://accessibility-widget.web-8fb.workers.dev';
        console.log('Accessibility Widget: kvApiUrl set to:', this.kvApiUrl);
        console.log('Accessibility Widget: Initializing...');
        this.checkAndApplyImmediateSeizureSafe();
        this.setupSeizureSafeMonitoring();
        this.forceAllAnimationsToFinalState();
        this.init();
    }
    
    // Store original element positions and sizes before applying seizure-safe mode
    storeOriginalLayout() {
        try {
            if (!this.originalLayouts) {
                this.originalLayouts = new Map();
            }
            const allElements = document.querySelectorAll('*');
            allElements.forEach((element, index) => {
                if (index < 1000) {
                    const computedStyle = window.getComputedStyle(element);
                    this.originalLayouts.set(element, {
                        position: computedStyle.position,
                        top: computedStyle.top,
                        left: computedStyle.left,
                        right: computedStyle.right,
                        bottom: computedStyle.bottom,
                        transform: computedStyle.transform,
                        width: computedStyle.width,
                        height: computedStyle.height,
                        display: computedStyle.display,
                        opacity: computedStyle.opacity,
                        visibility: computedStyle.visibility
                    });
                }
            });
            console.log('Accessibility Widget: Original layouts stored for', this.originalLayouts.size, 'elements');
        } catch (e) {
            console.warn('Accessibility Widget: storeOriginalLayout failed', e);
        }
    }
    
    // Check and apply seizure-safe mode immediately before any animations start
    checkAndApplyImmediateSeizureSafe() {
        try {
            // Check localStorage first for immediate application
            const seizureSafeFromStorage = localStorage.getItem('accessibility-widget-seizure-safe');
            if (seizureSafeFromStorage === 'true') {
                console.log('Accessibility Widget: Seizure-safe mode detected in localStorage, applying immediately');
                document.body.classList.add('seizure-safe');
                document.documentElement.classList.add('seizure-safe');
                this.applyImmediateSeizureCSS();
                this.forceCompleteTextAnimations();
            }
        } catch (e) {
            console.warn('Accessibility Widget: checkAndApplyImmediateSeizureSafe failed', e);
        }
    }
    
    // Set up aggressive monitoring for any text animations that might start
    setupSeizureSafeMonitoring() {
        try {
            // Only set up monitoring if seizure-safe mode is active
            if (!document.body.classList.contains('seizure-safe')) {
                return;
            }
            
            console.log('Accessibility Widget: Setting up aggressive seizure-safe monitoring');
            
            // Use MutationObserver to catch any text animations that start
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        // Check for any new text animation elements
                        const addedNodes = Array.from(mutation.addedNodes || []);
                        const target = mutation.target;
                        
                        // Check added nodes and target for text animation classes
                        [...addedNodes, target].forEach(node => {
                            if (node && node.nodeType === Node.ELEMENT_NODE) {
                                const element = node;
                                const classList = element.className || '';
                                
                                // Check for text animation patterns
                                if (classList.includes('char') || classList.includes('word') || 
                                    classList.includes('split') || classList.includes('typewriter') ||
                                    classList.includes('typing') || classList.includes('reveal')) {
                                    
                                    console.log('Accessibility Widget: Detected text animation element, forcing to final state');
                                    
                                    // Force immediate final state
                                    element.style.animation = 'none';
                                    element.style.transition = 'none';
                                    element.style.opacity = '1';
                                    element.style.visibility = 'visible';
                                    element.style.display = 'inline';
                                    
                                    // If it's a text animation container, reveal all text immediately
                                    const textSpans = element.querySelectorAll('.char, .word, [class*="char"], [class*="word"]');
                                    if (textSpans.length > 0) {
                                        let fullText = '';
                                        textSpans.forEach(span => {
                                            fullText += span.textContent || '';
                                        });
                                        element.textContent = fullText;
                                    }
                                }
                            }
                        });
                    }
                });
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            
            console.log('Accessibility Widget: Seizure-safe monitoring active');
        } catch (e) {
            console.warn('Accessibility Widget: setupSeizureSafeMonitoring failed', e);
        }
    }
    
    // Force all animations to their final state immediately
    forceAllAnimationsToFinalState() {
        try {
            // Check if seizure-safe is enabled
            const isSeizureSafe = document.body.classList.contains('seizure-safe');
            const seizureSafeFromStorage = localStorage.getItem('accessibility-widget-seizure-safe') === 'true';
            
            if (isSeizureSafe || seizureSafeFromStorage) {
                console.log('Accessibility Widget: Forcing animations to final state (clean approach)');
                
                // Stop seizure-triggering animations only
                const animatedElements = document.querySelectorAll('*[class*="animate"], *[class*="fade"], *[class*="slide"], *[class*="bounce"], *[class*="pulse"], *[class*="shake"], *[class*="flash"], *[class*="blink"], *[class*="glow"], *[class*="spin"], *[class*="rotate"], *[class*="scale"], *[class*="zoom"], *[class*="wiggle"], *[class*="jiggle"], *[class*="twist"], *[class*="flip"], *[class*="swing"], *[class*="wobble"], *[class*="tilt"]');
                
                animatedElements.forEach(element => {
                    element.style.animation = 'none';
                    element.style.transition = 'none';
                    element.style.animationPlayState = 'paused';
                });
                
                console.log('Accessibility Widget: Stopped animations on', animatedElements.length, 'elements');
            }
        } catch (e) {
            console.warn('Accessibility Widget: forceAllAnimationsToFinalState failed', e);
        }
    }
    
    // Initialize the accessibility widget
    async init() {
        this.addFontAwesome();
        this.addCSS(); // Load CSS from hosted URL
        
        // Check if interface should be hidden
        if (localStorage.getItem('accessibility-widget-hidden') === 'true') {
            console.log('[CK] Accessibility interface is hidden, not creating widget');
            return;
        }
        
        this.createWidget();
    }
    
    // Add Font Awesome icons
    addFontAwesome() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
            document.head.appendChild(fontAwesome);
            console.log('Accessibility Widget: Font Awesome added');
        }
    }
    
    // Add CSS styles
    addCSS() {
        // Check if CSS is already loaded
        if (!document.querySelector('link[href*="accessibility-widget.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.onload = () => {
                console.log('Accessibility Widget: CSS loaded successfully');
            };
            link.onerror = () => {
                console.warn('Accessibility Widget: CSS failed to load, using fallback');
            };
            link.href = 'https://accessibility-widget.web-8fb.workers.dev/accessibility-widget.css';
            document.head.appendChild(link);
        }
    }
    
    // Create the accessibility widget
    createWidget() {
        // Create widget container that will host the Shadow DOM
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'accessibility-widget-container';
        widgetContainer.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(widgetContainer);
        
        // Create shadow root
        this.shadowRoot = widgetContainer.attachShadow({ mode: 'open' });
        
        // Add widget HTML
        this.shadowRoot.innerHTML = this.getWidgetHTML();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('Accessibility Widget: Widget created successfully');
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('accessibility-settings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
        
        // Set default settings for keyboard navigation if not already set
        if (!this.settings.hasOwnProperty('keyboard-navigation')) {
            this.settings['keyboard-navigation'] = false;
        }
        
        console.log('Accessibility Widget: Settings loaded', this.settings);
    }
    
    // Save settings to localStorage
    saveSettings() {
        // Save to localStorage (existing functionality)
        localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
        
        // Also save to KV storage for persistence across devices
        this.saveSettingsToKV();
    }
}

// CRITICAL: Stop JavaScript animations immediately ONLY for seizure-safe mode
(function() {
    try {
        const seizureSafeFromStorage = localStorage.getItem('accessibility-widget-seizure-safe');
        if (seizureSafeFromStorage === 'true') {
            try {
                // Override requestAnimationFrame immediately
                if (!window.__originalRequestAnimationFrame) {
                    window.__originalRequestAnimationFrame = window.requestAnimationFrame;
                }
                window.requestAnimationFrame = function(callback) {
                    // Block all animations in seizure-safe mode
                    console.log('Accessibility Widget: Blocking requestAnimationFrame for immediate seizure-safe');
                    return 0;
                };
                
                // Stop Lottie animations immediately
                if (typeof window.lottie !== 'undefined' && window.lottie.getRegisteredAnimations) {
                    const lottieAnimations = window.lottie.getRegisteredAnimations();
                    lottieAnimations.forEach(animation => {
                        try {
                            if (animation && typeof animation.stop === 'function') {
                                animation.stop();
                            }
                            if (animation && typeof animation.pause === 'function') {
                                animation.pause();
                            }
                        } catch (error) {
                            console.warn('Accessibility Widget: Failed to stop Lottie animation immediately', error);
                        }
                    });
                }
                
                // Stop jQuery animations immediately
                if (typeof window.jQuery !== 'undefined' || typeof window.$ !== 'undefined') {
                    try {
                        const $ = window.jQuery || window.$;
                        if ($ && $.fx) {
                            $.fx.off = true;
                        }
                    } catch (error) {
                        console.warn('Accessibility Widget: Failed to stop jQuery animations immediately', error);
                    }
                }
                
                console.log('Accessibility Widget: Immediate JavaScript animation stopping applied');
                
            } catch (jsError) {
                console.warn('Accessibility Widget: Immediate JavaScript animation stopping failed', jsError);
            }
        }
        
    } catch (e) {
        console.warn('Accessibility Widget: Immediate seizure-safe check failed', e);
    }
})();

// Universal Stop Motion helper: CSS + Lottie + GSAP + GIF/APNG handling
function applyUniversalStopMotion(enabled) {
    try {
        // CSS injection to force-stop CSS animations/transitions and smooth scroll
        let css = document.getElementById('a11y-universal-motion-block');
        if (enabled) {
            if (!css) {
                css = document.createElement('style');
                css.id = 'a11y-universal-motion-block';
                document.head.appendChild(css);
            }
            css.textContent = `
                html.seizure-safe *, html.seizure-safe *::before, html.seizure-safe *::after,
                body.seizure-safe *, body.seizure-safe *::before, body.seizure-safe *::after {
                    animation-duration: 0s !important;
                    transition-duration: 0s !important;
                    animation-iteration-count: 1 !important;
                    /* REMOVED: scroll-behavior: auto !important; - This was blocking website scroll animations */
                }
            `;
        } else if (css) {
            css.remove();
        }

        // Lottie: stop all registered animations
        try {
            if (enabled && typeof window.lottie !== 'undefined' && window.lottie.getRegisteredAnimations) {
                const all = window.lottie.getRegisteredAnimations();
                all && all.forEach(anim => { try { anim.stop && anim.stop(); } catch (_) {} });
                try { window.lottie.freeze && window.lottie.freeze(); } catch (_) {}
            }
        } catch (_) {}

        // GSAP detected - do not pause global timeline to preserve ScrollTrigger
        try {
            if (enabled && typeof window.gsap !== 'undefined' && window.gsap.globalTimeline) {
                console.log('Accessibility Widget: Not pausing gsap.globalTimeline to preserve ScrollTrigger');
            }
        } catch (_) {}

        // GIF/APNG replacement (one-frame transparent pixel by default)
        const STATIC_FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        if (enabled) {
            document.querySelectorAll('img[src$=".gif"], img[src$=".apng"]').forEach(img => {
                try {
                    if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
                    img.src = STATIC_FALLBACK;
                } catch (_) {}
            });
        } else {
            document.querySelectorAll('img[data-original-src]').forEach(img => {
                try { img.src = img.dataset.originalSrc; delete img.dataset.originalSrc; } catch (_) {}
            });
        }

        // Observe for future Lottie/GIF inserts while active
        if (enabled) {
            if (!window.__universalMotionObserver) {
                const obs = new MutationObserver(mutations => {
                    const active = document.body.classList.contains('seizure-safe');
                    if (!active) return;
                    try {
                        if (typeof window.lottie !== 'undefined' && window.lottie.getRegisteredAnimations) {
                            const all = window.lottie.getRegisteredAnimations();
                            all && all.forEach(anim => { try { anim.stop && anim.stop(); } catch (_) {} });
                        }
                    } catch (_) {}
                    try {
                        mutations.forEach(m => m.addedNodes && m.addedNodes.forEach(node => {
                            if (node && node.tagName === 'IMG') {
                                if (!node.dataset.originalSrc) node.dataset.originalSrc = node.src;
                                node.src = STATIC_FALLBACK;
                            }
                        }));
                    } catch (_) {}
                });
                obs.observe(document.documentElement, { subtree: true, childList: true });
                window.__universalMotionObserver = obs;
            }
        } else if (window.__universalMotionObserver) {
            try { window.__universalMotionObserver.disconnect(); } catch (_) {}
            window.__universalMotionObserver = null;
        }
    } catch (_) {}
}

// Vision Impaired helper: apply comprehensive website scaling and contrast enhancement
function applyVisionImpaired(on) {
    try {
        // Toggle root classes
        document.documentElement.classList.toggle('vision-impaired', !!on);
        document.body.classList.toggle('vision-impaired', !!on);

        // CONTENT WRAPPER (persistent)
        let wrapper = document.getElementById('accessibility-content-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'accessibility-content-wrapper';
            // Move all current body children into the wrapper once
            while (document.body.firstChild) {
                wrapper.appendChild(document.body.firstChild);
            }
            document.body.appendChild(wrapper);
        }

        // Smooth scaling via CSS variable; do not touch font-size anywhere
        // Set desired scale as CSS var on html element so transitions are smooth
        const scaleValue = '1.06';
        if (on) {
            document.documentElement.style.setProperty('--vision-scale', scaleValue);
        } else {
            document.documentElement.style.setProperty('--vision-scale', '1');
        }
        
        let style = document.getElementById('accessibility-vision-impaired-immediate-early');
        if (!style) {
            style = document.createElement('style');
            style.id = 'accessibility-vision-impaired-immediate-early';
            document.head.appendChild(style);
        }
        
        // ... (Update CSS below) ...
        style.textContent = `
            /* VISION IMPAIRED: Safe Content Scaling with Transform (variable-driven) */

            /* 1. VISION IMPAIRED SCALING - Clean approach without layout breaking */
            html.vision-impaired {
                /* REMOVED: transform: scale() - This was interfering with panel viewport behavior */
                /* REMOVED: transform-origin - This was interfering with panel positioning */
                /* REMOVED: width/height calculations - This was interfering with panel viewport behavior */
                min-height: 100vh !important;
                /* REMOVED: transition - This was interfering with panel positioning */
            }

            body.vision-impaired {
                margin: 0 !important;
                padding: 0 !important;
                min-height: 100vh !important;
                /* Simple scaling to enhance vision - no calculations */
                transform: scale(1.05) !important;
                transform-origin: top left !important;
            }

            /* 2. CONTENT WRAPPER - Simplified approach */
            #accessibility-content-wrapper {
                
                height: 100% !important;
                min-height: 100vh !important;
                overflow: visible !important;
                display: block !important;
            }
            
            /* 3. PREVENT EXTRA WHITE SPACE - Ensure content fills viewport */
            html.vision-impaired,
            body.vision-impaired {
                overflow-x: hidden !important;
            }
            
            /* 4. ENSURE FOOTER AND CONTENT FILL VIEWPORT */
            body.vision-impaired main,
            body.vision-impaired section,
            body.vision-impaired article,
            body.vision-impaired .content,
            body.vision-impaired .container,
            body.vision-impaired .wrapper {
                min-height: 100vh !important;
            }
            
            /* 5. ACCESSIBILITY PANEL - Exclude from scaling to preserve viewport positioning */
            .accessibility-widget.vision-impaired,
            #accessibility-widget.vision-impaired,
            .accessibility-panel.vision-impaired,
            .accessibility-widget,
            #accessibility-widget,
            .accessibility-panel,
            .accessibility-icon,
            #accessibility-icon {
                transform: none !important;
                transform-origin: unset !important;
                transition: none !important;
                /* REMOVED: position: fixed !important; - This was preventing widget from scrolling with viewport */
                z-index: 999999 !important;
            }

            /* 4. CONTENT ENHANCEMENT - No font-size changes, optional subtle contrast only */
            #accessibility-content-wrapper {
                filter: contrast(1.04) brightness(1.01) !important;
                transition: filter 240ms ease !important;
            }
            
            /* 5. PRESERVE STICKY POSITIONING - Ensure sticky elements work correctly */
            #accessibility-content-wrapper [style*="position: sticky"],
            #accessibility-content-wrapper [style*="position: -webkit-sticky"],
            #accessibility-content-wrapper .sticky,
            #accessibility-content-wrapper .fixed-nav,
            #accessibility-content-wrapper nav[style*="position: sticky"],
            #accessibility-content-wrapper nav[style*="position: -webkit-sticky"] {
                position: sticky !important;
                position: -webkit-sticky !important;
                /* Ensure sticky elements maintain their behavior */
                z-index: 9999 !important;
            }
            
            /* 6. IMPROVE TEXT READABILITY - Smooth transitions for text enhancements */
            #accessibility-content-wrapper p,
            #accessibility-content-wrapper span,
            #accessibility-content-wrapper div,
            #accessibility-content-wrapper li,
            #accessibility-content-wrapper td,
            #accessibility-content-wrapper th {
                text-shadow: 0 0 0.3px rgba(0, 0, 0, 0.2) !important;
                font-weight: 500 !important;
                transition: text-shadow 0.3s ease-in-out, font-weight 0.3s ease-in-out !important;
            }
            
            /* 7. ENHANCE FOCUS INDICATORS - Smooth focus transitions */
            #accessibility-content-wrapper *:focus {
                outline: 2px solid #0066cc !important;
                outline-offset: 1px !important;
                transition: outline 0.2s ease-in-out !important;
            }
            
            /* 8. IMPROVE LINK VISIBILITY - Smooth link transitions */
            #accessibility-content-wrapper a {
                font-weight: 500 !important;
                transition: font-weight 0.3s ease-in-out !important;
            }
            
            /* 9. ENHANCE BUTTON READABILITY - Smooth button transitions */
            #accessibility-content-wrapper button,
            #accessibility-content-wrapper input[type="button"],
            #accessibility-content-wrapper input[type="submit"],
            #accessibility-content-wrapper input[type="reset"] {
                text-shadow: 0 0 0.3px rgba(0, 0, 0, 0.15) !important;
                font-weight: 500 !important;
                transition: text-shadow 0.3s ease-in-out, font-weight 0.3s ease-in-out !important;
            }
            
            /* 10. IMPROVE FORM ELEMENT READABILITY - Smooth form transitions */
            #accessibility-content-wrapper input,
            #accessibility-content-wrapper textarea,
            #accessibility-content-wrapper select {
                text-shadow: 0 0 0.3px rgba(0, 0, 0, 0.15) !important;
                font-weight: 500 !important;
                transition: text-shadow 0.3s ease-in-out, font-weight 0.3s ease-in-out !important;
            }
            
            /* 11. ENHANCE HEADING READABILITY - Smooth heading transitions */
            #accessibility-content-wrapper h1,
            #accessibility-content-wrapper h2,
            #accessibility-content-wrapper h3,
            #accessibility-content-wrapper h4,
            #accessibility-content-wrapper h5,
            #accessibility-content-wrapper h6 {
                text-shadow: 0 0 0.4px rgba(0, 0, 0, 0.25) !important;
                font-weight: 600 !important;
                transition: text-shadow 0.3s ease-in-out, font-weight 0.3s ease-in-out !important;
            }
            
            /* 12. IMPROVE IMAGE CONTRAST - Only enhance images slightly */
            #accessibility-content-wrapper img {
                filter: none !important;
            }
            
            /* 13. RESPONSIVE ADJUSTMENTS - Mobile scaling */
            @media (max-width: 768px) {
                html.vision-impaired {
                    /* REMOVED: transform: scale() - This was interfering with panel viewport behavior */
                    /* REMOVED: transform-origin - This was interfering with panel positioning */
                    /* REMOVED: width/height calculations - This was interfering with panel viewport behavior */
                    min-height: 100vh !important;
                }
                
                body.vision-impaired {
                    min-height: 100vh !important;
                    /* Simple scaling to enhance vision - no calculations */
                    transform: scale(1.05) !important;
                    transform-origin: top left !important;
                }
                
                .accessibility-widget.vision-impaired,
                #accessibility-widget.vision-impaired,
                .accessibility-panel.vision-impaired,
                .accessibility-widget,
                #accessibility-widget,
                .accessibility-panel,
                .accessibility-icon,
                #accessibility-icon {
                    transform: none !important;
                    /* REMOVED: position: fixed !important; - This was preventing widget from scrolling with viewport */
                    z-index: 999999 !important;
                }
            }
        `;
    } catch (_) {}
}

// Ensure the seizure-safe toggle actually applies classes and storage immediately
(function() {
    try {
        function bindSeizureSafeToggle() {
            const input = document.getElementById('seizure-safe');
            if (!input) return;
            const enabled = localStorage.getItem('accessibility-widget-seizure-safe') === 'true';
            try { input.checked = enabled; } catch (_) {}
            if (!input.__seizureBound) {
                input.addEventListener('change', function() {
                    const on = !!this.checked;
                    localStorage.setItem('accessibility-widget-seizure-safe', on ? 'true' : 'false');
                    try { document.documentElement.classList.toggle('seizure-safe', on); } catch (_) {}
                    try { document.body.classList.toggle('seizure-safe', on); } catch (_) {}
                    if (on) {
                        try { window.__applySeizureSafeDOMFreeze && window.__applySeizureSafeDOMFreeze(); } catch (_) {}
                    }
                });
                input.__seizureBound = true;
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindSeizureSafeToggle, { once: true });
        } else {
            bindSeizureSafeToggle();
        }
    } catch (e) {
        console.warn('Accessibility Widget: Seizure-safe toggle binding failed', e);
    }
})();

// CRITICAL: Immediate Vision Impaired profile - apply on first paint if previously enabled
(function() {
    try {
        const visionImpairedFromStorage = localStorage.getItem('accessibility-widget-vision-impaired');
        if (visionImpairedFromStorage === 'true') {
            try { document.documentElement.classList.add('vision-impaired'); } catch (_) {}
            try { document.body.classList.add('vision-impaired'); } catch (_) {}
            try { document.documentElement.setAttribute('data-vision-impaired', 'true'); } catch (_) {}

            // Apply comprehensive vision impaired styles immediately
            if (!document.getElementById('accessibility-vision-impaired-immediate-early')) {
                const viStyle = document.createElement('style');
                viStyle.id = 'accessibility-vision-impaired-immediate-early';
                viStyle.textContent = `
                    /* VISION IMPAIRED: Subtle Website Scaling and Contrast Enhancement */
                    
                    /* 1. SUBTLE WEBSITE SCALING - Scale entire website by 1.1x (10% larger) */
                    html.vision-impaired {
                        /* No zoom - preserve original layout */
                        /* No layout modifications */
                    }
                    
                    body.vision-impaired {
                        /* No layout modifications */
                        /* No layout modifications */
                        /* Slightly enhance text contrast without changing colors */
                        filter: contrast(1.1) brightness(1.05) !important;
                    }
                    
                    /* 2. IMPROVE TEXT READABILITY - Enhanced font weight for better readability */
                    body.vision-impaired p,
                    body.vision-impaired span,
                    body.vision-impaired div,
                    body.vision-impaired li,
                    body.vision-impaired td,
                    body.vision-impaired th {
                        /* Slightly improve text contrast */
                        text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3) !important;
                        /* Increased font weight for better readability */
                        font-weight: 600 !important;
                    }
                    
                    /* 3. ENHANCE FOCUS INDICATORS - Make focus more visible without being disruptive */
                    body.vision-impaired *:focus {
                        outline: 2px solid #0066cc !important;
                        outline-offset: 1px !important;
                    }
                    
                    /* 4. IMPROVE LINK VISIBILITY - Enhanced font weight for links */
                    body.vision-impaired a {
                        /* Slightly improve link contrast */
                        text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.2) !important;
                        /* Increased font weight for better visibility */
                        font-weight: 600 !important;
                    }
                    
                    /* 5. ENHANCE BUTTON READABILITY - Enhanced font weight for buttons */
                    body.vision-impaired button,
                    body.vision-impaired input[type="button"],
                    body.vision-impaired input[type="submit"],
                    body.vision-impaired input[type="reset"] {
                        /* Slightly improve button text contrast */
                        text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.2) !important;
                        font-weight: 600 !important;
                    }
                    
                    /* 6. IMPROVE FORM ELEMENT READABILITY - Enhanced font weight for form elements */
                    body.vision-impaired input,
                    body.vision-impaired textarea,
                    body.vision-impaired select {
                        /* Slightly improve form text contrast */
                        text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.2) !important;
                        font-weight: 600 !important;
                    }
                    
                    /* 7. ENHANCE HEADING READABILITY - Increased font weight for headings */
                    body.vision-impaired h1,
                    body.vision-impaired h2,
                    body.vision-impaired h3,
                    body.vision-impaired h4,
                    body.vision-impaired h5,
                    body.vision-impaired h6 {
                        /* Slightly improve heading contrast */
                        text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3) !important;
                        font-weight: 700 !important;
                    }
                    
                    /* 8. IMPROVE IMAGE CONTRAST - Only enhance images slightly */
                    body.vision-impaired img {
                        /* Slightly improve image contrast */
                        filter: contrast(1.05) brightness(1.02) !important;
                    }
                    
                    /* 9. PREVENT EXTRA WHITESPACE AND SCROLLBARS */
                    body.vision-impaired * {
                        box-sizing: border-box !important;
                        /* No layout modifications */
                    }
                    
                    /* 10. PRESERVE LAYOUT - No footer modifications */
                    
                    /* 11. RESPONSIVE ADJUSTMENTS - No scaling on mobile */
                    @media (max-width: 768px) {
                        html.vision-impaired {
                            /* No zoom - preserve original layout */
                        }
                    }
                `;
                document.head.appendChild(viStyle);
            }
        }

        // Wire checkbox if present and sync initial checked state
        function syncVisionImpairedToggle() {
            try {
                const input = document.getElementById('vision-impaired');
                if (!input) return;
                const enabled = localStorage.getItem('accessibility-widget-vision-impaired') === 'true';
                try { input.checked = enabled; } catch (_) {}
                if (!input.__viBound) {
                    input.addEventListener('change', function() {
                        const on = !!this.checked;
                        localStorage.setItem('accessibility-widget-vision-impaired', on ? 'true' : 'false');
                        try { document.documentElement.classList.toggle('vision-impaired', on); } catch (_) {}
                        try { document.body.classList.toggle('vision-impaired', on); } catch (_) {}
                        try {
                            if (on) {
                                document.documentElement.setAttribute('data-vision-impaired', 'true');
                            } else {
                                document.documentElement.removeAttribute('data-vision-impaired');
                            }
                        } catch (_) {}
                    });
                    input.__viBound = true;
                }
            } catch (_) { /* ignore */ }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', syncVisionImpairedToggle, { once: true });
        } else {
            syncVisionImpairedToggle();
        }
    } catch (e) {
        console.warn('Accessibility Widget: Immediate Vision Impaired setup failed', e);
    }
})();

