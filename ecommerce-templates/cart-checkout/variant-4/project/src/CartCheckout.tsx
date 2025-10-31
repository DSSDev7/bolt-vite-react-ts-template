import React, { useState } from 'react';
import { useCart } from './contexts/CartContext';
import { sdk } from './lib/medusa-sdk';

/**
 * Two-Step Cart Checkout
 * A clean, two-step e-commerce journey combining the cart and checkout into a single view.
 * The first step is a 'Shopping Cart' view with a two-column layout: a list of cart items on the left
 * and a persistent order summary with a 'Proceed to Checkout' CTA on the right. The second step
 * is a 'Checkout' view with a two-column layout: a comprehensive form for customer info, shipping,
 * and payment on the left, and the persistent order summary with a 'Place Order' CTA on the right.
 */

interface FormData {
  email: string;
  fullName: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const CartCheckout: React.FC = () => {
  const { cart, updateQuantity, removeItem, loading, refreshCart } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout' | 'complete'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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
    return (amount / 100).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const shippingCost = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'fullName':
        if (!value) return 'Full name is required';
        if (value.trim().split(' ').length < 2) return 'Please enter first and last name';
        return '';
      case 'streetAddress':
        if (!value) return 'Street address is required';
        return '';
      case 'city':
        if (!value) return 'City is required';
        return '';
      case 'state':
        if (!value) return 'State/Province is required';
        return '';
      case 'zipCode':
        if (!value) return 'ZIP/Postal code is required';
        if (/\s/.test(value)) return 'Please exclude all spaces';
        if (formData.country === 'United States' && !/^\d{5}(-\d{4})?$/.test(value)) {
          return 'Please enter a valid US ZIP code';
        }
        return '';
      case 'country':
        if (!value) return 'Country is required';
        return '';
      case 'phone':
        if (!value) return 'Phone is required for shipping';
        if (!/^\+?[\d\s\-()]+$/.test(value)) return 'Please enter a valid phone number';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    if (touchedFields.has(name)) {
      const error = validateField(name, value);
      setValidationErrors({ ...validationErrors, [name]: error });
    }
  };

  const handleBlur = (name: string) => {
    setTouchedFields(new Set(touchedFields).add(name));
    const error = validateField(name, formData[name]);
    setValidationErrors({ ...validationErrors, [name]: error });
  };

  const validateAllFields = (): boolean => {
    const requiredFields = [
      'email', 'fullName', 'streetAddress', 'city', 'state', 'zipCode', 'country', 'phone'
    ];

    const errors: ValidationErrors = {};
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) errors[field] = error;
    });

    setValidationErrors(errors);
    setTouchedFields(new Set(requiredFields));

    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!cart || !validateAllFields()) return;

    setIsProcessing(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Update cart with shipping address and email
      await sdk.store.cart.update(cart.id, {
        email: formData.email,
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address_1: formData.streetAddress,
          address_2: formData.streetAddress2 || undefined,
          city: formData.city,
          province: formData.state,
          postal_code: formData.zipCode,
          country_code: formData.country === 'United States' ? 'us' :
                       formData.country === 'Canada' ? 'ca' :
                       formData.country === 'United Kingdom' ? 'gb' : 'us',
          phone: formData.phone,
        },
      });

      // Initialize payment session for manual payment provider
      await sdk.store.payment.initiatePaymentSession(cart, {
        provider_id: 'pp_system_default',
      });

      // Complete the cart
      const result = await sdk.store.cart.complete(cart.id);

      if (result.type === 'order' && result.order) {
        setOrderId(result.order.id);
        setStep('complete');
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

  // Loading state
  if (loading) {
    return (
      <section
        data-section-type="Cart Checkout"
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="text-center">
          <div className="text-lg" style={{ color: '#6d737d' }}>Loading cart...</div>
        </div>
      </section>
    );
  }

  // Order complete state
  if (step === 'complete') {
    return (
      <section
        data-section-type="Cart Checkout"
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="text-center max-w-md">
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
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#111827' }}>
            Order Placed Successfully!
          </h1>
          <p className="text-base mb-4" style={{ color: '#6d737d' }}>
            Thank you for your order. Your order ID is:{' '}
            <span className="font-mono font-medium">{orderId}</span>
          </p>
          <p className="text-sm" style={{ color: '#6d737d' }}>
            A confirmation email has been sent to {formData.email}
          </p>
        </div>
      </section>
    );
  }

  if (step === 'cart') {
    return (
      <section
        data-section-type="Cart Checkout"
        className="min-h-screen"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 md:mb-12" style={{ color: '#111827' }}>
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Cart Items */}
            <div className="md:col-span-2">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg mb-4" style={{ color: '#6d737d' }}>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-start space-x-4 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                      <img
                        src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/150x150.png'}
                        alt={item.title || 'Product image'}
                        className="w-24 h-24 object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>{item.title || 'Product'}</h3>
                        <p className="text-sm mb-2" style={{ color: '#6d737d' }}>{item.variant?.title || item.subtitle || 'Product variant'}</p>
                        <p className="text-base font-bold mb-4" style={{ color: '#111827' }}>${formatPrice(item.unit_price)}</p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border" style={{ borderColor: '#e5e7eb' }}>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              className="px-3 py-1 text-lg"
                              style={{ color: '#111827' }}
                              disabled={loading}
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-l border-r" style={{ borderColor: '#e5e7eb', color: '#111827' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              className="px-3 py-1 text-lg"
                              style={{ color: '#111827' }}
                              disabled={loading}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-sm underline"
                            style={{ color: '#6d737d' }}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-lg font-bold" style={{ color: '#111827' }}>
                        ${formatPrice(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="md:col-span-1">
              <div className="border p-6 sticky top-8" style={{ borderColor: '#e5e7eb' }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#111827' }}>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#111827' }}>Subtotal</span>
                    <span className="text-sm font-bold" style={{ color: '#111827' }}>${formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#111827' }}>Shipping</span>
                    <span className="text-sm font-bold" style={{ color: '#111827' }}>
                      {shippingCost > 0 ? `$${formatPrice(shippingCost)}` : 'Calculated at next step'}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#111827' }}>Tax</span>
                      <span className="text-sm font-bold" style={{ color: '#111827' }}>${formatPrice(tax)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-6 border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                  <span className="text-lg font-bold" style={{ color: '#111827' }}>Total</span>
                  <span className="text-lg font-bold" style={{ color: '#111827' }}>
                    ${formatPrice(total)} <span className="text-sm" style={{ color: '#6d737d' }}>{currencyCode}</span>
                  </span>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  disabled={cartItems.length === 0}
                  className="w-full py-4 text-white text-sm font-bold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#6d737d' }}
                >
                  Proceed to Checkout
                </button>
                <button
                  className="w-full mt-3 text-sm underline"
                  style={{ color: '#111827' }}
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-section-type="Cart Checkout"
      className="min-h-screen"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <button
            onClick={() => setStep('cart')}
            className="text-sm underline"
            style={{ color: '#6d737d' }}
          >
            ← Back to cart
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column - Forms */}
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 md:mb-12" style={{ color: '#111827' }}>
              Checkout
            </h1>

            {/* Customer Info Section */}
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>
                  Customer Info
                </h2>
                <span className="text-sm" style={{ color: '#111827' }}>* Required</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-[#111827]"
                    style={{
                      borderColor: validationErrors.email && touchedFields.has('email') ? '#ef4444' : '#e5e7eb',
                      ringColor: '#111827'
                    }}
                    required
                  />
                  {validationErrors.email && touchedFields.has('email') && (
                    <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                      {validationErrors.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>
                  Shipping Address
                </h2>
                <span className="text-sm" style={{ color: '#111827' }}>* Required</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="fullName" className="block text-xs font-medium" style={{ color: '#111827' }}>
                      Full Name *
                    </label>
                    <span className="text-xs" style={{ color: '#6d737d' }}>Include first and last name</span>
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    style={{
                      borderColor: validationErrors.fullName && touchedFields.has('fullName') ? '#ef4444' : '#e5e7eb'
                    }}
                    required
                  />
                  {validationErrors.fullName && touchedFields.has('fullName') && (
                    <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                      {validationErrors.fullName}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="streetAddress" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                    onBlur={() => handleBlur('streetAddress')}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    style={{
                      borderColor: validationErrors.streetAddress && touchedFields.has('streetAddress') ? '#ef4444' : '#e5e7eb'
                    }}
                    required
                  />
                  {validationErrors.streetAddress && touchedFields.has('streetAddress') && (
                    <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                      {validationErrors.streetAddress}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="streetAddress2" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                    Street Address 2
                  </label>
                  <input
                    type="text"
                    id="streetAddress2"
                    value={formData.streetAddress2}
                    onChange={(e) => handleInputChange('streetAddress2', e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      onBlur={() => handleBlur('city')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                      style={{
                        borderColor: validationErrors.city && touchedFields.has('city') ? '#ef4444' : '#e5e7eb'
                      }}
                      required
                    />
                    {validationErrors.city && touchedFields.has('city') && (
                      <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                        {validationErrors.city}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                      State/Province *
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      onBlur={() => handleBlur('state')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                      style={{
                        borderColor: validationErrors.state && touchedFields.has('state') ? '#ef4444' : '#e5e7eb'
                      }}
                      required
                    />
                    {validationErrors.state && touchedFields.has('state') && (
                      <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                        {validationErrors.state}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      onBlur={() => handleBlur('zipCode')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                      style={{
                        borderColor: validationErrors.zipCode && touchedFields.has('zipCode') ? '#ef4444' : '#e5e7eb'
                      }}
                      required
                    />
                    {validationErrors.zipCode && touchedFields.has('zipCode') && (
                      <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                        {validationErrors.zipCode}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-xs font-medium mb-2" style={{ color: '#111827' }}>
                    Country *
                  </label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827] appearance-none cursor-pointer bg-white"
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="North Korea">North Korea</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="phone" className="block text-xs font-medium" style={{ color: '#111827' }}>
                      Phone *
                    </label>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    style={{
                      borderColor: validationErrors.phone && touchedFields.has('phone') ? '#ef4444' : '#e5e7eb'
                    }}
                    required
                  />
                  {validationErrors.phone && touchedFields.has('phone') && (
                    <span className="text-xs mt-1 block" style={{ color: '#ef4444' }}>
                      {validationErrors.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Method Section */}
            <div className="mb-8 md:mb-12 border-t border-b py-8" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#111827' }}>
                Shipping Method
              </h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="freeShipping"
                    name="shippingMethod"
                    className="w-4 h-4"
                    defaultChecked
                    style={{
                      accentColor: '#111827',
                    }}
                  />
                  <label htmlFor="freeShipping" className="ml-3 text-base" style={{ color: '#111827' }}>
                    Free shipping
                  </label>
                </div>
                <span className="text-base font-medium" style={{ color: '#111827' }}>$0</span>
              </div>
            </div>

            {/* Payment Info Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>
                  Payment Info
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm" style={{ color: '#6d737d' }}>
                  This is a manual payment checkout. Your order will be processed and you'll receive confirmation shortly.
                </p>

                <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                  <div className="p-4" style={{ backgroundColor: '#e5e7eb' }}>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked
                        readOnly
                        className="w-4 h-4"
                        style={{ accentColor: '#111827' }}
                      />
                      <span className="text-sm font-medium" style={{ color: '#111827' }}>Manual Payment</span>
                    </label>
                  </div>
                  <div className="p-4">
                    <p className="text-sm" style={{ color: '#6d737d' }}>
                      Click "Place Order" to complete your purchase. No payment information is required at this time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="md:col-span-1">
            <div className="border p-6 sticky top-8" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="text-xl font-bold mb-6 uppercase tracking-wide" style={{ color: '#111827' }}>
                ORDER SUMMARY
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <img
                      src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/150x150.png'}
                      alt={item.title || 'Product image'}
                      className="w-12 h-12 object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold" style={{ color: '#111827' }}>{item.title || 'Product'}</h3>
                      <p className="text-xs mt-1" style={{ color: '#111827' }}>Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold" style={{ color: '#111827' }}>${formatPrice(item.unit_price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-3 mb-6 border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#111827' }}>Subtotal</span>
                  <span className="text-sm font-bold" style={{ color: '#111827' }}>${formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#111827' }}>Shipping</span>
                  <span className="text-sm font-bold" style={{ color: '#111827' }}>
                    {shippingCost > 0 ? `$${formatPrice(shippingCost)}` : 'Calculated at checkout'}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#111827' }}>Tax</span>
                    <span className="text-sm font-bold" style={{ color: '#111827' }}>${formatPrice(tax)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-4 border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                <span className="text-lg font-bold" style={{ color: '#111827' }}>Total</span>
                <span className="text-lg font-bold" style={{ color: '#111827' }}>
                  ${formatPrice(total)} <span className="text-sm" style={{ color: '#6d737d' }}>{currencyCode}</span>
                </span>
              </div>

              {/* Terms */}
              <p className="text-xs mb-6" style={{ color: '#111827' }}>
                By placing your order, you agree to the{' '}
                <a href="#" className="underline" style={{ color: '#111827' }}>Terms of Sale</a> and that you have read and understood our{' '}
                <a href="#" className="underline" style={{ color: '#111827' }}>Privacy Policy</a>.
              </p>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full py-4 text-white text-sm font-bold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#6d737d' }}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartCheckout;
