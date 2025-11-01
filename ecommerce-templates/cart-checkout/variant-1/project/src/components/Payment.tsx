import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { CartSummary } from '../components/CartSummary';
import { CheckoutHeader } from '../components/CheckoutHeader';
import { CheckoutNavigation } from '../components/CheckoutNavigation';
import { CustomerInfo } from '../App';
import { sdk } from '../lib/medusa-sdk';

/**
 * Payment Page
 * A two-column e-commerce payment page for manual payment processing. The left column contains the payment confirmation interface. The right column is a persistent order summary block displaying the final items and total cost before purchase.
 */

interface PaymentProps {
  customerInfo: CustomerInfo;
  onBack: () => void;
}

export function Payment({ customerInfo, onBack }: PaymentProps) {
  const { cart, refreshCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!cart) return;

    setIsProcessing(true);
    try {
      // Initialize payment session (creates payment collection automatically)
      await sdk.store.payment.initiatePaymentSession(cart, {
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

  if (orderComplete) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex items-center justify-center">
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
            A confirmation email has been sent to {customerInfo.email}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
            <CheckoutHeader currentStep="payment" />

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-medium text-[#111827]">Payment</h3>
              <p className="text-xs sm:text-sm text-[#6d737d]">
                This is a manual payment checkout. Your order will be processed and you'll receive confirmation shortly.
              </p>

              <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                <div className="bg-[#e5e7eb] p-3 sm:p-4">
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
                <div className="p-3 sm:p-4">
                  <p className="text-sm text-[#6d737d]">
                    Click "Place Order" to complete your purchase. No payment information is required at this time.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-[#111827]">Order Details</h4>
              <div className="text-[#6d737d] space-y-1">
                <p><span className="font-medium">Email:</span> {customerInfo.email}</p>
                <p><span className="font-medium">Ship to:</span> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p className="text-xs">{customerInfo.address}, {customerInfo.suburb}, {customerInfo.state} {customerInfo.postcode}</p>
              </div>
            </div>

            <div className="md:hidden space-y-4 sm:space-y-6 border-t border-[#e5e7eb] pt-4">
              <CartSummary />
            </div>
          </div>

          <CheckoutNavigation
            onBack={onBack}
            backText="Return to shipping"
            onNext={handlePlaceOrder}
            nextText={isProcessing ? "Processing..." : "Place Order"}
          />
        </div>

        <div className="hidden md:flex md:flex-col md:border-l md:border-[#e5e7eb] md:pl-6 xl:pl-8 md:order-last overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pt-6 pr-2">
            <CartSummary />
          </div>
        </div>
      </div>
    </section>
  );
}
