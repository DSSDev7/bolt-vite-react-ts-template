import { useCart } from '../contexts/CartContext';
import { CheckoutHeader } from './CheckoutHeader';
import { CheckoutNavigation } from './CheckoutNavigation';

/**
 * Cart Page
 * A two-column e-commerce cart page. The left column lists the products in the cart with quantity controls and a 'remove' option, with a primary CTA to 'Continue To Checkout'. The right column is a persistent order summary block with a subtotal and the final total.
 */

interface CartProps {
  onNext: () => void;
}

export function Cart({ onNext }: CartProps) {
  const { cart, updateQuantity, removeItem, loading } = useCart();

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const shipping = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-[#6d737d]">Loading cart...</div>
        </div>
      </section>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-[#111827] mb-2">Your cart is empty</div>
          <div className="text-sm text-[#6d737d]">Add products to your cart to continue</div>
        </div>
      </section>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
            <CheckoutHeader currentStep="cart" />

            <div className="space-y-4 sm:space-y-6">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[#e5e7eb]">
                  <img
                    src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                    alt={item.title || 'Product image'}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded border border-[#e5e7eb]"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-[#111827] mb-1">{item.title || 'Product'}</h4>
                    <p className="text-xs sm:text-sm text-[#6d737d] mb-2">{item.variant?.title || item.subtitle || 'Product variant'}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#e5e7eb] rounded">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="px-2 sm:px-3 py-1 hover:bg-[#e5e7eb] transition-colors text-[#111827]"
                          disabled={loading}
                        >
                          -
                        </button>
                        <span className="px-2 sm:px-3 py-1 text-sm border-x border-[#e5e7eb]">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="px-2 sm:px-3 py-1 hover:bg-[#e5e7eb] transition-colors text-[#111827]"
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-xs sm:text-sm text-[#6d737d] hover:text-[#111827] underline"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-sm sm:text-base font-medium text-[#111827]">${formatPrice(item.unit_price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="md:hidden space-y-4 sm:space-y-6 border-t border-[#e5e7eb] pt-4">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#6d737d]">Subtotal</span>
                  <span className="text-[#111827]">${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#6d737d]">Shipping</span>
                  <span className="text-[#6d737d] text-xs">
                    {shipping > 0 ? `$${formatPrice(shipping)}` : 'Calculated at next step'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start pt-3 sm:pt-4 border-t border-[#e5e7eb]">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm sm:text-base text-[#111827] font-medium mb-0.5">Total</div>
                  <div className="text-xs text-[#6d737d]">Including ${formatPrice(tax)} in taxes</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6d737d] mb-1">{currencyCode}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#111827] whitespace-nowrap">${formatPrice(total)}</div>
                </div>
              </div>
            </div>
          </div>

          <CheckoutNavigation
            backText="Continue shopping"
            nextText="Continue To Checkout"
            onNext={onNext}
            onBack={() => {}}
          />
        </div>

        <div className="hidden md:flex md:flex-col md:border-l md:border-[#e5e7eb] md:pl-6 xl:pl-8 md:order-last overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pt-6 pr-2">
            <h2 className="text-base sm:text-lg font-medium text-[#111827]">Order Summary</h2>

            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-[#e5e7eb]">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-[#6d737d]">Subtotal</span>
                <span className="text-[#111827]">${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-[#6d737d]">Shipping</span>
                <span className="text-[#6d737d] text-xs">
                  {shipping > 0 ? `$${formatPrice(shipping)}` : 'Calculated at next step'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-start pt-3 sm:pt-4 border-t border-[#e5e7eb]">
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-sm sm:text-base text-[#111827] font-medium mb-0.5">Total</div>
                <div className="text-xs text-[#6d737d]">Including ${formatPrice(tax)} in taxes</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#6d737d] mb-1">{currencyCode}</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#111827] whitespace-nowrap">${formatPrice(total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
