import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import Cart from './components/Cart';
import Checkout from './components/Checkout';

function App() {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');

  return (
    <CartProvider>
      {step === 'cart' ? (
        <Cart onCheckout={() => setStep('checkout')} />
      ) : (
        <Checkout onBack={() => setStep('cart')} />
      )}
    </CartProvider>
  );
}

export default App;
