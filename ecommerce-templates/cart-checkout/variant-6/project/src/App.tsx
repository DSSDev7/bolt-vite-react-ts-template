import { CartProvider } from './contexts/CartContext';
import CartCheckout from './components/CartCheckout';

function App() {
  return (
    <CartProvider>
      <CartCheckout />
    </CartProvider>
  );
}

export default App;
