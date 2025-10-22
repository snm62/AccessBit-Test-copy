// Stripe Payment Handler for Accessibility Widget
class StripePaymentHandler {
    constructor() {
        this.stripe = Stripe('pk_test_51SHC1FRh1lS9W4XKi6p64DmTTaIZLId6MfA5eFG6UsSsd84VFeJamSJBduMhubQ9TfavO5D8AtGfnUI4xwc3cNpQ00DudeK7OM');
        this.elements = null;
        this.paymentElement = null;
        this.kvApiUrl = 'https://accessibility-widget.web-8fb.workers.dev';
        this.siteId = this.getSiteId();
    }
    
    getSiteId() {
        const sessionData = sessionStorage.getItem('wf_hybrid_user');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                return parsed.siteInfo?.siteId;
            } catch (e) {}
        }
        return null;
    }
    
    async initializeStripeElements() {
        try {
            console.log('Initializing Stripe Elements...');
            
            // Create payment intent
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: this.siteId,
                    amount: 1999, // $19.99 in cents
                    currency: 'usd'
                })
            });
            
            const { clientSecret } = await response.json();
            console.log('Payment intent created:', clientSecret);
            
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
            
            // Stripe Elements Options
            const options = {
                business: { 
                    name: "ConsentBit" 
                },
                layout: {
                    type: 'tabs',
                    defaultCollapsed: false
                },
                fields: {
                    billingDetails: 'auto'
                }
            };
            
            // Create Elements
            this.elements = this.stripe.elements({ 
                clientSecret, 
                appearance 
            });
            
            // Create Payment Element
            this.paymentElement = this.elements.create('payment', options);
            
            // Mount Payment Element in existing container
            this.paymentElement.mount('#stripe-payment-element');
            
            console.log('Stripe Elements mounted successfully');
            
        } catch (error) {
            console.error('Error initializing Stripe elements:', error);
            this.showError('Failed to initialize payment form');
        }
    }
    
    async processPayment() {
        const submitButton = document.getElementById('subscribe-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }
        
        try {
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: 'if_required'
            });
            
            if (error) {
                this.showError(error.message);
            } else {
                await this.handleSuccessfulPayment();
            }
            
        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError('Payment failed. Please try again.');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Subscribe';
            }
        }
    }
    
    async handleSuccessfulPayment() {
        try {
            const response = await fetch(`${this.kvApiUrl}/api/accessibility/update-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: this.siteId,
                    paymentStatus: 'active',
                    lastPaymentDate: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showSuccess('Payment successful! Your accessibility widget is now active.');
            } else {
                this.showError('Payment succeeded but failed to update status. Please contact support.');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            this.showError('Payment succeeded but failed to update status. Please contact support.');
        }
    }
    
    showError(message) {
        alert(message);
    }
    
    showSuccess(message) {
        alert(message);
    }
}

// Global function to initialize Stripe Elements
function initializeStripePayment() {
    console.log('initializeStripePayment called');
    const stripeHandler = new StripePaymentHandler();
    stripeHandler.initializeStripeElements();
    
    // Add payment form submission handler
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await stripeHandler.processPayment();
        });
    }
}

// Make it available globally
window.initializeStripePayment = initializeStripePayment;
