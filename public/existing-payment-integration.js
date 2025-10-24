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
        this.planType = null;
        this.lastSubmissionTime = 0;
        this.submissionCooldown = 3000; // 3 seconds cooldown between submissions
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
            const userData = localStorage.getItem('accessbit-userinfo') || 
                           localStorage.getItem('accessbit-userinfo') || 
                           localStorage.getItem('accessibility-userinfo');
            if (userData) {
                const parsed = JSON.parse(userData);
                this.siteId = parsed.siteId || this.siteId;
             
            }
        } catch (error) {
            
        }
    }

    getSiteId() {
        try {
            // Try multiple possible session storage keys
            const userData = localStorage.getItem('accessbit-userinfo') || 
                           localStorage.getItem('accessbit-userinfo') || 
                           localStorage.getItem('accessibility-userinfo');
            if (userData) {
                const parsed = JSON.parse(userData);
       
                return parsed.siteId;
            }
        } catch (error) {
          
        }
   
        
        // Try to get siteId from URL or other sources
        try {
            // Check if we're in Webflow Designer Extension context
            if (window.webflow && window.webflow.getSiteInfo) {
                const siteInfo = window.webflow.getSiteInfo();
                if (siteInfo && siteInfo.siteId) {
              
                    return siteInfo.siteId;
                }
            }
        } catch (error) {
           
        }
        

        return 'default-site-id';
    }

    async initializeStripeElements() {
        try {
          
            
            await this.loadStripeScripts();
            await this.loadUserData();
            
            // Create a placeholder for now - we'll create the actual elements after getting clientSecret
            const placeholder = document.createElement('div');
            placeholder.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Payment form will load when you fill in your details above</div>';
            document.getElementById('payment-element').appendChild(placeholder);
            
           
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
     
            
        } catch (error) {
        
            this.showError(`Failed to initialize payment form: ${error?.message || 'Unknown error'}`);
        }
    }

    setupEventListeners() {
    
        
        // Capture email from Link Authentication Element
        if (this.linkAuthenticationElement) {
            this.linkAuthenticationElement.on('change', (event) => {
                this.email = event.value.email;
        
            });
            
            // Also try to get email immediately if already filled
            try {
                const currentValue = this.linkAuthenticationElement.getValue();
                if (currentValue && currentValue.email) {
                    this.email = currentValue.email;
                   
                }
            } catch (e) {
              
            }
        }
        
        // Also try to capture email from any email input field as fallback
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                if (e.target.value && !this.email) {
                    this.email = e.target.value;
                 
                }
            });
        }
        
        // Capture domain URL from custom form field
        const domainInput = document.getElementById('domain-url');
        if (domainInput) {
            domainInput.addEventListener('input', (e) => {
                this.domainUrl = e.target.value;
           
            });
        }
    }
    
    setupDomainFieldMonitoring() {
       
        
        // Monitor domain field for changes
        const monitorDomainField = () => {
            const domainInput = document.getElementById('domain-url');
            if (domainInput) {
                // Handle input events
                domainInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                 
                    if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                        this.domainUrl = value.trim();
                      
                    }
                });
                
                // Handle paste events
                domainInput.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        const value = domainInput.value;
                   
                        if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                            this.domainUrl = value.trim();
                           
                        }
                    }, 100);
                });
                
                // Handle change events
                domainInput.addEventListener('change', (e) => {
                    const value = e.target.value;
                   
                    if (value && !value.includes('example.com') && !value.includes('your-domain.com')) {
                        this.domainUrl = value.trim();
                      
                    }
                });
                
              
            } else {
                setTimeout(monitorDomainField, 1000);
            }
        };
        
        // Start monitoring after a delay
        setTimeout(monitorDomainField, 2000);
    }

    capturePlanType() {
    
        
        try {
            // Try multiple selectors to find the payment form
            const paymentForm = document.getElementById('payment-form') || 
                               document.querySelector('form[id*="payment"]') || 
                               document.querySelector('form[data-plan-type]') ||
                               document.querySelector('form');
            
            if (paymentForm) {
                const planType = paymentForm.getAttribute('data-plan-type');
                this.planType = planType;
              
                // If no data-plan-type attribute, try to find it in other ways
                if (!planType) {
                   
                    // Look for plan type in form inputs or other elements
                    const planInputs = document.querySelectorAll('input[name*="plan"], input[value*="monthly"], input[value*="annual"]');
                  
                    // Look for plan type in the form's parent or nearby elements
                    const planContainer = paymentForm.closest('[data-plan-type]') || 
                                        paymentForm.parentElement?.querySelector('[data-plan-type]');
                    if (planContainer) {
                        const containerPlanType = planContainer.getAttribute('data-plan-type');
                        this.planType = containerPlanType;
                      
                    }
                }
            } else {
               
            }
        } catch (e) {
         
        }
    }

    captureDomainUrl() {
        
        
        // Method 1: Try to find the domain URL input field
        const domainInput = document.getElementById('domain-url');
        if (domainInput) {
            // Get the value, including default value
            const inputValue = domainInput.value || domainInput.defaultValue || '';
            
            
            if (inputValue.trim() !== '' && !inputValue.includes('example.com') && !inputValue.includes('your-domain.com')) {
                this.domainUrl = inputValue.trim();
        
            return;
            } else {
               
            }
        }
        
        // Method 2: Try alternative selectors
        const altDomainInput = document.querySelector('input[type="url"]') || document.querySelector('input[placeholder*="example.com"]');
        if (altDomainInput && altDomainInput.value && altDomainInput.value.trim() !== '') {
            this.domainUrl = altDomainInput.value.trim();
           
            return;
        }
        
        // Removed input scanning for security compliance
        
        // Method 4: Force focus and blur to trigger events
        if (domainInput) {
            domainInput.focus();
            domainInput.blur();
            if (domainInput.value && domainInput.value.trim() !== '') {
                this.domainUrl = domainInput.value.trim();
              
                return;
            }
        }
        
        // Method 5: Check if there's a value in the input that we missed
        if (domainInput && domainInput.getAttribute('value')) {
            this.domainUrl = domainInput.getAttribute('value');
        
            return;
        }
        
    }

    async processPayment() {
        // Add a small delay to ensure input fields are updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const submitButton = document.getElementById('subscribe-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }
        

        this.capturePlanType();

        // If plan type not captured, try again after a short delay
        if (!this.planType) {

            await new Promise(resolve => setTimeout(resolve, 500));
            this.capturePlanType();
          
        }
        
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
                   
                } else {
                   
                }
            } catch (e) {
                
            }
        }
        
        // Force capture email from any available source
        if (!this.email) {
          
            
            // Try to get email from session storage
            try {
                const userData = localStorage.getItem('accessbit-userinfo');
                
                if (userData) {
                    const parsed = JSON.parse(userData);
                   
                    if (parsed.email) {
                        this.email = parsed.email;
                        
                    } else {
                        
                        
                        // Try other possible session storage keys
                        const otherKeys = ['accessbit-userinfo', 'accessibility-userinfo', 'userinfo'];
                        for (const key of otherKeys) {
                            const otherData = localStorage.getItem(key);
                            if (otherData) {
                               
                                try {
                                    const otherParsed = JSON.parse(otherData);
                                    if (otherParsed.email) {
                                        this.email = otherParsed.email;
                                        
                                        break;
                                    }
                                } catch (e) {
                            
                                }
                            }
                        }
                    }
                } else {
                   
                }
            } catch (e) {
               
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
           
            // Try alternative selectors if the main one fails
            const altDomainInput = document.querySelector('input[type="url"]') || document.querySelector('input[placeholder*="example.com"]');
        
            
            // Get the current value from the input field - try multiple methods
            let currentDomainUrl = '';
            
            // Method 1: Direct value access
            if (domainInput) {
                currentDomainUrl = domainInput.value || '';
              
            }
            
            // Method 2: Alternative input
            if (!currentDomainUrl && altDomainInput) {
                currentDomainUrl = altDomainInput.value || '';
               
            }
            
            // Method 3: Force focus and blur to trigger events
            if (!currentDomainUrl && domainInput) {
                domainInput.focus();
                domainInput.blur();
                currentDomainUrl = domainInput.value || '';
                
            }
            
            // Removed input scanning for security compliance
            
            // Removed input scanning for security compliance
            
            // Removed input scanning for security compliance
            
            // Removed input scanning for security compliance
            
            // Removed input scanning for security compliance
            
            // Removed input scanning for security compliance
            
            const finalDomainUrl = currentDomainUrl || this.domainUrl || '';
            
           
            // Use the captured domain URL or fallback
            let domainToUse = this.domainUrl || finalDomainUrl;
            
            // If still no domain, try to get it from the input field directly
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                const domainInput = document.getElementById('domain-url');
                if (domainInput && domainInput.value && !domainInput.value.includes('example.com') && !domainInput.value.includes('your-domain.com')) {
                    domainToUse = domainInput.value.trim();
                    
                }
            }
            
            // If still no domain, try to get it from window location
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                try {
                    const currentUrl = window.location.href;
                    if (currentUrl && !currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
                        const url = new URL(currentUrl);
                        domainToUse = `${url.protocol}//${url.hostname}`;
                     
                    }
                } catch (e) {
                    
                }
            }
            
            // Final fallback
            if (!domainToUse || domainToUse.includes('example.com') || domainToUse.includes('your-domain.com')) {
                domainToUse = 'https://example.com';
                
            }
          
            // Enhanced email capture - try multiple methods
            let emailToUse = this.email || '';
            
            // Method 1: Check Link Authentication Element
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    const linkValue = this.linkAuthenticationElement.getValue();
                    if (linkValue && linkValue.email) {
                        emailToUse = linkValue.email;
                      
                    } else {
                       
                    }
                } catch (e) {
                  
                }
            }
            
            // Method 1.5: Force get email from Link Authentication Element
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    // Try to get the current value directly
                    const currentValue = this.linkAuthenticationElement.getValue();
                    if (currentValue && currentValue.email) {
                        emailToUse = currentValue.email;
                      
                    }
                } catch (e) {
               
                }
            }
            
            // Method 1.5: Try to get email from Link Authentication Element events
            if (!emailToUse && this.linkAuthenticationElement) {
                try {
                    // Force a change event to capture email
                    this.linkAuthenticationElement.on('change', (event) => {
                        if (event.value && event.value.email) {
                            emailToUse = event.value.email;
                           
                        }
                    });
                } catch (e) {
                   
                }
            }
            
            // Method 2: Check any email input field
            if (!emailToUse) {
                const emailInput = document.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    emailToUse = emailInput.value;
                  
                }
            }
            
            // Removed input scanning for security compliance
            
            // Method 4: Try to get email from stored user data
            if (!emailToUse) {
                try {
                    const storedData = localStorage.getItem('accessbit-userinfo');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        if (parsedData.email) {
                            emailToUse = parsedData.email;
                           
                        }
                    }
                } catch (e) {
               
                }
            }
            
            // Final fallback: use this.email if still empty
            if (!emailToUse || emailToUse.trim() === '') {
                emailToUse = this.email || '';
               
            }
            
         
            const subscriptionData = {
                siteId: this.siteId,
                productId: productId,
                domain: domainToUse,
                email: emailToUse,
                domainUrl: domainToUse
            };
           
            // Log domain URL status but don't block payment
            if (!finalDomainUrl || finalDomainUrl.trim() === '') {
         
            } else {

            }
            
          
            // Ensure we have a valid siteId
            if (!this.siteId || this.siteId === 'default-site-id') {
              
                
                // Try to get siteId from URL or other sources as last resort
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const siteIdFromUrl = urlParams.get('siteId');
                    if (siteIdFromUrl) {
                        
                        this.siteId = siteIdFromUrl;
                    }
                } catch (e) {
       
                }
                
                if (!this.siteId || this.siteId === 'default-site-id') {
                    throw new Error('No valid site ID found. Please refresh the page and try again.');
                }
            }
            
            // Ensure we have a valid email
            if (!this.email || this.email.trim() === '') {
               
                
                // Last resort: try to get email from the authentication data we know exists
                try {
                    const authData = localStorage.getItem('accessbit-userinfo');
                    if (authData) {
                        const parsed = JSON.parse(authData);
                        if (parsed.email) {
                            this.email = parsed.email;
                           
                        } else {
                            // Use a default email for testing
                            this.email = 'dev5@seattlenewmedia.com';
                            
                        }
                    } else {
                        // Use a default email for testing
                        this.email = 'dev5@seattlenewmedia.com';
                       
                    }
            } catch (e) {
                    // Use a default email for testing
                    this.email = 'dev5@seattlenewmedia.com';
                    
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
          
            // Log the exact JSON being sent
            const jsonBody = JSON.stringify(requestData);
           
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
                   
                    throw new Error(`Payment setup failed: ${setupResponse.status} ${setupResponse.statusText} - ${errorText}`);
                }
              
                throw new Error(`Payment setup failed: ${setupError.error || setupResponse.statusText}`);
            }
            
            const setupData = await setupResponse.json();
           
            // Store setup data
            this.setupIntentId = setupData.setupIntentId;
            this.customerId = setupData.customerId;
            this.clientSecret = setupData.clientSecret;
            
          
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
                },
                rules: {
                    '.Input': {
                        height: '40px',
                        padding: '10px 14px',
                        fontSize: '16px',
                        border: '1px solid #e6e6e6',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff00',
                        color: 'white',
                        boxShadow: '0px 1px 3px rgba(50, 50, 93, 0.07)',
                        transition: 'box-shadow 150ms ease, border-color 150ms ease',
                        boxSizing: 'border-box'
                    },
                    '.Input:focus': {
                        borderColor: '#0570de',
                        boxShadow: '0 0 0 1px #0570de'
                    },
                    '.Input--invalid': {
                        borderColor: '#df1b41'
                    },
                    '.Label': {
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '24px',
                        backgroundColor: 'transparent'
                    },
                    '.Input::placeholder': {
                        color: '#a3a3a3'
                    }
                }
            };
            
            // Create the Elements instance
            const clientSecret = this.clientSecret;
            if (!clientSecret) {
                throw new Error('Missing client secret. Please try again.');
            }
      
            this.elements = this.stripe.elements({ clientSecret, appearance });
            
            // Create and mount the Link Authentication Element for email collection
            this.linkAuthenticationElement = this.elements.create("linkAuthentication");
            this.linkAuthenticationElement.mount("#link-authentication-element");
            
            // Create and mount the Payment Element
            this.paymentElement = this.elements.create("payment");
            this.paymentElement.mount("#payment-element");
            
            // Add event listeners to capture data
            this.setupEventListeners();
            
            
            
        } catch (error) {
           
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
         
            return;
        }
        
        // Check cooldown period
        const now = Date.now();
        if (now - this.lastSubmissionTime < this.submissionCooldown) {
           
            this.showError('Please wait a moment before trying again.');
            return;
        }
        
        // Additional check: if clientSecret is already used, don't proceed
        if (!this.clientSecret || this.clientSecret.includes('used')) {
            
            return;
        }
        
        this.isConfirming = true;
        this.lastSubmissionTime = now;
        
        // Dispatch payment start event
        window.dispatchEvent(new CustomEvent('stripe-payment-start'));
        
        try {
          
            // Log domain URL status but don't block payment
            if (!this.domainUrl) {
                
            }
            
            // Check if this is a SetupIntent or PaymentIntent based on client secret format
            const isSetupIntent = this.clientSecret && this.clientSecret.includes('seti_');
        
            
            let result;
            if (isSetupIntent) {
        
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
                    
                    // Mark clientSecret as used to prevent retries
                    this.clientSecret = this.clientSecret + '_used';
                    this.showError('Setup confirmation failed. Please try again.');
                    return { error: err };
                });
            } else {
               
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
               
                // Mark clientSecret as used to prevent retries
                this.clientSecret = this.clientSecret + '_used';
                this.showError('Payment confirmation failed. Please try again.');
                return { error: err };
            });
            }
            
            const { error, paymentIntent, setupIntent } = result;

            if (!error) {
                

                const intentId = paymentIntent?.id || setupIntent?.id;
           
                
                // Step 2: Verify payment method was attached
                if (setupIntent && setupIntent.status === 'succeeded') {
         
                    
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
                    
                        
                        // Determine selected plan (annual/monthly) to set correct productId
                        let selectedProductId = 'prod_TEHrwLZdPcOsgq'; // annual default
                        try {
                            const paymentFormEl = document.getElementById('payment-form');
                            const planTypeAttr = paymentFormEl?.getAttribute('data-plan-type');
                            const isAnnualPlan = planTypeAttr === 'annual';
                            selectedProductId = isAnnualPlan ? 'prod_TEHrwLZdPcOsgq' : 'prod_TEH4ANvvsQysIO';

                        } catch (e) {
                           
                        }

                        // Get firstName from session storage
                        let firstName = '';
                        try {
                            const userData = localStorage.getItem('accessbit-userinfo') || 
                                           localStorage.getItem('accessbit-userinfo') || 
                                           localStorage.getItem('accessibility-userinfo');
                            if (userData) {
                                const parsed = JSON.parse(userData);
                                firstName = parsed.firstName || '';
                            
                            }
                        } catch (e) {
                          
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
                                firstName: firstName,
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
                       
                        // Store subscription ID
                        this.subscriptionId = subscriptionData.subscriptionId;
                        
                        // Handle subscription status
                        if (subscriptionData.status === 'active') {
                           
                            this.showSuccess('Subscription activated successfully!');
                            
                            // Dispatch success event to show success screen
                           
                            window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                                detail: {
                                    siteId: this.siteId,
                                    subscriptionId: this.subscriptionId,
                                    timestamp: new Date().toISOString(),
                                    subscriptionDetails: subscriptionData
                                }
                            }));
                        } else {
                            
                            // For incomplete subscriptions, wait for webhook or poll
                            if (subscriptionData.status === 'incomplete' && this.subscriptionId) {
                                
                            }
                            
                            // Poll for status changes if needed
                            if (this.subscriptionId) {
                                await this.pollSubscriptionStatus(this.subscriptionId);
                            }
                        }
                        
                    } catch (verifyError) {
                     
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
                     
                    } else {
                        
                    }
                } catch (updateError) {
              
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
                        
                        }
                    } catch (error) {
                     
                    }
                }
                
                // Use the captured plan type from payment processing
                let planType = this.planType;
                
                
                // Fallback: Try to get plan type from payment form if not captured
                if (!planType) {
                    try {
                        const paymentForm = document.getElementById('payment-form');
                        
                        if (paymentForm) {
                            planType = paymentForm.getAttribute('data-plan-type');
                          
                        } else {
                          
                            // Try alternative selectors
                            const altForm = document.querySelector('form[id*="payment"]') || document.querySelector('form[data-plan-type]');
                            if (altForm) {
                                planType = altForm.getAttribute('data-plan-type');
                              
                            }
                        }
                    } catch (e) {
                       
                    }
                }
                
                // Fallback: Try to determine plan type from subscription details
                if (!planType && subscriptionDetails && subscriptionDetails.metadata && subscriptionDetails.metadata.productId) {
                    const productId = subscriptionDetails.metadata.productId;
                    planType = productId === 'prod_TEHrwLZdPcOsgq' ? 'annual' : 'monthly';

                }
                
                // Final fallback: Try to get plan type from server using subscription ID
                if (!planType && this.subscriptionId) {
                    try {

                        const planResponse = await fetch(`${this.kvApiUrl}/api/accessibility/get-subscription-plan?id=${this.subscriptionId}`);
                        if (planResponse.ok) {
                            const planData = await planResponse.json();
                            if (planData.planType) {
                                planType = planData.planType;
                               
                            }
                        }
                    } catch (error) {
                     
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
                        subscriptionDetails: subscriptionDetails,
                        planType: planType // Include plan type in the event
                    }
                }));
                
                        // Only show success when backend confirms active
                        if (this.subscriptionId) {
                            await this.pollSubscriptionStatus(this.subscriptionId);
                        }
                
                // For SetupIntent, wait for webhook or poll
                if (isSetupIntent && setupIntent) {
                   
                    
                    // Poll subscription status to check for activation
                    if (this.subscriptionId) {
                        await this.pollSubscriptionStatus(this.subscriptionId);
                    }
                }
                
                // Also poll for PaymentIntent subscriptions to ensure activation
                if (!isSetupIntent && paymentIntent && this.subscriptionId) {
                    
                    await this.pollSubscriptionStatus(this.subscriptionId);
                }
            } else {
                
                
                // Handle specific SetupIntent errors
                if (error.code === 'setup_intent_unexpected_state') {
                    this.showError('Payment session expired. Please refresh the page and try again.');
                    // Mark clientSecret as used to prevent retries
                    this.clientSecret = this.clientSecret + '_used';
                } else if (error.code === 'rate_limit_exceeded') {
                    this.showError('Too many requests. Please wait a moment and try again.');
                } else {
                    this.showError(`Payment failed: ${error.message}`);
                }
            }
        } catch (error) {
          
            this.showError(`Payment confirmation error: ${error.message}`);
        } finally {
            this.isConfirming = false;
            // Dispatch payment end event
            window.dispatchEvent(new CustomEvent('stripe-payment-end'));
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
      
    }
    
    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }

       

        // Hide any error messages
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Poll subscription status until it becomes active
    async pollSubscriptionStatus(subscriptionId, maxAttempts = 10) {
       
        let attempts = 0;
        
        const checkStatus = async () => {
            try {
                const response = await fetch(`${this.kvApiUrl}/api/accessibility/check-subscription-status?id=${subscriptionId}`);
                
                if (!response.ok) {
                   
                    return false;
                }
                
                const data = await response.json();
             
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
                   
                    throw new Error(`Subscription is still ${data.status} after ${maxAttempts} attempts`);
                }
                
                attempts++;
                return false;
            } catch (error) {
               
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
     
        this.initializeStripeElements();
        // Immediately process payment to create Stripe Elements
        setTimeout(() => {
            this.processPayment();
        }, 100);
    }
}

function initializeExistingPaymentIntegration() {

    
    const integration = new ExistingPaymentIntegration();
    
    window.stripeIntegration = {
        handlePurchaseNow: integration.handlePurchaseNow.bind(integration)
    };
    
   
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExistingPaymentIntegration);
} else {
    initializeExistingPaymentIntegration();
}
