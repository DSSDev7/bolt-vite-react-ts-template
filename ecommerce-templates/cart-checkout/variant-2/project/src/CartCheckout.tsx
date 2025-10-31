import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from './contexts/CartContext';
import { useProducts } from './hooks/useProducts';
import { sdk } from './lib/medusa-sdk';
import type { CheckoutData } from './types';

/**
 * One Page Cart Checkout
 * A comprehensive, two-column, single-page e-commerce checkout. 
 * The left column contains a multi-step accordion for 'Your Cart', 'Account Details', 
 * 'Delivery Address', and 'Payment Details'. The right column is a persistent, 
 * sticky order summary block that also features a 'Recommended Products' cross-sell module.
 */

const CartCheckout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { cart, updateQuantity: updateCartQuantity, removeItem: removeCartItem, addToCart: addToCartContext, loading } = useCart();
  const { products, loading: productsLoading } = useProducts();

  const stepRefs = {
    step2: React.useRef<HTMLDivElement>(null),
    step3: React.useRef<HTMLDivElement>(null),
    step4: React.useRef<HTMLDivElement>(null),
  };

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    email: 'contact@my-email.com',
    mobile: '(555) 000-0000',
    address: 'Central Park, New York City, USA',
    cardName: '',
    expiryDate: '',
    securityCode: '',
    postalCode: ''
  });

  const addToCart = async (variantId: string) => {
    try {
      await addToCartContext(variantId, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setTimeout(() => {
      if (step === 2 && stepRefs.step2.current) {
        stepRefs.step2.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (step === 3 && stepRefs.step3.current) {
        stepRefs.step3.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (step === 4 && stepRefs.step4.current) {
        stepRefs.step4.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateCartQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleInputChange = (field: keyof CheckoutData, value: string) => {
    setCheckoutData({ ...checkoutData, [field]: value });
  };

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!cart) return;

    setIsProcessing(true);
    try {
      // Update cart with customer info before completing
      await sdk.store.cart.update(cart.id, {
        email: checkoutData.email,
        shipping_address: {
          first_name: 'Customer',
          last_name: 'Name',
          address_1: checkoutData.address,
          city: 'City',
          country_code: 'us',
          postal_code: checkoutData.postalCode || '00000',
          phone: checkoutData.mobile,
        },
      });

      // Initialize payment session (creates payment collection automatically)
      await sdk.store.payment.initiatePaymentSession(cart, {
        provider_id: 'pp_system_default',
      });

      // Complete the cart
      const result = await sdk.store.cart.complete(cart.id);

      if (result.type === 'order' && result.order) {
        setOrderId(result.order.id);
        setOrderComplete(true);
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

  const cartItems = cart?.items || [];
  const subTotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const shipping = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  if (orderComplete) {
    return (
      <section className="bg-white py-8 px-4 md:px-8 lg:px-16 min-h-screen flex items-center justify-center">
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
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Order Placed Successfully!</h1>
          <p className="text-[#6d737d] mb-4">
            Thank you for your order. Your order ID is: <span className="font-mono font-medium">{orderId}</span>
          </p>
          <p className="text-sm text-[#6d737d]">
            A confirmation email has been sent to {checkoutData.email}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      data-section-type="Cart Checkout"
      className="bg-white py-8 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column - Checkout Steps */}
          <div className="space-y-8">
            {/* Step 1: Cart */}
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                1. Your Cart
              </h2>

              {loading || productsLoading ? (
                <div className="text-[#6d737d]">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="bg-[#e5e7eb] rounded-lg p-6 text-center">
                      <p className="text-[#6d737d] mb-4">Your cart is empty</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[#111827]">Available Products:</p>
                        {products.map(product => (
                          <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt="AlphaWeb placeholder image alt text to be updated by AI"
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-[#111827] text-sm">{product.name}</p>
                                <p className="text-[#6d737d] text-sm">${product.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => addToCart(product.variantId)}
                              className="px-4 py-2 bg-[#6d737d] text-white rounded-lg hover:bg-[#111827] transition-colors text-sm"
                            >
                              Add to Cart
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {cartItems.map((item: any) => {
                        return (
                          <div key={item.id} className="bg-[#e5e7eb] rounded-lg p-4">
                            <div className="flex gap-4">
                              <img
                                src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                                alt="AlphaWeb placeholder image alt text to be updated by AI"
                                className="w-20 h-20 object-cover rounded-lg shadow-md"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium text-[#111827]">{item.title || 'Product'}</h3>
                                    <p className="text-sm text-[#6d737d] mt-1">
                                      {item.variant?.title || item.subtitle || 'Details'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-[#6d737d] hover:text-[#111827]"
                                    disabled={loading}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-white"
                                      disabled={loading}
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="w-8 h-8 flex items-center justify-center border border-[#e5e7eb] rounded hover:bg-white"
                                      disabled={loading}
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                  <span className="font-semibold text-[#111827]">
                                    ${formatPrice(item.unit_price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {currentStep === 1 && (
                        <button
                          onClick={() => goToStep(2)}
                          disabled={cartItems.length === 0}
                          className="w-full py-3 bg-[#6d737d] text-white rounded-lg hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Proceed to Account Details
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Account Details */}
            {currentStep >= 2 && (
              <div ref={stepRefs.step2}>
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  2. Account Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Email ID
                    </label>
                    <input
                      type="email"
                      value={checkoutData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={checkoutData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827]"
                    />
                  </div>
                  {currentStep === 2 && (
                    <button
                      onClick={() => goToStep(3)}
                      className="w-full py-3 bg-[#6d737d] text-white rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      Continue to Delivery Address
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Delivery Address */}
            {currentStep >= 3 && (
              <div ref={stepRefs.step3}>
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  3. Delivery Address
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Address
                    </label>
                    <textarea
                      value={checkoutData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] resize-none text-[#111827]"
                    />
                  </div>
                  {currentStep === 3 && (
                    <button
                      onClick={() => goToStep(4)}
                      className="w-full py-3 bg-[#6d737d] text-white rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      Continue to Payment
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Payment Details */}
            {currentStep >= 4 && (
              <div ref={stepRefs.step4}>
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  4. Payment Details
                </h2>

                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111827] mb-2">
                        Name on card
                      </label>
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={checkoutData.cardName}
                        onChange={(e) => handleInputChange('cardName', e.target.value)}
                        className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827] placeholder-[#6d737d]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={checkoutData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827] placeholder-[#6d737d]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">
                          Security Code
                        </label>
                        <input
                          type="text"
                          placeholder="000"
                          value={checkoutData.securityCode}
                          onChange={(e) => handleInputChange('securityCode', e.target.value)}
                          className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827] placeholder-[#6d737d]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          placeholder="000000"
                          value={checkoutData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d737d] text-[#111827] placeholder-[#6d737d]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="w-full py-3 bg-[#6d737d] text-white rounded-lg hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="sticky top-8">
            
            {/* Recommended Products */}
            <div className="mb-3 bg-white rounded-lg p-6 border border-[#e5e7eb]">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">
                Recommended Products
              </h3>
              <div className="space-y-3">
                {products.filter(product => !cartItems.some((item: any) => item.variant?.product?.id === product.id)).slice(0, 3).map(product => (
                  <div key={product.id} className="flex items-center gap-3 pb-3 border-b border-[#e5e7eb] last:border-b-0">
                    <img
                      src={product.image}
                      alt="AlphaWeb placeholder image alt text to be updated by AI"
                      className="w-16 h-16 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-[#111827] text-sm">{product.name}</h4>
                      <p className="text-[#6d737d] text-sm">${product.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addToCart(product.variantId)}
                      className="px-3 py-1 border border-[#6d737d] text-[#6d737d] rounded text-xs hover:bg-[#6d737d] hover:text-white                                   transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#e5e7eb] rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">
                Order Summary
              </h2>

              {cartItems.length === 0 ? (
                <p className="text-[#6d737d]">No items in cart</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {cartItems.map((item: any) => {
                      return (
                        <div key={item.id} className="flex gap-4 pb-4 border-b border-[#6d737d]/20">
                          <img
                            src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                            alt="AlphaWeb placeholder image alt text to be updated by AI"
                            className="w-20 h-20 object-cover rounded-lg shadow-md"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-[#111827]">{item.title || 'Product'}</h3>
                                <p className="text-sm text-[#6d737d] mt-1">
                                  {item.variant?.title || item.subtitle || 'Details'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-[#111827]">
                                  ${formatPrice(item.unit_price)}
                                </span>
                                <span className="text-sm text-[#6d737d] ml-1">X {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[#111827]">
                      <span>Subtotal</span>
                      <span>${formatPrice(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#111827]">
                      <span>Tax</span>
                      <span>${formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-[#111827]">
                      <span>Shipping</span>
                      <span className="text-red-600 font-medium">
                        {shipping > 0 ? `$${formatPrice(shipping)}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-[#111827] pt-3 border-t border-[#6d737d]/20">
                      <span>Total</span>
                      <span>{currencyCode} ${formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#6d737d]/20">
                    <div className="text-sm text-[#6d737d]">
                      <span>Tax Included. <span className="underline">Shipping</span> Calculated At Checkout..</span>
                    </div>
                    <div className="text-sm text-[#6d737d] italic">
                      <span>Estimated Delivery By 25 April, 2022</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CartCheckout;
