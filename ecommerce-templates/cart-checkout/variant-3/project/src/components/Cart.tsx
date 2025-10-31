import { useState } from 'react';
import { Minus, Plus, Trash2, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

/**
 * Two Step Cart Checkout - Cart Page
 * A two-column e-commerce cart page. The left column is a detailed list of cart items
 * with quantity controls and a remove option. The right column is a persistent,
 * sticky summary block featuring recommended products for cross-selling, a subtotal/discount/total
 * calculation, a primary CTA to 'Proceed to Checkout', and collapsible accordions for
 * payment and shipping information.
 */

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { cart, updateQuantity, removeItem, loading } = useCart();
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [shippingInfoOpen, setShippingInfoOpen] = useState(false);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const formatPrice = (amount: number = 0) => {
    return (amount / 100).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const total = cart?.total || 0;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#111827] flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="min-h-screen bg-[#e5e7eb] text-[#111827]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <button className="flex items-center gap-2 text-[#111827] mb-8 hover:opacity-70 transition-opacity">
          <ChevronLeft size={20} />
          <span>Back to Store</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6">
            {cartItems.map((item: any) => {
              return (
                <div key={item.id} className="border-b border-[#6d737d] pb-6">
                  <div className="flex gap-4">
                    <img
                      src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                      alt={item.title || 'Product'}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover bg-[#e5e7eb]"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.title || 'Product'}</h3>
                          <p className="text-sm text-[#6d737d]">
                            ${formatPrice(item.unit_price)}
                          </p>
                          {item.variant?.title && (
                            <p className="text-sm text-[#6d737d]">{item.variant.title}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            ${formatPrice(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 transition-colors"
                            disabled={loading}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 transition-colors"
                            disabled={loading}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 hover:bg-[#6d737d] transition-colors rounded"
                          disabled={loading}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {cartItems.length === 0 && (
              <p className="text-center text-[#6d737d] py-12">Your cart is empty</p>
            )}
          </div>

          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:self-start">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-[#6d737d] pt-3">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              disabled={cartItems.length === 0 || loading}
              className="w-full bg-[#6d737d] text-white py-3 font-semibold hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>

            <div className="text-center mt-3">
              <button className="text-[#111827] underline hover:opacity-70 transition-opacity">
                Continue Shopping
              </button>
            </div>

            <p className="text-xs text-[#6d737d] mt-4">
              Taxes included. Shipping calculated at checkout.
            </p>
            <p className="text-xs text-[#6d737d] mt-2">
              Additional fees may apply based on location.
            </p>

            <div className="mt-3 bg-[#fcfdff] rounded-lg px-3">
              <button
                onClick={() => setPaymentInfoOpen(!paymentInfoOpen)}
                className="w-full flex justify-between items-center py-3 hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold">Payment Information</span>
                {paymentInfoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {paymentInfoOpen && (
                <div className="mt-3 pb-3 text-sm text-[#6d737d] space-y-2">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. </p>
                </div>
              )}
            </div>

            <div className="mt-3 bg-[#fcfdff] rounded-lg px-3">
              <button
                onClick={() => setShippingInfoOpen(!shippingInfoOpen)}
                className="w-full flex justify-between items-center py-3 hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold">Shipping Information</span>
                {shippingInfoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {shippingInfoOpen && (
                <div className="mt-3 pb-3 text-sm text-[#6d737d] space-y-2">
                  <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Trust Guarantee Bullet Point</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Policy Bullet Point</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
