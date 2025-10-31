import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft, Shield, Truck, Package, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { sdk } from '../lib/medusa-sdk';

/**
 * Three-Step Cart Checkout
 * A classic, three-step e-commerce checkout flow designed for a clear, guided user journey. 
 * The layout is a two-column structure with a main content area on the left and a persistent order 
 * summary on the right. The three distinct steps are 'Cart Review' (listing items), 'Shipping Info' 
 * (collecting address details), and 'Payment' (securely capturing payment), all guided by a clear 
 * step indicator at the top.
 */

type CheckoutStep = 1 | 2 | 3;

interface ShippingInfo {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CartCheckout: React.FC = () => {
  const { cart, updateQuantity: updateCartQuantity, removeItem: removeCartItem, loading, setCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const shipping = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    try {
      await updateCartQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleContinueToShipping = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setCurrentStep(2);
  };

  const handleContinueToPayment = async () => {
    // Validate shipping form
    if (!shippingInfo.email || !shippingInfo.phone || !shippingInfo.firstName ||
        !shippingInfo.lastName || !shippingInfo.address || !shippingInfo.city ||
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.country) {
      alert('Please fill in all required fields');
      return;
    }

    if (!cart) return;

    try {
      setIsProcessing(true);
      // Update cart with shipping information
      const { cart: updatedCart } = await sdk.store.cart.update(cart.id, {
        email: shippingInfo.email,
        shipping_address: {
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          address_1: shippingInfo.address,
          city: shippingInfo.city,
          province: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country_code: shippingInfo.country === 'United States' ? 'us' : 'us',
          phone: shippingInfo.phone,
        },
      });
      setCart(updatedCart);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to update shipping information:', error);
      alert('Failed to update shipping information. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
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
        // Reset form
        setShippingInfo({
          email: '',
          phone: '',
          firstName: '',
          lastName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        });
        setCurrentStep(1);
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

  const renderStepIndicator = () => (
    <div className="bg-white rounded-xl p-6 border border-[#e5e7eb]">
      <div className="flex items-center justify-between mb-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= 1 ? 'bg-[#6d737d] text-white' : 'bg-[#e5e7eb] text-[#6d737d]'
          }`}>
            1
          </div>
          <div className={`w-20 h-1 mx-3 ${currentStep >= 2 ? 'bg-[#6d737d]' : 'bg-[#e5e7eb]'}`} />
        </div>

        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= 2 ? 'bg-[#6d737d] text-white' : 'bg-[#e5e7eb] text-[#6d737d]'
          }`}>
            2
          </div>
          <div className={`w-20 h-1 mx-3 ${currentStep >= 3 ? 'bg-[#6d737d]' : 'bg-[#e5e7eb]'}`} />
        </div>

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= 3 ? 'bg-[#6d737d] text-white' : 'bg-[#e5e7eb] text-[#6d737d]'
          }`}>
            3
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-[#6d737d]">
        <span>Cart Review</span>
        <span>Shipping Info</span>
        <span>Payment</span>
      </div>
    </div>
  );

  const renderOrderSummary = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb]">
      <h3 className="text-xl font-bold text-[#111827] mb-6">Order Summary</h3>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-base">
          <span className="text-[#6d737d]">Subtotal ({cartItems.length} items)</span>
          <span className="text-[#111827] font-semibold">${formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-base">
          <span className="text-[#6d737d]">Shipping</span>
          <span className="text-[#111827] font-semibold">
            {shipping === 0 ? 'FREE' : `$${formatPrice(shipping)}`}
          </span>
        </div>

        <div className="flex justify-between text-base">
          <span className="text-[#6d737d]">Tax</span>
          <span className="text-[#111827] font-semibold">${formatPrice(tax)}</span>
        </div>

        <div className="border-t border-[#e5e7eb] pt-4 mt-4">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-[#111827]">Total</span>
            <span className="text-2xl font-bold text-[#111827]">${formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-sm text-[#111827] bg-[#e5e7eb] p-3 rounded">
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Free shipping offer text!</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6d737d]">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>Secure Checkout Bullet Point</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6d737d]">
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>Delivery Time Bullet Point</span>
        </div>
      </div>

      {currentStep === 1 && (
        <button
          onClick={handleContinueToShipping}
          className="w-full bg-[#6d737d] text-white py-4 rounded-lg font-semibold hover:bg-[#111827] transition-colors mt-6"
        >
          Continue To Shipping
        </button>
      )}

      {currentStep === 2 && (
        <div className="space-y-4 mt-6">
          <button
            onClick={handleContinueToPayment}
            disabled={isProcessing}
            className="w-full bg-[#6d737d] text-white py-4 rounded-lg font-semibold hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Continue To Payment'}
          </button>
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full bg-white text-[#111827] py-4 rounded-lg font-semibold border border-[#e5e7eb] hover:bg-[#e5e7eb] transition-colors"
          >
            Back To Cart
          </button>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4 mt-6">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full bg-[#6d737d] text-white py-4 rounded-lg font-semibold hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Place Order'}
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            disabled={isProcessing}
            className="w-full bg-white text-[#111827] py-4 rounded-lg font-semibold border border-[#e5e7eb] hover:bg-[#e5e7eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back To Shipping
          </button>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6">
      <h2 className="text-2xl font-bold text-[#111827]">Review Your Items</h2>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {cartItems.map((item: any) => (
          <div key={item.id} className="p-4 bg-white border border-[#e5e7eb] rounded-lg">
            {/* Mobile: 2-line layout */}
            <div className="md:hidden space-y-3">
              {/* Line 1: Product details */}
              <div className="flex gap-3">
                <img
                  src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x400.png'}
                  alt="AlphaWeb placeholder image alt text to be updated by AI"
                  className="w-14 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#111827] text-sm">{item.title || 'Product'}</h3>
                  <p className="text-xs text-[#6d737d] line-clamp-1">{item.variant?.title || item.subtitle || 'Product variant'}</p>
                  <p className="text-base font-bold text-[#111827] mt-0.5">${formatPrice(item.unit_price)}</p>
                </div>
              </div>

              {/* Line 2: Quantity controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                    className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                    aria-label="Decrease quantity"
                    disabled={loading}
                  >
                    <span className="text-[#6d737d]">−</span>
                  </button>

                  <span className="w-8 text-center font-semibold text-[#111827]">{item.quantity}</span>

                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                    className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                    aria-label="Increase quantity"
                    disabled={loading}
                  >
                    <span className="text-[#6d737d]">+</span>
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-[#6d737d] hover:text-[#111827] transition-colors"
                  aria-label="Remove item"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop: Single-line horizontal layout */}
            <div className="hidden md:flex gap-4 items-center">
              <img
                src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x400.png'}
                alt="AlphaWeb placeholder image alt text to be updated by AI"
                className="w-20 h-20 object-cover rounded"
              />

              <div className="flex-1">
                <h3 className="font-bold text-[#111827]">{item.title || 'Product'}</h3>
                <p className="text-sm text-[#6d737d]">{item.variant?.title || item.subtitle || 'Product variant'}</p>
                <p className="text-lg font-bold text-[#111827] mt-1">${formatPrice(item.unit_price)}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                  aria-label="Decrease quantity"
                  disabled={loading}
                >
                  <span className="text-[#6d737d]">−</span>
                </button>

                <span className="w-8 text-center font-semibold text-[#111827]">{item.quantity}</span>

                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                  aria-label="Increase quantity"
                  disabled={loading}
                >
                  <span className="text-[#6d737d]">+</span>
                </button>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-2 text-[#6d737d] hover:text-[#111827] transition-colors"
                  aria-label="Remove item"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6">
      <h2 className="text-2xl font-bold text-[#111827]">Shipping Information</h2>

      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              value={shippingInfo.email}
              onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="(555) 123-4567"
              value={shippingInfo.phone}
              onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[#111827] mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              placeholder="John"
              value={shippingInfo.firstName}
              onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[#111827] mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              placeholder="Doe"
              value={shippingInfo.lastName}
              onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-[#111827] mb-2">
            Address
          </label>
          <input
            type="text"
            id="address"
            placeholder="123 Main Street"
            value={shippingInfo.address}
            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-[#111827] mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              placeholder="New York"
              value={shippingInfo.city}
              onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-[#111827] mb-2">
              State
            </label>
            <input
              type="text"
              id="state"
              placeholder="NY"
              value={shippingInfo.state}
              onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-[#111827] mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipCode"
              placeholder="10001"
              value={shippingInfo.zipCode}
              onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
              required
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-[#111827] mb-2">
              Country
            </label>
            <select
              id="country"
              value={shippingInfo.country}
              onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827] bg-white"
              required
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6">
      <h2 className="text-2xl font-bold text-[#111827]">Payment Information</h2>

      <div className="space-y-4">
        <p className="text-sm text-[#6d737d]">
          This is a manual payment checkout. Your order will be processed and you'll receive confirmation shortly.
        </p>

        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <div className="bg-[#e5e7eb] p-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                checked
                readOnly
                className="w-4 h-4 accent-[#111827]"
              />
              <span className="text-sm font-medium text-[#111827]">Manual Payment</span>
            </label>
          </div>
          <div className="p-4">
            <p className="text-sm text-[#6d737d]">
              Click "Place Order" to complete your purchase. No payment information is required at this time.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm border-t border-[#e5e7eb] pt-4">
          <h4 className="font-medium text-[#111827]">Order Details</h4>
          <div className="text-[#6d737d] space-y-1">
            <p><span className="font-medium">Email:</span> {shippingInfo.email}</p>
            <p><span className="font-medium">Ship to:</span> {shippingInfo.firstName} {shippingInfo.lastName}</p>
            <p className="text-xs">{shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (orderComplete) {
    return (
      <section className="min-h-screen bg-[#e5e7eb] py-4 sm:py-8 px-3 sm:px-4 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-lg border border-[#e5e7eb]">
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
            A confirmation email has been sent to {shippingInfo.email || 'your email'}
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="min-h-screen bg-[#e5e7eb] py-4 sm:py-8 px-3 sm:px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-[#6d737d]">Loading cart...</div>
        </div>
      </section>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <section className="min-h-screen bg-[#e5e7eb] py-4 sm:py-8 px-3 sm:px-4 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg border border-[#e5e7eb]">
          <div className="text-lg text-[#111827] mb-2">Your cart is empty</div>
          <div className="text-sm text-[#6d737d]">Add products to your cart to continue</div>
        </div>
      </section>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="min-h-screen bg-[#e5e7eb] py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center gap-3">
            <button className="text-[#6d737d] hover:text-[#111827] transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png"
                alt="AlphaWeb placeholder image alt text to be updated by AI"
                className="w-8 h-8 rounded object-cover"
              />
              <h1 className="text-lg sm:text-xl font-bold text-[#111827]">Store Name</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#111827]">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Checkout</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Checkout Steps */}
          <div className="md:col-span-2">
            {renderStepIndicator()}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Order Summary on mobile - shows below cart items on step 1 */}
            {currentStep === 1 && (
              <div className="md:hidden mt-6">
                {renderOrderSummary()}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary (desktop only on step 1, always visible on steps 2-3) */}
          <div className={`md:col-span-1 ${currentStep === 1 ? 'hidden md:block' : ''}`}>
            {renderOrderSummary()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartCheckout;
