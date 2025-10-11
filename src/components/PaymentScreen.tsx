import React, { useState } from 'react';
import '../styles/payment.css';

interface PaymentScreenProps {
  onBack: () => void;
  onNext: () => void;
  customizationData: any;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onNext, customizationData }) => {
  console.log('PaymentScreen: Component rendered');
  console.log('PaymentScreen: Props received:', { onBack, onNext, customizationData });
  
  const [isAnnual, setIsAnnual] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Payment processed successfully');
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

  return (
    <div className="payment-screen">
      {/* Header */}
      <div className="payment-header">
        <div className="app-name">AppName</div>
        <div className="header-buttons">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <button className="next-btn" onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Next →'}
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
                <div className="price-number">${isAnnual ? '72' : '6'}</div>
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
              
              {isAnnual && (
                <div className="savings-info">
                  You Save 20%
                </div>
              )}
            </div>

            {/* Right side - Secondary pricing and button */}
            <div className="pricing-right">
              <div className="secondary-price">
                ${isAnnual ? '72' : '6'}/Paid {isAnnual ? 'Annually' : 'Monthly'}
              </div>
              
              <button 
                className="purchase-btn" 
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Purchase Now →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
