import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useCart } from './contexts/CartContext';
import { sdk } from './lib/medusa-sdk';

/**
 * Two-Step Cart Checkout Mobile Optimized - Checkout Page
 * A modern, mobile-optimized two-step e-commerce journey. The first step is the 'Shopping Cart' view, 
 * featuring a main content area for the order summary and a right sidebar for recommended products and a 
 * 'Continue to Checkout' CTA. The second step is the 'Checkout' view, which consolidates the order summary, 
 * recommended products, and payment form into a single, cohesive layout designed for clarity and quick completion.
 */

interface CheckoutProps {
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack }) => {
  const { cart, removeItem, refreshCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const total = cart?.total || 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;

    setIsProcessing(true);
    try {
      // Initialize payment session (creates payment collection automatically)
      await sdk.store.payment.initiatePaymentSession(cart.id, {
        provider_id: 'pp_system_default',
      });

      // Complete the cart
      const result = await sdk.store.cart.complete(cart.id);

      if (result.type === 'order' && result.order) {
        setOrderId(result.order.id);
        setOrderComplete(true);
        refreshCart(); // Clear cart and create new one
      } else if (result.type === 'cart' && result.error) {
        console.error('Order completion failed:', result.error);
        alert(`Failed to place order: ${result.error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (orderComplete) {
    return (
      <section className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Order Placed Successfully!</h1>
          <p className="text-[#6d737d] mb-4">
            Thank you for your order. Your order ID is: <span className="font-mono font-medium">{orderId}</span>
          </p>
          <p className="text-sm text-[#6d737d]">
            A confirmation email has been sent to {email}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="min-h-screen bg-white">
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-8">
            <button onClick={onBack} className="text-[#6d737d] hover:text-[#111827] pb-4">
              <X size={24} />
            </button>
            <div className="flex gap-6 text-sm">
              <button onClick={onBack} className="text-[#6d737d] pb-4">
                Shopping Cart
              </button>
              <button className="font-semibold text-[#111827] border-b-2 border-[#111827] pb-4">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 order-2 md:order-1">
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-bold text-[#111827]">Order Summary</h2>
              <p className="text-sm text-[#6d737d] mt-1">{cartItems.length} items</p>
            </div>

            <div className="space-y-4 mb-6 hidden md:block">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/150x150.png'}
                    alt={item.title || 'Product image'}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#111827] text-sm">{item.title || 'Product'}</h3>
                    <p className="text-xs text-[#6d737d]">{item.variant?.title || item.subtitle || 'Product variant'}</p>
                    <p className="text-xs text-[#6d737d] mt-1">Qty {item.quantity}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">${formatPrice(item.unit_price * item.quantity)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-[#6d737d] hover:text-[#111827]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 order-1 md:order-2">
            <div className="md:sticky md:top-4">
              <div className="space-y-3 pb-6 border-b border-[#e5e7eb]">
                <div className="flex justify-between text-[#111827]">
                  <span>Subtotal</span>
                  <span className="font-semibold">${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#111827]">
                  <span>Shipping</span>
                  <span className="font-semibold">{cart?.shipping_total ? `$${formatPrice(cart.shipping_total)}` : 'Calculated at checkout'}</span>
                </div>
                <div className="flex justify-between text-[#111827]">
                  <div className="flex items-center gap-1 group relative">
                    <span>Tax</span>
                    <span className="text-[#6d737d] text-sm cursor-help">ⓘ</span>
                    <div className="absolute left-0 top-6 hidden group-hover:block bg-[#111827] text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                      Tax calculated at checkout
                    </div>
                  </div>
                  <span className="font-semibold">${formatPrice(tax)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between text-[#111827] mb-6">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">${formatPrice(total)}</span>
              </div>

              <div className="mb-6 p-4 bg-[#e5e7eb] bg-opacity-30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#111827] font-bold">💳</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">Manual Payment</p>
                    <p className="text-xs text-[#6d737d]">No payment information required</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d]"
                  />
                </div>

                <div className="pt-4 space-y-2 md:block hidden">
                  <div className="flex justify-between text-[#111827]">
                    <span>Subtotal</span>
                    <span className="font-semibold">${formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#111827] pb-4 border-b border-[#e5e7eb]">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl">${formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full bg-[#6d737d] hover:bg-[#111827] text-white font-semibold py-4 px-6 rounded-lg hidden md:flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  <span>{isProcessing ? 'Processing...' : `Place Order $${formatPrice(total)}`}</span>
                </button>

                <div className="pt-4 hidden md:flex items-center justify-center gap-4 text-xs text-[#6d737d]">
                  <span>Terms</span>
                  <span>•</span>
                  <span>Privacy</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] p-3 z-10">
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[#111827] text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">${formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#111827]">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg">${formatPrice(total)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={isProcessing || cartItems.length === 0}
          onClick={handlePlaceOrder}
          className="w-full bg-[#6d737d] hover:bg-[#111827] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lock size={16} />
          <span>{isProcessing ? 'Processing...' : `Place Order $${formatPrice(total)}`}</span>
        </button>
      </div>
    </section>
  );
};

export default Checkout;
