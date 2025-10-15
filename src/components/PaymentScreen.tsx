import React, { useState, useEffect } from 'react';
import '../styles/payment.css';

// TypeScript declarations for global Stripe functions
declare global {
  interface Window {
    initializeExistingPaymentIntegration: () => void;
    stripeIntegration: {
      handlePurchaseNow: () => void;
      reSetupEventListeners: () => void;
    };
  }
}
const whitearrow = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
  <path d="M0.756 8.59012V6.62812H10.314L5.598 2.30812L6.948 0.940125L13.356 6.97012V8.23012L6.948 14.2601L5.58 12.8741L10.278 8.59012H0.756Z" fill="white"/>
</svg>`);

interface PaymentScreenProps {
  onBack: () => void;
  onNext: () => void;
  customizationData: any;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onNext, customizationData }) => {
  console.log('🔥 PaymentScreen: Component rendered');
  console.log('🔥 PaymentScreen: Props received:', { onBack, onNext, customizationData });
  
  const [isAnnual, setIsAnnual] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionValidUntil, setSubscriptionValidUntil] = useState<string | null>(null);

  // Check for payment success from URL parameters (for redirect methods)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    
    if (paymentIntent && paymentIntentClientSecret) {
      console.log('🔥 PaymentScreen: Detected payment redirect, checking status');
      // If we have payment intent parameters, it means user was redirected back
      // We should show success screen since the webhook will handle the final status
      setPaymentSuccess(true);
    }
  }, []);

  // Initialize Stripe integration when component mounts
  useEffect(() => {
    console.log('🔥 PaymentScreen: useEffect running, checking for Stripe integration');
    console.log('🔥 PaymentScreen: window object:', typeof window);
    console.log('🔥 PaymentScreen: window.initializeExistingPaymentIntegration:', typeof window.initializeExistingPaymentIntegration);
    
    // Populate domain field with actual site URL
    const populateDomainField = async () => {
      try {
        if (typeof window !== 'undefined' && window.webflow && window.webflow.getSiteInfo) {
          const siteInfo = await window.webflow.getSiteInfo();
          console.log('🔥 PaymentScreen: Site info:', siteInfo);
          
          if (siteInfo.url) {
            const domainInput = document.getElementById('domain-url') as HTMLInputElement;
            if (domainInput) {
              domainInput.value = siteInfo.url;
              console.log('🔥 PaymentScreen: Domain field populated with:', siteInfo.url);
            }
          }
        }
      } catch (error) {
        console.log('🔥 PaymentScreen: Could not get site info:', error);
      }
    };
    
    // Populate domain field after a short delay to ensure DOM is ready
    setTimeout(populateDomainField, 500);
    
    // Add event listeners for domain field to handle paste and input events
    const setupDomainFieldListeners = () => {
      const domainInput = document.getElementById('domain-url') as HTMLInputElement;
      if (domainInput) {
        // Handle paste events
        domainInput.addEventListener('paste', (e) => {
          setTimeout(() => {
            const value = domainInput.value;
            console.log('🔥 Domain field paste detected:', value);
            if (value && !value.includes('example.com')) {
              console.log('🔥 Valid domain pasted:', value);
            }
          }, 100);
        });
        
        // Handle input events
        domainInput.addEventListener('input', (e) => {
          const value = (e.target as HTMLInputElement).value;
          console.log('🔥 Domain field input detected:', value);
          if (value && !value.includes('example.com')) {
            console.log('🔥 Valid domain typed:', value);
          }
        });
        
        // Handle change events
        domainInput.addEventListener('change', (e) => {
          const value = (e.target as HTMLInputElement).value;
          console.log('🔥 Domain field change detected:', value);
        });
      }
    };
    
    // Set up domain field listeners after a delay
    setTimeout(setupDomainFieldListeners, 1000);
    
    // Wait a bit for scripts to load
    const timer = setTimeout(() => {
      console.log('🔥 PaymentScreen: Timeout reached, checking Stripe integration');
      if (typeof window !== 'undefined' && window.initializeExistingPaymentIntegration) {
        console.log('🔥 PaymentScreen: Stripe integration function found, calling it');
        window.initializeExistingPaymentIntegration();
      } else {
        console.log('🔥 PaymentScreen: Stripe integration function not found after timeout');
        console.log('🔥 PaymentScreen: Available window properties:', Object.keys(window).filter(key => key.includes('stripe') || key.includes('payment')));
      }
    }, 1000);
    
    return () => {
      console.log('🔥 PaymentScreen: useEffect cleanup');
      clearTimeout(timer);
    };
  }, []);

  // Check for existing subscription status on component mount
  useEffect(() => {
    const checkExistingSubscription = async () => {
      try {
        const siteId = sessionStorage.getItem('contrastkit') || 
                      sessionStorage.getItem('webflow_site_id') || 
                      sessionStorage.getItem('siteId');
        
        if (!siteId) return;

        // Check if we have stored subscription data
        const storedSubscription = localStorage.getItem(`subscription_${siteId}`);
        if (storedSubscription) {
          const subscriptionData = JSON.parse(storedSubscription);
          const now = new Date().getTime();
          const validUntil = subscriptionData.validUntil;
          
          if (validUntil && now < validUntil) {
            // Subscription is still valid
            console.log('🔥 PaymentScreen: Found valid subscription, showing success screen');
            setPaymentSuccess(true);
            setSubscriptionValidUntil(new Date(validUntil).toLocaleDateString());
            return;
          } else {
            // Subscription expired, clear stored data
            localStorage.removeItem(`subscription_${siteId}`);
          }
        }

        // Check subscription status from server
        const response = await fetch(`https://accessibility-widget.web-8fb.workers.dev/api/accessibility/check-subscription-status?siteId=${siteId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'active' && data.current_period_end) {
            const endDate = new Date(data.current_period_end * 1000);
            const now = new Date().getTime();
            
            if (now < endDate.getTime()) {
              // Subscription is active and valid
              console.log('🔥 PaymentScreen: Active subscription found, showing success screen');
              setPaymentSuccess(true);
              setSubscriptionValidUntil(endDate.toLocaleDateString());
              
              // Store subscription data for persistence
              localStorage.setItem(`subscription_${siteId}`, JSON.stringify({
                status: data.status,
                validUntil: endDate.getTime(),
                subscriptionId: data.subscriptionId
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to check existing subscription:', error);
      }
    };

    checkExistingSubscription();
  }, []);

  // Listen for payment success events
  useEffect(() => {
    const handlePaymentSuccess = (event: CustomEvent) => {
      console.log('🔥 PaymentScreen: Payment success event received:', event.detail);
      console.log('🔥 PaymentScreen: Setting paymentSuccess to true');
      setPaymentSuccess(true);
      setShowStripeForm(false);
      
      // Set subscription validity if provided
      if (event.detail.subscriptionDetails?.current_period_end) {
        const endDate = new Date(event.detail.subscriptionDetails.current_period_end * 1000);
        setSubscriptionValidUntil(endDate.toLocaleDateString());
        console.log('🔥 PaymentScreen: Set subscription valid until:', endDate.toLocaleDateString());
        
        // Store subscription data for persistence
        const siteId = sessionStorage.getItem('contrastkit') || 
                      sessionStorage.getItem('webflow_site_id') || 
                      sessionStorage.getItem('siteId');
        if (siteId) {
          localStorage.setItem(`subscription_${siteId}`, JSON.stringify({
            status: event.detail.subscriptionDetails.status,
            validUntil: endDate.getTime(),
            subscriptionId: event.detail.subscriptionId
          }));
        }
      }
    };

    console.log('🔥 PaymentScreen: Adding stripe-payment-success event listener');
    window.addEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
    
    return () => {
      console.log('🔥 PaymentScreen: Removing stripe-payment-success event listener');
      window.removeEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
    };
  }, []);

  // Periodic check for subscription validity
  useEffect(() => {
    if (paymentSuccess) {
      const checkValidity = () => {
        const siteId = sessionStorage.getItem('contrastkit') || 
                      sessionStorage.getItem('webflow_site_id') || 
                      sessionStorage.getItem('siteId');
        
        if (!siteId) return;

        const storedSubscription = localStorage.getItem(`subscription_${siteId}`);
        if (storedSubscription) {
          const subscriptionData = JSON.parse(storedSubscription);
          const now = new Date().getTime();
          const validUntil = subscriptionData.validUntil;
          
          if (validUntil && now >= validUntil) {
            // Subscription expired
            console.log('🔥 PaymentScreen: Subscription expired, hiding success screen');
            setPaymentSuccess(false);
            setSubscriptionValidUntil(null);
            localStorage.removeItem(`subscription_${siteId}`);
          }
        }
      };

      // Check immediately
      checkValidity();
      
      // Check every minute
      const interval = setInterval(checkValidity, 60000);
      
      return () => clearInterval(interval);
    }
  }, [paymentSuccess]);

  const handlePurchaseNow = () => {
    console.log('🔥 Purchase Now clicked - showing Stripe form');
    console.log('🔥 PaymentScreen: showStripeForm state:', showStripeForm);
    setShowStripeForm(true);
  };

  // After the Stripe form is shown, wait for DOM to paint, then initialize
  useEffect(() => {
    if (!showStripeForm) return;
    if (typeof window === 'undefined') return;
    // Lock background scroll while full-screen Stripe is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // wait until the #payment-element exists in DOM
    requestAnimationFrame(() => {
      const target = document.querySelector('#payment-element');
      if (target && window.stripeIntegration) {
        console.log('PaymentScreen: Mounting Stripe on #payment-element');
        window.stripeIntegration.handlePurchaseNow();
        // Re-setup event listeners now that the form is rendered
        setTimeout(() => {
          if (window.stripeIntegration && window.stripeIntegration.reSetupEventListeners) {
            window.stripeIntegration.reSetupEventListeners();
          }
        }, 100);
      } else {
        console.log('PaymentScreen: payment-element not ready or integration missing');
        // try again shortly if needed
        setTimeout(() => {
          const t2 = document.querySelector('#payment-element');
          if (t2 && window.stripeIntegration) {
            console.log('PaymentScreen: Retrying Stripe mount');
            window.stripeIntegration.handlePurchaseNow();
            // Re-setup event listeners after retry
            setTimeout(() => {
              if (window.stripeIntegration && window.stripeIntegration.reSetupEventListeners) {
                window.stripeIntegration.reSetupEventListeners();
              }
            }, 100);
          }
        }, 100);
      }
    });
    return () => {
      // restore scroll when effect cleans up
      document.body.style.overflow = prevOverflow;
    };
  }, [showStripeForm]);

  // Cleanup when exiting Stripe mode: unmount Stripe element
  useEffect(() => {
    if (!showStripeForm && typeof window !== 'undefined' && window.stripeIntegration) {
      try {
        if (typeof (window as any).stripeIntegration.unmount === 'function') {
          (window as any).stripeIntegration.unmount();
        }
      } catch (e) {
        console.warn('Stripe cleanup warning:', e);
      }
    }
  }, [showStripeForm]);

  // Listen for custom success/error events from integration to show in-app UI
  useEffect(() => {
    function onSuccess(e: any) {
      // Replace with your in-app toast/notification; for now, minimal banner
      const msg = e?.detail?.message || 'Payment successful';
      console.log(':white_tick: Stripe success:', msg);
      // Close Stripe view and show success screen
      setShowStripeForm(false);
      setPaymentSuccess(true);
    }
    function onError(e: any) {
      const msg = e?.detail?.message || 'Payment failed';
      console.error(':x: Stripe error:', msg);
      // You can surface a toast here; keeping console for brevity
    }
    window.addEventListener('stripe-payment-success', onSuccess as EventListener);
    window.addEventListener('stripe-payment-error', onError as EventListener);
    return () => {
      window.removeEventListener('stripe-payment-success', onSuccess as EventListener);
      window.removeEventListener('stripe-payment-error', onError as EventListener);
    };
  }, []);

  const handlePayment = async () => {
    // When Stripe form is visible, submit should be handled by Stripe
    if (showStripeForm) {
      const form = document.getElementById('payment-form');
      if (form) {
        form.dispatchEvent(new Event('submit'));
        return;
      }
    }
    // Fallback: original next action (kept if no Stripe shown)
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onNext();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    console.log('Payment: Going back to customization');
    onBack();
  };

  const handleSuccessNext = () => {
    console.log('Payment: Moving to next step after success');
    onNext();
  };

  const handleRetryPayment = () => {
    console.log('Payment: Retrying payment');
    setPaymentSuccess(false);
    setShowStripeForm(false);
  };

  const handleEditDomain = () => {
    console.log('Payment: Editing domain URL');
    setPaymentSuccess(false);
    setShowStripeForm(false);
  };

  const handleCancelSubscription = async () => {
    console.log('Payment: Canceling subscription');
    if (confirm('Are you sure you want to cancel your subscription? Your access will continue until the end of your current billing period.')) {
      try {
        // Get siteId from session storage
        const siteId = sessionStorage.getItem('contrastkit') || 
                      sessionStorage.getItem('webflow_site_id') || 
                      sessionStorage.getItem('siteId');
        
        if (!siteId) {
          alert('Unable to find site ID. Please refresh and try again.');
          return;
        }

        // First get the subscription ID
        const statusResponse = await fetch(`https://accessibility-widget.web-8fb.workers.dev/api/accessibility/check-subscription-status?siteId=${siteId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to get subscription details');
        }
        
        const statusData = await statusResponse.json();
        if (!statusData.id) {
          throw new Error('No active subscription found');
        }

        const response = await fetch('https://accessibility-widget.web-8fb.workers.dev/api/accessibility/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            siteId,
            subscriptionId: statusData.id 
          })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Subscription canceled successfully. Your access will continue until ${new Date(result.currentPeriodEnd * 1000).toLocaleDateString()}.`);
          setPaymentSuccess(false);
          setShowStripeForm(false);
          
          // Clear stored subscription data
          localStorage.removeItem(`subscription_${siteId}`);
        } else {
          const error = await response.json();
          alert(`Failed to cancel subscription: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Cancel subscription error:', error);
        alert('Failed to cancel subscription. Please try again.');
      }
    }
  };

  // When Stripe form is showing, render a full-screen scrollable view
  if (showStripeForm) {
    return (
      <div
        className="payment-screen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--ck-bg, #0b0f1a)'
        }}
      >
        <div className="payment-header">
          <div className="app-name"></div>
          <div className="header-buttons">
            <button className="back-btn" onClick={() => setShowStripeForm(false)} disabled={isProcessing}>
              <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Back to Pricing
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Complete Your Payment</h2>
          <div style={{ marginBottom: 12, color: '#a3a3a3' }}>
            {isAnnual ? 'Annual Plan' : 'Monthly Plan'} - ${isAnnual ? '19' : '24'}/{isAnnual ? 'year' : 'month'}
          </div>
          
          <form id="payment-form" data-plan-type={isAnnual ? 'annual' : 'monthly'}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 16px 0',
              color: '#ffffff'
            }}>
              Contact Information
            </h3>
            
            <div id="link-authentication-element" style={{ marginBottom: '20px' }}>
              {/* Link Authentication Element will mount here */}
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="domain-url" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#ffffff' 
              }}>
                Your Domain URL
              </label>
              <input 
                id="domain-url" 
                type="url" 
                placeholder="https://your-domain.com" 
                required 
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '16px',
                  border: '1px solid #e6e6e6',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#333333',
                  boxShadow: '0px 1px 3px rgba(50, 50, 93, 0.07)',
                  transition: 'box-shadow 150ms ease, border-color 150ms ease'
                }}
              />
            </div>
            
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 16px 0',
              color: '#ffffff'
            }}>
              Payment
            </h3>
            
            <div id="payment-element" style={{ marginBottom: '20px' }}>
              {/* Payment Element will mount here */}
            </div>
            
            <div id="error-message" style={{ 
              color: '#fa755a', 
              fontSize: '14px', 
              marginBottom: '16px',
              minHeight: '20px'
            }}></div>
            
            <div id="success-message" style={{ 
              color: '#4caf50', 
              fontSize: '14px', 
              marginBottom: '16px',
              minHeight: '20px'
            }}></div>
            
            <button id="subscribe-btn" className="subscribe-button" type="submit">
              Subscribe
            </button>
          </form>
          
          <div className="legal-text" style={{ marginTop: 12 }}>
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('🔥 PaymentScreen: Current state - paymentSuccess:', paymentSuccess, 'showStripeForm:', showStripeForm);

  // Success screen - shows after successful payment
  if (paymentSuccess) {
    return (
      <div className="payment-screen">
        {/* Header */}
        <div className="payment-header">
          <div className="app-name"></div>
          <div className="header-buttons">
            <button className="back-btn" onClick={handleRetryPayment}>
              <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Try Again
            </button>
            <button className="next-btn" onClick={handleSuccessNext}>
              Continue <img src={whitearrow} alt="" />
            </button>
          </div>
        </div>

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
          <div className="step">
            <span className="step-number">STEP 3</span>
            <span className="step-name">Publish</span>
          </div>
        </div>

        {/* Success Content */}
        <div className="main-content" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          overflow: 'auto',
          padding: '20px 24px'
        }}>
          <div className="payment-card" style={{ 
            textAlign: 'center', 
            padding: '32px 24px',
            maxWidth: '500px',
            margin: '0 auto',
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              ✓
            </div>
            
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              margin: '0 0 12px 0',
              color: '#10b981'
            }}>
              Payment Successful!
            </h2>
            
            <p style={{ 
              fontSize: '14px', 
              color: '#a3a3a3', 
              margin: '0 0 20px 0',
              lineHeight: '1.4'
            }}>
              Your subscription is now active. You can now proceed to publish your accessibility widget.
            </p>
            
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              margin: '20px 0',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '6px' }}>
                Subscription Details
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                {isAnnual ? 'Annual Plan' : 'Monthly Plan'} - ${isAnnual ? '19' : '24'}/{isAnnual ? 'year' : 'month'}
              </div>
              <div style={{ fontSize: '12px', color: '#a3a3a3' }}>
                Valid until: {subscriptionValidUntil || 'Loading...'}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center',
              marginTop: '24px',
              flexWrap: 'wrap'
            }}>
              <button 
                className="back-btn" 
                onClick={handleEditDomain}
                style={{ 
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #333',
                  color: '#a3a3a3',
                  fontSize: '14px',
                  borderRadius: '6px'
                }}
              >
                Edit Domain URL
              </button>
              <button 
                className="next-btn" 
                onClick={handleCancelSubscription}
                style={{ 
                  padding: '10px 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  minWidth: '140px',
                  backgroundColor: '#dc2626',
                  border: '1px solid #dc2626'
                }}
              >
                Cancel Subscription <img src={whitearrow} alt="" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-screen">
      {/* Header */}
      <div className="payment-header">
        <div className="app-name"></div>
        <div className="header-buttons">
         <button className="back-btn" onClick={handleBack} disabled={isProcessing}>
            <img src={whitearrow} alt="" style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
                <button className="next-btn" onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Next'} <img src={whitearrow} alt="" />
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
          <span className="step-name">Payment</span>
        </div>
        <div className="step">
          <span className="step-number">STEP 3</span>
          <span className="step-name">Publish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="payment-card">
          <div className="pricing-flex">
            {/* Left side - Main pricing */}
            <div className="pricing-left">
              <div className="main-price">
                <div className="price-number">${isAnnual ? '19' : '24'}</div>
                <div className="price-period">/{isAnnual ? 'Paid Annually' : 'Paid Monthly'}</div>
              </div>
              
              <div className={`payment-toggle ${isAnnual ? 'annually' : 'monthly'}`}>
                <button 
                  className={`toggle-option ${!isAnnual ? 'active' : ''}`}
                  onClick={() => setIsAnnual(false)}
                >
                  Monthly
                </button>
                <button 
                  className={`toggle-option ${isAnnual ? 'active' : ''}`}
                  onClick={() => setIsAnnual(true)}
                >
                  Annually
                </button>
              </div>
              
              <div className="savings-info" style={{ opacity: isAnnual ? 1 : 0, visibility: isAnnual ? 'visible' : 'hidden' }}>
                You Save 20%
              </div>
            </div>

            {/* Right side - Secondary pricing and button */}
            <div className="pricing-right">
              <div className="secondary-price">
                ${isAnnual ? '19' : '24'}/Paid {isAnnual ? 'Annually' : 'Monthly'}
              </div>
              
              <button 
                className="purchase-btn" 
                onClick={handlePurchaseNow}
                disabled={isProcessing}
              >
                Purchase Now <img style={{width: "11px"}} src={whitearrow} alt="" />
              </button>
            </div>
          </div>
        </div>

        {/* Stripe replaced full-screen above; nothing inline here */}
      </div>
    </div>
  );
};

export default PaymentScreen;
