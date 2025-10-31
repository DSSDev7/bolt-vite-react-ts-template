import { CartProvider } from './contexts/CartContext';
import CartCheckout from './CartCheckout';

function App() {
  return (
    <CartProvider>
      <CartCheckout />
    </CartProvider>
  );
}

export default App;
