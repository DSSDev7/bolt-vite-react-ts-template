import { CartProvider } from './contexts/CartContext';
import CartCheckout from './CartCheckout';

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-[#e5e7eb]">
        <CartCheckout />
      </div>
    </CartProvider>
  );
}

export default App;
