import React from 'react';
import { X } from 'lucide-react';
import { useCart } from './contexts/CartContext';

/**
 * Two-Step Cart Checkout Mobile Optimized - Cart Page
 * A modern, mobile-optimized two-step e-commerce journey. The first step is the 'Shopping Cart' view, 
 * featuring a main content area for the order summary and a right sidebar for recommended products and a 
 * 'Continue to Checkout' CTA. The second step is the 'Checkout' view, which consolidates the order summary, 
 * recommended products, and payment form into a single, cohesive layout designed for clarity and quick completion.
 */


interface CartProps {
  onContinueToCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ onContinueToCheckout }) => {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
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

  if (loading) {
    return (
      <section data-section-type="Cart Checkout" className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#6d737d]">Loading...</p>
      </section>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const total = cart?.total || 0;

  return (
    <section data-section-type="Cart Checkout" className="min-h-screen bg-white">
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-8">
            <button className="text-[#6d737d] hover:text-[#111827] pb-4">
              <X size={24} />
            </button>
            <div className="flex gap-6 text-sm">
              <button className="font-semibold text-[#111827] border-b-2 border-[#111827] pb-4">
                Shopping Cart
              </button>
              <button className="text-[#6d737d] pb-4">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-8 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 order-2 md:order-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#111827]">Order Summary</h1>
              <p className="text-sm text-[#6d737d] mt-1">{cartItems.length} items</p>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 border border-[#e5e7eb] rounded-lg text-center">
                <p className="text-[#6d737d]">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-[#e5e7eb] rounded-lg relative">
                    <div className="flex-shrink-0">
                      <img
                        src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/150x150.png'}
                        alt={item.title || 'Product image'}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-semibold text-[#111827] mb-1">{item.title || 'Product'}</h3>
                      <p className="text-sm text-[#6d737d] mb-2">{item.variant?.title || item.subtitle || 'Product variant'}</p>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#6d737d]">Qty</span>
                        <select
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                          className="text-sm border border-[#e5e7eb] rounded px-2 py-1 text-[#111827]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[#6d737d] hover:text-[#111827]"
                      >
                        <X size={20} />
                      </button>
                      <p className="font-semibold text-[#111827]">${formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>

          <div className="md:col-span-5 order-1 md:order-2">

            <div className="md:sticky md:top-4">
              <div className="mt-6 space-y-3 hidden md:block">
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
                <div className="pt-3 border-t border-[#e5e7eb] flex justify-between text-[#111827]">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl">${formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={onContinueToCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-[#6d737d] hover:bg-[#111827] text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3 hidden md:block"
              >
                Continue to Checkout
              </button>
              <button
                className="w-full text-[#6d737d] hover:text-[#111827] font-medium py-2 px-6 transition-colors mt-3 underline hidden md:block"
              >
                Continue Shopping
              </button>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#6d737d] hidden md:flex">
                <span>Terms</span>
                <span>•</span>
                <span>Privacy</span>
              </div>
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
          onClick={onContinueToCheckout}
          disabled={cartItems.length === 0}
          className="w-full bg-[#6d737d] hover:bg-[#111827] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Checkout</span>
        </button>
      </div>
    </section>
  );
};

export default Cart;
