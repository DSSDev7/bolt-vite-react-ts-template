import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Payment } from './components/Payment';

type CheckoutStep = 'cart' | 'information' | 'payment';

export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  suburb: string;
  country: string;
  state: string;
  postcode: string;
  phone: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    suburb: '',
    country: '',
    state: '',
    postcode: '',
    phone: '',
  });

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        {currentStep === 'cart' && (
          <Cart
            onNext={() => setCurrentStep('information')}
          />
        )}
        {currentStep === 'information' && (
          <Checkout
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            onBack={() => setCurrentStep('cart')}
            onNext={() => setCurrentStep('payment')}
          />
        )}
        {currentStep === 'payment' && (
          <Payment
            customerInfo={customerInfo}
            onBack={() => setCurrentStep('information')}
          />
        )}
      </div>
    </CartProvider>
  );
}

export default App;
