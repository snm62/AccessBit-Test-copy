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
            const userData = sessionStorage.getItem('accessbit-userinfo') || sessionStorage.getItem('accessbit-userinfo');
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
            const userData = sessionStorage.getItem('accessbit-userinfo') || sessionStorage.getItem('accessbit-userinfo');
            if (userData) {
                const parsed = JSON.parse(userData);
                return parsed.siteId;
            }
        } catch (error) {
            console.warn('Could not get site ID:', error);
        }
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

    async processPayment() {
        const submitButton = document.getElementById('subscribe-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }
        
        console.log('Processing payment...');
        
        try {
            // Get the selected plan (annual or monthly)
            const isAnnual = document.querySelector('.payment-toggle .toggle-option.active')?.textContent === 'Annually';
            const productId = isAnnual ? 'prod_TEHrwLZdPcOsgq' : 'prod_TEH4ANvvsQysIO';
            
            // Create subscription with Stripe product
            console.log('Creating subscription with:', { siteId: this.siteId, productId });
            const subscriptionData = {
                siteId: this.siteId,
                productId: productId,
                domain: window.location.hostname || 'localhost',
                email: this.email || '',
                domainUrl: this.domainUrl || ''
            };
            console.log('Subscription data being sent:', JSON.stringify(subscriptionData, null, 2));
            
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/create-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscriptionData)
            });
            
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                console.error('Server response error:', response.status, response.statusText, text);
                throw new Error(`create-subscription failed: ${response.status} ${response.statusText} ${text}`);
            }
            
            let clientSecret;
            try {
                const data = await response.json();
                clientSecret = data.clientSecret || data.client_secret;
            } catch (e) {
                throw new Error(`Invalid JSON from create-subscription: ${e?.message}`);
            }
            
            if (!clientSecret || typeof clientSecret !== 'string') {
                throw new Error('No clientSecret returned from server. Ensure worker returns PaymentIntent client_secret.');
            }
            
            console.log('Subscription created, clientSecret present');
            this.clientSecret = clientSecret;
            
            // Clear placeholders and create actual Stripe Elements
            const paymentContainer = document.getElementById('payment-element');
            const linkContainer = document.getElementById('link-authentication-element');
            paymentContainer.innerHTML = '';
            if (linkContainer) linkContainer.innerHTML = '';
            
            // Stripe Appearance API - matching your app's design
            const appearance = {
                theme: 'flat',
                variables: { 
                    colorPrimaryText: '#262626',
                    colorPrimary: '#0066cc',
                    colorBackground: '#ffffff',
                    colorText: '#262626',
                    borderRadius: '8px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    spacingUnit: '4px',
                    fontSizeBase: '16px'
                }
            };
            
            // Create the Elements instance
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
        try {
            console.log('Confirming payment with email:', this.email, 'and domain:', this.domainUrl);
            
            // Validate required fields
            if (!this.domainUrl) {
                this.showError('Please enter your domain URL');
                return;
            }
            
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                redirect: 'if_required',
                confirmParams: {
                    receipt_email: this.email,
                    payment_method_data: {
                        billing_details: { email: this.email },
                        metadata: { domain_url: this.domainUrl }
                    }
                }
            });

            if (!error) {
                // Payment succeeded - trigger success event for in-app handling
                console.log('✅ Payment completed successfully');
                window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                    detail: {
                        siteId: this.siteId,
                        email: this.email,
                        domain: this.domainUrl,
                        timestamp: new Date().toISOString()
                    }
                }));
            } else {
                console.error('❌ Payment failed:', error);
                this.showError(`Payment failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            this.showError(`Payment confirmation error: ${error.message}`);
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