import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import Cart from './Cart';
import Checkout from './Checkout';

function App() {
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');

  return (
    <CartProvider>
      {currentStep === 'cart' ? (
        <Cart onContinueToCheckout={() => setCurrentStep('checkout')} />
      ) : (
        <Checkout onBack={() => setCurrentStep('cart')} />
      )}
    </CartProvider>
  );
}

export default App;
