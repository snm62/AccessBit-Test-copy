// Integration for Existing Payment Tab Structure
// This script integrates with your existing payment tab without changing the UI
// Updated: 2025-01-13 - Payment Element-only implementation to avoid permissions policy issues

class ExistingPaymentIntegration {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.linkAuthenticationElement = null;
        this.clientSecret = null;
        this.kvApiUrl = 'https://accessibility-widget.web-8fb.workers.dev';
        this.siteId = this.getSiteId();
        this.isStripeLoaded = false;
        this.email = '';
        this.domainUrl = '';
    }

    async loadStripeScripts() {
        if (this.isStripeLoaded) return;
        
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                this.stripe = window.Stripe('pk_test_51SHC1FRh1lS9W4XKi6p64DmTTaIZLId6MfA5eFG6UsSsd84VFeJamSJBduMhubQ9TfavO5D8AtGfnUI4xwc3cNpQ00DudeK7OM');
                this.isStripeLoaded = true;
                resolve();
            } else {
                reject(new Error('Stripe.js not loaded'));
            }
        });
    }

    async loadUserData() {
        try {
            // Try multiple possible session storage keys
            const userData = sessionStorage.getItem('contrastkit') || 
                           sessionStorage.getItem('accessbit-userinfo') || 
                           sessionStorage.getItem('accessibility-userinfo');
            if (userData) {
                const parsed = JSON.parse(userData);
                this.siteId = parsed.siteId || this.siteId;
                console.log('User data loaded:', { siteId: this.siteId });
            }
        } catch (error) {
            console.warn('Could not load user data:', error);
        }
    }

    getSiteId() {
        try {
            // Try multiple possible session storage keys
            const userData = sessionStorage.getItem('contrastkit') || 
                           sessionStorage.getItem('accessbit-userinfo') || 
                           sessionStorage.getItem('accessibility-userinfo');
            if (userData) {
                const parsed = JSON.parse(userData);
                console.log('🔍 Found user data in session storage:', parsed);
                return parsed.siteId;
            }
        } catch (error) {
            console.warn('Could not get site ID from session storage:', error);
        }
        console.log('🔍 No site ID found in session storage');
        
        // Try to get siteId from URL or other sources
        try {
            // Check if we're in Webflow Designer Extension context
            if (window.webflow && window.webflow.getSiteInfo) {
                const siteInfo = window.webflow.getSiteInfo();
                if (siteInfo && siteInfo.siteId) {
                    console.log('🔍 Found siteId from Webflow API:', siteInfo.siteId);
                    return siteInfo.siteId;
                }
            }
        } catch (error) {
            console.log('🔍 Could not get siteId from Webflow API:', error);
        }
        
        // Last resort - use a default
        console.log('🔍 Using default site ID');
        return 'default-site-id';
    }

    async initializeStripeElements() {
        try {
            console.log('Initializing Stripe Elements (Payment Element only)...');
            
            await this.loadStripeScripts();
            await this.loadUserData();
            
            // Create a placeholder for now - we'll create the actual elements after getting clientSecret
            const placeholder = document.createElement('div');
            placeholder.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Payment form will load when you fill in your details above</div>';
            document.getElementById('payment-element').appendChild(placeholder);
            
            console.log('Stripe Elements initialized successfully (placeholder mode)');
            
            // Set up basic event listeners
            this.setupEventListeners();
        
        // Set up domain field monitoring
        this.setupDomainFieldMonitoring();
            
            // Add form submission handler
            const form = document.getElementById('payment-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.confirmPayment();
                });
            }
            
            console.log('Stripe Elements mounted successfully');
            
        } catch (error) {
            console.error('Error initializing Stripe elements:', error);
            this.showError(`Failed to initialize payment form: ${error?.message || 'Unknown error'}`);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Capture email from Link Authentication Element
        if (this.linkAuthenticationElement) {
            this.linkAuthenticationElement.on('change', (event) => {
                this.email = event.value.email;
                console.log('Email captured from Link Authentication Element:', this.email);
            });
            
            // Also try to get email immediately if already filled
            try {
                const currentValue = this.linkAuthenticationElement.getValue();
                if (currentValue && currentValue.email) {
                    this.email = currentValue.email;
                    console.log('Email captured immediately from Link Authentication Element:', this.email);
                }
            } catch (e) {
                console.log('Could not get immediate value from Link Authentication Element:', e);
            }
        }
        
        // Also try to capture email from any email input field as fallback
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                if (e.target.value && !this.email) {
                    this.email = e.target.value;
                    console.log('Email captured from input field:', this.email);
                }
            });
        }
        
        // Capture domain URL from custom form field
        const domainInput = document.getElementById('domain-url');
        if (domainInput) {
            domainInput.addEventListener('input', (e) => {
                this.domainUrl = e.target.value;
                console.log('Domain captured:', this.domainUrl);
            });
        }
    }
    
    setupDomainFieldMonitoring() {
        console.log('Setting up domain field monitoring...');
        
        // Monitor domain field for changes
        const monitorDomainField = () => {
            const domainInput = document.getElementById('domain-url');
            if (domainInput) {
                // Handle input events
                domainInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    console.log('🔍 Domain field input event:', value);
                    if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                        this.domainUrl = value.trim();
                        console.log('🔍 Domain URL updated in real-time:', this.domainUrl);
                    }
                });
                
                // Handle paste events
                domainInput.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        const value = domainInput.value;
                        console.log('🔍 Domain field paste event:', value);
                        if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                            this.domainUrl = value.trim();
                            console.log('🔍 Domain URL updated from paste:', this.domainUrl);
                        }
                    }, 100);
                });
                
                // Handle change events
                domainInput.addEventListener('change', (e) => {
                    const value = e.target.value;
                    console.log('🔍 Domain field change event:', value);
                    if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                        this.domainUrl = value.trim();
                        console.log('🔍 Domain URL updated from change:', this.domainUrl);
                    }
                });
                
                console.log('🔍 Domain field monitoring set up successfully');
            } else {
                console.log('🔍 Domain field not found, retrying...');
                setTimeout(monitorDomainField, 1000);
            }
        };
        
        // Start monitoring after a delay
        setTimeout(monitorDomainField, 2000);
    }

    captureDomainUrl() {
        console.log('🔍 CAPTURING DOMAIN URL...');
        
        // Method 1: Try to find the domain URL input field
        const domainInput = document.getElementById('domain-url');
        if (domainInput) {
            // Get the value, including default value
            const inputValue = domainInput.value || domainInput.defaultValue || '';
            console.log('🔍 Domain input field value:', inputValue);
            console.log('🔍 Domain input field type:', typeof inputValue);
            console.log('🔍 Domain input field length:', inputValue ? inputValue.length : 'undefined');
            
            if (inputValue.trim() !== '' && !inputValue.includes('example.com') && !inputValue.includes('your-domain.com')) {
                this.domainUrl = inputValue.trim();
            console.log('🔍 Domain captured from input field:', this.domainUrl);
            return;
            } else {
                console.log('🔍 Domain input value rejected:', inputValue);
            }
        }
        
        // Method 2: Try alternative selectors
        const altDomainInput = document.querySelector('input[type="url"]') || document.querySelector('input[placeholder*="example.com"]');
        if (altDomainInput && altDomainInput.value && altDomainInput.value.trim() !== '') {
            this.domainUrl = altDomainInput.value.trim();
            console.log('🔍 Domain captured from alternative input:', this.domainUrl);
            return;
        }
        
        // Method 3: Try to find any input with a domain-like value
        const allInputs = document.querySelectorAll('input');
        for (let input of allInputs) {
            if (input.value && input.value.trim() !== '' && (input.value.includes('http') || input.value.includes('.com') || input.value.includes('.io'))) {
                this.domainUrl = input.value.trim();
                console.log('🔍 Domain captured from input field:', this.domainUrl);
                return;
            }
        }
        
        // Method 4: Force focus and blur to trigger events
        if (domainInput) {
            domainInput.focus();
            domainInput.blur();
            if (domainInput.value && domainInput.value.trim() !== '') {
                this.domainUrl = domainInput.value.trim();
                console.log('🔍 Domain captured after focus/blur:', this.domainUrl);
                return;
            }
        }
        
        // Method 5: Check if there's a value in the input that we missed
        if (domainInput && domainInput.getAttribute('value')) {
            this.domainUrl = domainInput.getAttribute('value');
            console.log('🔍 Domain captured from attribute:', this.domainUrl);
            return;
        }
        
        console.log('🔍 No domain URL found, will use fallback');
        console.log('🔍 Available inputs:', Array.from(document.querySelectorAll('input')).map(input => ({
            id: input.id,
            type: input.type,
            value: input.value,
            placeholder: input.placeholder
        })));
    }

    async processPayment() {
        // Add a small delay to ensure input fields are updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const submitButton = document.getElementById('subscribe-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }
        
        console.log('Processing payment...');
        
        // Capture domain URL BEFORE creating subscription
        this.captureDomainUrl();
        
        // Wait a bit more to ensure domain is captured
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Re-capture domain URL to get the latest value
        this.captureDomainUrl();
        
        // Also ensure email is captured
        if (this.linkAuthenticationElement) {
            try {
                const linkValue = this.linkAuthenticationElement.getValue();
                if (linkValue && linkValue.email) {
                    this.email = linkValue.email;
                    console.log('🔍 Email captured before payment processing:', this.email);
                } else {
                    console.log('🔍 Link Authentication Element value:', linkValue);
                    console.log('🔍 Link Authentication Element has email:', linkValue?.email);
                }
            } catch (e) {
                console.log('🔍 Could not get email before payment processing:', e);
            }
        }
        
        // Force capture email from any available source
        if (!this.email) {
            console.log('🔍 No email in this.email, trying to capture from other sources...');
            
            // Try to get email from session storage
            try {
                const userData = sessionStorage.getItem('contrastkit');
                console.log('🔍 Session storage contrastkit:', userData);
                if (userData) {
                    const parsed = JSON.parse(userData);
                    console.log('🔍 Parsed session data:', parsed);
                    if (parsed.email) {
                        this.email = parsed.email;
                        console.log('🔍 Email captured from session storage:', this.email);
                    } else {
                        console.log('🔍 No email in session storage, trying other keys...');
                        
                        // Try other possible session storage keys
                        const otherKeys = ['accessbit-userinfo', 'accessibility-userinfo', 'userinfo'];
                        for (const key of otherKeys) {
                            const otherData = sessionStorage.getItem(key);
                            if (otherData) {
                                console.log(`🔍 Found data in ${key}:`, otherData);
                                try {
                                    const otherParsed = JSON.parse(otherData);
                                    if (otherParsed.email) {
                                        this.email = otherParsed.email;
                                        console.log(`🔍 Email captured from ${key}:`, this.email);
                                        break;
                                    }
                                } catch (e) {
                                    console.log(`🔍 Could not parse ${key}:`, e);
                                }
                            }
                        }
                    }
                } else {
                    console.log('🔍 No contrastkit data in session storage');
                    console.log('🔍 All session storage keys:', Object.keys(sessionStorage));
                    console.log('🔍 All session storage values:', Object.keys(sessionStorage).map(key => ({ key, value: sessionStorage.getItem(key) })));
                }
            } catch (e) {
                console.log('🔍 Could not get email from session storage:', e);
            }
        }
        
        try {
            // Get the selected plan (annual or monthly) from data attribute
            const paymentForm = document.getElementById('payment-form');
            const planType = paymentForm?.getAttribute('data-plan-type');
            const isAnnual = planType === 'annual';
            const productId = isAnnual ? 'prod_TEHrwLZdPcOsgq' : 'prod_TEH4ANvvsQysIO';
            
            // Capture domain URL at submission time (in case input event didn't fire)
            const domainInput = document.getElementById('domain-url');
            console.log('Domain input element found:', !!domainInput);
            console.log('Domain input element:', domainInput);
            
            // Try alternative selectors if the main one fails
            const altDomainInput = document.querySelector('input[type="url"]') || document.querySelector('input[placeholder*="example.com"]');
            console.log('Alternative domain input found:', !!altDomainInput);
            
            // Get the current value from the input field - try multiple methods
            let currentDomainUrl = '';
            
            // Method 1: Direct value access
            if (domainInput) {
                currentDomainUrl = domainInput.value || '';
                console.log('Method 1 - Direct value:', currentDomainUrl);
                console.log('Method 1 - Input element:', domainInput);
                console.log('Method 1 - Input type:', domainInput.type);
                console.log('Method 1 - Input placeholder:', domainInput.placeholder);
            }
            
            // Method 2: Alternative input
            if (!currentDomainUrl && altDomainInput) {
                currentDomainUrl = altDomainInput.value || '';
                console.log('Method 2 - Alternative input:', currentDomainUrl);
            }
            
            // Method 3: Force focus and blur to trigger events
            if (!currentDomainUrl && domainInput) {
                domainInput.focus();
                domainInput.blur();
                currentDomainUrl = domainInput.value || '';
                console.log('Method 3 - Focus/blur:', currentDomainUrl);
            }
            
            // Method 4: Check all inputs for domain-like values
            if (!currentDomainUrl) {
                const allInputs = document.querySelectorAll('input');
                console.log('Method 4 - Checking all inputs:', allInputs.length);
                for (let input of allInputs) {
                    console.log('Method 4 - Input value:', input.value, 'Type:', input.type, 'ID:', input.id);
                    if (input.value && (input.value.includes('http') || input.value.includes('.com') || input.value.includes('.io'))) {
                        currentDomainUrl = input.value;
                        console.log('Method 4 - Found domain in input:', input.value);
                        break;
                    }
                }
            }
            
            // Method 5: Try to get value from any input that might contain the domain
            if (!currentDomainUrl) {
                const allInputs = document.querySelectorAll('input');
                for (let input of allInputs) {
                    if (input.value && input.value.includes('websnap')) {
                        currentDomainUrl = input.value;
                        console.log('Method 5 - Found websnap domain:', input.value);
                        break;
                    }
                }
            }
            
            // Method 6: Try to get value from any input that contains webflow.io
            if (!currentDomainUrl) {
                const allInputs = document.querySelectorAll('input');
                for (let input of allInputs) {
                    if (input.value && input.value.includes('webflow.io')) {
                        currentDomainUrl = input.value;
                        console.log('Method 6 - Found webflow.io domain:', input.value);
                        break;
                    }
                }
            }
            
            // Method 7: Try to get value from any input that contains https
            if (!currentDomainUrl) {
                const allInputs = document.querySelectorAll('input');
                for (let input of allInputs) {
                    if (input.value && input.value.startsWith('https://')) {
                        currentDomainUrl = input.value;
                        console.log('Method 7 - Found https domain:', input.value);
                        break;
                    }
                }
            }
            
            // Method 8: Try to get value from any input that contains a domain pattern
            if (!currentDomainUrl) {
                const allInputs = document.querySelectorAll('input');
                for (let input of allInputs) {
                    if (input.value && (input.value.includes('.com') || input.value.includes('.io') || input.value.includes('.net'))) {
                        currentDomainUrl = input.value;
                        console.log('Method 8 - Found domain pattern:', input.value);
                        break;
                    }
                }
            }
            
            // Final attempt: Check if we can find the domain URL in any way
            if (!currentDomainUrl) {
                console.log('🔍 FINAL ATTEMPT: Searching for domain URL...');
                
                // Try to find any input with a value that looks like a URL
                const allInputs = document.querySelectorAll('input');
                console.log('🔍 Total inputs found:', allInputs.length);
                
                for (let i = 0; i < allInputs.length; i++) {
                    const input = allInputs[i];
                    console.log(`🔍 Input ${i}:`, {
                        id: input.id,
                        type: input.type,
                        value: input.value,
                        placeholder: input.placeholder
                    });
                    
                    if (input.value && input.value.trim() !== '') {
                        currentDomainUrl = input.value;
                        console.log('🔍 FOUND DOMAIN:', input.value);
                        break;
                    }
                }
            }
            
            const finalDomainUrl = currentDomainUrl || this.domainUrl || '';
            
            console.log('All input fields on page:', document.querySelectorAll('input').length);
            console.log('All URL input fields:', document.querySelectorAll('input[type="url"]').length);
            
            console.log('Domain URL at submission:', finalDomainUrl);
            console.log('Input field value:', currentDomainUrl);
            console.log('Input field value length:', currentDomainUrl ? currentDomainUrl.length : 'undefined');
            console.log('Stored domainUrl:', this.domainUrl);
            console.log('window.location.hostname:', window.location.hostname);
            
            // Create subscription with Stripe product
            console.log('Creating subscription with:', { siteId: this.siteId, productId });
            // Use the captured domain URL or fallback
            let domainToUse = this.domainUrl || finalDomainUrl;
            
            // If still no domain, try to get it from the input field directly
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                const domainInput = document.getElementById('domain-url');
                if (domainInput && domainInput.value && !domainInput.value.includes('example.com') && !domainInput.value.includes('your-domain.com')) {
                    domainToUse = domainInput.value.trim();
                    console.log('🔍 Using domain from input field directly:', domainToUse);
                }
            }
            
            // If still no domain, try to get it from window location
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                try {
                    const currentUrl = window.location.href;
                    if (currentUrl && !currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
                        const url = new URL(currentUrl);
                        domainToUse = `${url.protocol}//${url.hostname}`;
                        console.log('🔍 Using domain from window location:', domainToUse);
                    }
                } catch (e) {
                    console.log('🔍 Could not parse window location:', e);
                }
            }
            
            // Final fallback
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                domainToUse = 'https://example.com';
                console.log('🔍 Using fallback domain:', domainToUse);
            }
            
            console.log('🔍 Final domain URL being used:', domainToUse);
            
            // Enhanced email capture - try multiple methods
            let emailToUse = this.email || '';
            console.log('🔍 Initial emailToUse:', emailToUse);
            console.log('🔍 this.email:', this.email);
            
            // Method 1: Check Link Authentication Element
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    const linkValue = this.linkAuthenticationElement.getValue();
                    if (linkValue && linkValue.email) {
                        emailToUse = linkValue.email;
                        console.log('Email captured from Link Authentication Element:', emailToUse);
                    } else {
                        console.log('Link Authentication Element value:', linkValue);
                    }
                } catch (e) {
                    console.log('Could not get email from Link Authentication Element:', e);
                }
            }
            
            // Method 1.5: Force get email from Link Authentication Element
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    // Try to get the current value directly
                    const currentValue = this.linkAuthenticationElement.getValue();
                    if (currentValue && currentValue.email) {
                        emailToUse = currentValue.email;
                        console.log('Email captured from Link Authentication Element (direct):', emailToUse);
                    }
                } catch (e) {
                    console.log('Could not get email from Link Authentication Element (direct):', e);
                }
            }
            
            // Method 1.5: Try to get email from Link Authentication Element events
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    // Force a change event to capture email
                    this.linkAuthenticationElement.on('change', (event) => {
                        if (event.value && event.value.email) {
                            emailToUse = event.value.email;
                            console.log('Email captured from Link Authentication Element change event:', emailToUse);
                        }
                    });
                } catch (e) {
                    console.log('Could not set up Link Authentication Element listener:', e);
                }
            }
            
            // Method 2: Check any email input field
            if (!emailToUse) {
                const emailInput = document.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    emailToUse = emailInput.value;
                    console.log('Email captured from email input field:', emailToUse);
                }
            }
            
            // Method 3: Check all input fields for email-like values
            if (!emailToUse) {
                const allInputs = document.querySelectorAll('input');
                for (let input of allInputs) {
                    if (input.value && input.value.includes('@')) {
                        emailToUse = input.value;
                        console.log('Email captured from input field:', emailToUse);
                        break;
                    }
                }
            }
            
            // Method 4: Try to get email from stored user data
            if (!emailToUse) {
                try {
                    const storedData = sessionStorage.getItem('contrastkit');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        if (parsedData.email) {
                            emailToUse = parsedData.email;
                            console.log('Email captured from stored user data:', emailToUse);
                        }
                    }
                } catch (e) {
                    console.log('Could not get email from stored data:', e);
                }
            }
            
            // Final fallback: use this.email if still empty
            if (!emailToUse || emailToUse.trim() === '') {
                emailToUse = this.email || '';
                console.log('Using this.email as final fallback:', emailToUse);
            }
            
            console.log('Final email being used:', emailToUse);
            console.log('Email type:', typeof emailToUse);
            console.log('Email length:', emailToUse ? emailToUse.length : 'undefined');
            console.log('Email is empty:', !emailToUse || emailToUse.trim() === '');
            
            const subscriptionData = {
                siteId: this.siteId,
                productId: productId,
                domain: domainToUse,
                email: emailToUse,
                domainUrl: domainToUse
            };
            console.log('Subscription data being sent:', JSON.stringify(subscriptionData, null, 2));
            console.log('Final email being sent:', emailToUse);
            console.log('Final email type:', typeof emailToUse);
            console.log('Final email length:', emailToUse ? emailToUse.length : 'undefined');
            console.log('Final domain URL being sent:', domainToUse);
            console.log('Domain URL type:', typeof domainToUse);
            console.log('Domain URL length:', domainToUse ? domainToUse.length : 'undefined');
            console.log('Domain URL is example.com:', domainToUse && domainToUse.includes('example.com'));
            console.log('Domain URL is empty:', !domainToUse || domainToUse.trim() === '');
            
            // Log domain URL status but don't block payment
            if (!finalDomainUrl || finalDomainUrl.trim() === '') {
                console.warn('Domain URL is empty - will use fallback');
            } else {
                console.log('Domain URL captured successfully:', finalDomainUrl);
            }
            
            // Step 1: Set up payment method
            console.log('Setting up payment method...');
            console.log('🔍 Setup payment data:', {
                email: emailToUse,
                domainUrl: domainToUse,
                siteId: this.siteId
            });
            console.log('🔍 Email value:', emailToUse);
            console.log('🔍 Domain value:', domainToUse);
            console.log('🔍 SiteId value:', this.siteId);
            
            // Ensure we have a valid siteId
            if (!this.siteId || this.siteId === 'default-site-id') {
                console.error('❌ No valid siteId found!');
                console.error('❌ this.siteId:', this.siteId);
                console.error('❌ Session storage keys:', Object.keys(sessionStorage));
                console.error('❌ Session storage contrastkit:', sessionStorage.getItem('contrastkit'));
                
                // Try to get siteId from URL or other sources as last resort
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const siteIdFromUrl = urlParams.get('siteId');
                    if (siteIdFromUrl) {
                        console.log('🔍 Found siteId in URL:', siteIdFromUrl);
                        this.siteId = siteIdFromUrl;
                    }
                } catch (e) {
                    console.log('🔍 Could not get siteId from URL:', e);
                }
                
                if (!this.siteId || this.siteId === 'default-site-id') {
                    throw new Error('No valid site ID found. Please refresh the page and try again.');
                }
            }
            
            // Ensure we have a valid email
            if (!this.email || this.email.trim() === '') {
                console.error('❌ No valid email found!');
                console.error('❌ this.email:', this.email);
                
                // Last resort: try to get email from the authentication data we know exists
                try {
                    const authData = sessionStorage.getItem('contrastkit');
                    if (authData) {
                        const parsed = JSON.parse(authData);
                        if (parsed.email) {
                            this.email = parsed.email;
                            console.log('🔍 Email found in auth data:', this.email);
                        } else {
                            // Use a default email for testing
                            this.email = 'dev5@seattlenewmedia.com';
                            console.log('🔍 Using default email for testing:', this.email);
                        }
                    } else {
                        // Use a default email for testing
                        this.email = 'dev5@seattlenewmedia.com';
                        console.log('🔍 Using default email for testing:', this.email);
                    }
            } catch (e) {
                    // Use a default email for testing
                    this.email = 'dev5@seattlenewmedia.com';
                    console.log('🔍 Using default email for testing:', this.email);
                }
                
                if (!this.email || this.email.trim() === '') {
                    throw new Error('No valid email found. Please enter your email address and try again.');
                }
            }
            
            // Use this.email instead of emailToUse since we've ensured it's valid
            const finalEmail = this.email || emailToUse;
            
            // Debug the values being sent
            const requestData = {
                email: finalEmail,
                domainUrl: domainToUse,
                siteId: this.siteId
            };
            console.log('🔍 Setup payment request data:', requestData);
            console.log('🔍 Final email being used:', finalEmail);
            console.log('🔍 Email value (original):', emailToUse);
            console.log('🔍 this.email:', this.email);
            console.log('🔍 Domain value:', domainToUse);
            console.log('🔍 SiteId value:', this.siteId);
            console.log('🔍 SiteId type:', typeof this.siteId);
            console.log('🔍 SiteId length:', this.siteId ? this.siteId.length : 'undefined');
            
            // Log the exact JSON being sent
            const jsonBody = JSON.stringify(requestData);
            console.log('🔍 JSON body being sent:', jsonBody);
            console.log('🔍 JSON body length:', jsonBody.length);
            console.log('🔍 JSON body type:', typeof jsonBody);
            
            const setupResponse = await fetch(`${this.kvApiUrl}/api/accessibility/setup-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonBody
            });
            
            if (!setupResponse.ok) {
                let setupError;
                try {
                    setupError = await setupResponse.json();
                } catch (e) {
                    const errorText = await setupResponse.text();
                    console.error('🔍 Server response (not JSON):', errorText);
                    throw new Error(`Payment setup failed: ${setupResponse.status} ${setupResponse.statusText} - ${errorText}`);
                }
                console.error('🔍 Server error response:', setupError);
                throw new Error(`Payment setup failed: ${setupError.error || setupResponse.statusText}`);
            }
            
            const setupData = await setupResponse.json();
            console.log('Payment setup successful:', setupData);
            
            // Store setup data
            this.setupIntentId = setupData.setupIntentId;
            this.customerId = setupData.customerId;
            this.clientSecret = setupData.clientSecret;
            
            console.log('Payment setup completed, clientSecret present');
            console.log('Payment method requires confirmation');
            
            // Clear placeholders and create actual Stripe Elements
            const paymentContainer = document.getElementById('payment-element');
            const linkContainer = document.getElementById('link-authentication-element');
            paymentContainer.innerHTML = '';
            if (linkContainer) linkContainer.innerHTML = '';
            
            // Stripe Appearance API - matching your app's design
            const appearance = {
                theme: 'flat',
                variables: {
                    colorPrimary: '#0570de',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Ideal Sans, system-ui, sans-serif',
                    spacingUnit: '2px',
                    borderRadius: '4px',
                }
            };
            
            // Create the Elements instance
            const clientSecret = this.clientSecret;
            if (!clientSecret) {
                throw new Error('Missing client secret. Please try again.');
            }
            console.log('🔍 Using clientSecret for Stripe Elements:', clientSecret.substring(0, 20) + '...');
            this.elements = this.stripe.elements({ clientSecret, appearance });
            
            // Create and mount the Link Authentication Element for email collection
            this.linkAuthenticationElement = this.elements.create("linkAuthentication");
            this.linkAuthenticationElement.mount("#link-authentication-element");
            
            // Create and mount the Payment Element
            this.paymentElement = this.elements.create("payment");
            this.paymentElement.mount("#payment-element");
            
            // Add event listeners to capture data
            this.setupEventListeners();
            
            console.log('Stripe Elements created successfully. User can now fill in details.');
            
        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError(`Payment processing error: ${error.message}`);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Subscribe';
            }
        }
    }

    async confirmPayment() {
        // Prevent double confirmation
        if (this.isConfirming) {
            console.log('Payment confirmation already in progress, skipping...');
            return;
        }
        
        this.isConfirming = true;
        
        try {
            console.log('Confirming payment with email:', this.email, 'and domain:', this.domainUrl);
            console.log('Client secret type:', this.clientSecret ? this.clientSecret.substring(0, 20) + '...' : 'none');
            
            // Log domain URL status but don't block payment
            if (!this.domainUrl) {
                console.warn('Domain URL is empty - proceeding with fallback');
            }
            
            // Check if this is a SetupIntent or PaymentIntent based on client secret format
            const isSetupIntent = this.clientSecret && this.clientSecret.includes('seti_');
            console.log('Is SetupIntent:', isSetupIntent);
            
            let result;
            if (isSetupIntent) {
                console.log('Using confirmSetup for SetupIntent');
                result = await this.stripe.confirmSetup({
                    elements: this.elements,
                    redirect: 'if_required',
                    confirmParams: {
                        return_url: window.location.href + '?subscription_success=true',
                        payment_method_data: {
                            billing_details: { email: this.email },
                            metadata: { domain_url: this.domainUrl }
                        }
                    }
                }).catch(err => {
                    console.error('Stripe confirmSetup error:', err);
                    this.showError('Setup confirmation failed. Please try again.');
                    return { error: err };
                });
            } else {
                console.log('Using confirmPayment for PaymentIntent');
                result = await this.stripe.confirmPayment({
                elements: this.elements,
                redirect: 'if_required',
                confirmParams: {
                    return_url: window.location.href + '?subscription_success=true',
                    payment_method_data: {
                        billing_details: { email: this.email },
                        metadata: { domain_url: this.domainUrl }
                    }
                }
            }).catch(err => {
                console.error('Stripe confirmPayment error:', err);
                this.showError('Payment confirmation failed. Please try again.');
                return { error: err };
            });
            }
            
            const { error, paymentIntent, setupIntent } = result;

            if (!error) {
                // Payment/Setup succeeded - trigger success event for in-app handling
                console.log('✅ Payment/Setup completed successfully');
                console.log('✅ Payment Intent:', paymentIntent);
                console.log('✅ Setup Intent:', setupIntent);

                const intentId = paymentIntent?.id || setupIntent?.id;
                console.log('✅ Intent ID:', intentId);
                
                // Step 2: Verify payment method was attached
                if (setupIntent && setupIntent.status === 'succeeded') {
                    console.log('Verifying payment method attachment...');
                    
                    try {
                        const verifyResponse = await fetch(`${this.kvApiUrl}/api/accessibility/verify-payment-method`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ setupIntentId: setupIntent.id })
                        });
                        
                        if (!verifyResponse.ok) {
                            const verifyError = await verifyResponse.json();
                            throw new Error(`Payment method verification failed: ${verifyError.error || verifyResponse.statusText}`);
                        }
                        
                        const verifyData = await verifyResponse.json();
                        console.log('✅ Payment method verified:', verifyData);
                        
                        // Step 3: Create subscription with verified payment method
                        console.log('Creating subscription with verified payment method...');
                        
                        // Determine selected plan (annual/monthly) to set correct productId
                        let selectedProductId = 'prod_TEHrwLZdPcOsgq'; // annual default
                        try {
                            const paymentFormEl = document.getElementById('payment-form');
                            const planTypeAttr = paymentFormEl?.getAttribute('data-plan-type');
                            const isAnnualPlan = planTypeAttr === 'annual';
                            selectedProductId = isAnnualPlan ? 'prod_TEHrwLZdPcOsgq' : 'prod_TEH4ANvvsQysIO';
                            console.log('Selected plan type for subscription creation:', planTypeAttr, '=> productId:', selectedProductId);
                        } catch (e) {
                            console.warn('Could not resolve plan type from DOM, using annual productId by default');
                        }

                        const subscriptionResponse = await fetch(`${this.kvApiUrl}/api/accessibility/create-subscription`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                siteId: this.siteId,
                                productId: selectedProductId,
                                email: this.email,
                                domain: this.domainUrl,
                                domainUrl: this.domainUrl,
                                paymentMethodId: verifyData.paymentMethodId, // verified payment method ID
                                customerId: verifyData.customerId // ensure same customer used for subscription
                            })
                        });
                        
                        if (!subscriptionResponse.ok) {
                            let subscriptionErrorText = '';
                            try {
                                const subscriptionErrorJson = await subscriptionResponse.json();
                                subscriptionErrorText = subscriptionErrorJson.details || subscriptionErrorJson.error || JSON.stringify(subscriptionErrorJson);
                            } catch (_) {
                                subscriptionErrorText = await subscriptionResponse.text();
                            }
                            throw new Error(`Subscription creation failed: ${subscriptionErrorText || subscriptionResponse.statusText}`);
                        }
                        
                        const subscriptionData = await subscriptionResponse.json();
                        console.log('✅ Subscription created:', subscriptionData);
                        
                        // Store subscription ID
                        this.subscriptionId = subscriptionData.subscriptionId;
                        
                        // Handle subscription status
                        if (subscriptionData.status === 'active') {
                            console.log('✅ Subscription is active immediately!');
                            this.showSuccess('Subscription activated successfully!');
                            
                            // Dispatch success event to show success screen
                            console.log('🔥 Dispatching stripe-payment-success event for immediate active subscription');
                            window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                                detail: {
                                    siteId: this.siteId,
                                    subscriptionId: this.subscriptionId,
                                    timestamp: new Date().toISOString(),
                                    subscriptionDetails: subscriptionData
                                }
                            }));
                        } else {
                            console.log('Subscription status:', subscriptionData.status);
                            
                            // For incomplete subscriptions, wait for webhook or poll
                            if (subscriptionData.status === 'incomplete' && this.subscriptionId) {
                                console.log('Subscription is incomplete, waiting for webhook or polling...');
                            }
                            
                            // Poll for status changes if needed
                            if (this.subscriptionId) {
                                await this.pollSubscriptionStatus(this.subscriptionId);
                            }
                        }
                        
                    } catch (verifyError) {
                        console.error('❌ Payment method verification failed:', verifyError);
                        this.showError(`Payment verification failed: ${verifyError.message}`);
                        return;
                    }
                }
                
                // Update subscription status in your backend (only for PaymentIntent)
                if (paymentIntent && !isSetupIntent) {
                try {
                    const updateResponse = await fetch(`${this.kvApiUrl}/api/accessibility/update-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            siteId: this.siteId,
                            paymentStatus: 'active',
                            subscriptionId: paymentIntent.metadata?.subscriptionId,
                            customerId: paymentIntent.metadata?.customerId
                        })
                    });
                    
                    if (updateResponse.ok) {
                        console.log('✅ Subscription status updated to active');
                    } else {
                        console.warn('⚠️ Failed to update subscription status');
                    }
                } catch (updateError) {
                    console.warn('⚠️ Error updating subscription status:', updateError);
                    }
                }
                
                // Try to get subscription details before dispatching event
                let subscriptionDetails = null;
                if (this.subscriptionId) {
                    try {
                        const statusResponse = await fetch(`${this.kvApiUrl}/api/accessibility/check-subscription-status?id=${this.subscriptionId}`);
                        if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            subscriptionDetails = statusData;
                            console.log('🔥 Got subscription details for event:', subscriptionDetails);
                        }
                    } catch (error) {
                        console.log('🔥 Failed to get subscription details for event:', error);
                    }
                }
                
                window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                    detail: {
                        siteId: this.siteId,
                        email: this.email,
                        domain: this.domainUrl,
                        timestamp: new Date().toISOString(),
                        paymentIntent: paymentIntent,
                        setupIntent: setupIntent,
                        intentId: intentId,
                        subscriptionId: this.subscriptionId,
                        subscriptionDetails: subscriptionDetails
                    }
                }));
                
                        // Only show success when backend confirms active
                        if (this.subscriptionId) {
                            await this.pollSubscriptionStatus(this.subscriptionId);
                        }
                
                // For SetupIntent, wait for webhook or poll
                if (isSetupIntent && setupIntent) {
                    console.log('SetupIntent completed, waiting for webhook or polling...');
                    console.log('SetupIntent ID:', setupIntent.id);
                    console.log('Payment Method ID:', setupIntent.payment_method);
                    console.log('Site ID:', this.siteId);
                    
                    // Poll subscription status to check for activation
                    if (this.subscriptionId) {
                        await this.pollSubscriptionStatus(this.subscriptionId);
                    }
                }
                
                // Also poll for PaymentIntent subscriptions to ensure activation
                if (!isSetupIntent && paymentIntent && this.subscriptionId) {
                    console.log('PaymentIntent completed, polling subscription status...');
                    await this.pollSubscriptionStatus(this.subscriptionId);
                }
            } else {
                console.error('❌ Payment failed:', error);
                this.showError(`Payment failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            this.showError(`Payment confirmation error: ${error.message}`);
        } finally {
            this.isConfirming = false;
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        console.error('Payment Error:', message);
    }
    
    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }

        // Also log to console
        console.log('Payment Success:', message);

        // Hide any error messages
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Poll subscription status until it becomes active
    async pollSubscriptionStatus(subscriptionId, maxAttempts = 10) {
        console.log('Starting subscription status polling for:', subscriptionId);
        console.log('Max attempts:', maxAttempts);
        let attempts = 0;
        
        const checkStatus = async () => {
            try {
                const response = await fetch(`${this.kvApiUrl}/api/accessibility/check-subscription-status?id=${subscriptionId}`);
                
                if (!response.ok) {
                    console.error('Failed to check subscription status:', response.status);
                    return false;
                }
                
                const data = await response.json();
                console.log('Subscription status check:', data);
                console.log('Attempt:', attempts + 1, 'of', maxAttempts);
                
                if (data.status === 'active') {
                    this.showSuccess('Subscription is now active!');
                    
                    // Dispatch success event to show success screen
                    window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                        detail: {
                            siteId: this.siteId,
                            subscriptionId: subscriptionId,
                            timestamp: new Date().toISOString(),
                            subscriptionDetails: data
                        }
                    }));
                    
                    return true;
                } else if (data.status === 'incomplete_expired') {
                    throw new Error('Subscription payment expired. Please try again.');
                } else if (attempts >= maxAttempts) {
                    console.log('Max attempts reached, subscription still incomplete');
                    console.log('Final status:', data.status);
                    throw new Error(`Subscription is still ${data.status} after ${maxAttempts} attempts`);
                }
                
                attempts++;
                return false;
            } catch (error) {
                console.error('Error checking subscription status:', error);
                throw error;
            }
        };
        
        // Check immediately first
        if (await checkStatus()) return;
        
        // Then check every 3 seconds
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(async () => {
                try {
                    const done = await checkStatus();
                    if (done) {
                        clearInterval(intervalId);
                        resolve();
                    }
                } catch (error) {
                    clearInterval(intervalId);
                    this.showError(error.message);
                    reject(error);
                }
            }, 3000);
            
            // Safety timeout after 30 seconds
            setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error('Timed out waiting for subscription to become active'));
            }, 30000);
        });
    }

    handlePurchaseNow() {
        console.log('Purchase Now clicked - Initializing Stripe Elements');
        this.initializeStripeElements();
        // Immediately process payment to create Stripe Elements
        setTimeout(() => {
            this.processPayment();
        }, 100);
    }
}

function initializeExistingPaymentIntegration() {
    console.log('Stripe Integration: Initializing...');
    
    const integration = new ExistingPaymentIntegration();
    
    window.stripeIntegration = {
        handlePurchaseNow: integration.handlePurchaseNow.bind(integration)
    };
    
    console.log('Stripe Integration: Ready. React can now call handlePurchaseNow()');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExistingPaymentIntegration);
} else {
    initializeExistingPaymentIntegration();
}