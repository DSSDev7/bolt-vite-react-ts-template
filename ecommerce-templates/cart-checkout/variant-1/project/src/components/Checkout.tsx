import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { CartSummary } from '../components/CartSummary';
import { CheckoutHeader } from '../components/CheckoutHeader';
import { CheckoutNavigation } from '../components/CheckoutNavigation';
import { CustomerInfo } from '../App';
import { sdk } from '../lib/medusa-sdk';

/**
 * Checkout Page
 * A two-column e-commerce checkout page. The left column is the primary data entry area for contact information and shipping address forms. The right column is a persistent order summary block displaying the items, subtotal, shipping cost, and total.
 */

interface CheckoutProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  onBack: () => void;
  onNext: () => void;
}

export function Checkout({ customerInfo, setCustomerInfo, onBack, onNext }: CheckoutProps) {
  const { cart, setCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (!cart) return;

    setIsUpdating(true);
    try {
      // Update cart with shipping address and email
      const { cart: updatedCart } = await sdk.store.cart.update(cart.id, {
        email: customerInfo.email,
        shipping_address: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          company: customerInfo.company,
          address_1: customerInfo.address,
          address_2: customerInfo.suburb,
          city: customerInfo.suburb,
          country_code: customerInfo.country || 'US',
          province: customerInfo.state,
          postal_code: customerInfo.postcode,
          phone: customerInfo.phone,
        },
      });

      setCart(updatedCart);
      onNext();
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert('Failed to update shipping information. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section data-section-type="Cart Checkout" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 h-screen flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
            <CheckoutHeader currentStep="information" />

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-sm sm:text-base font-medium text-[#111827]">Contact information</h3>
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
                />
              </div>
              <label className="flex items-center gap-2 text-xs sm:text-sm text-[#6d737d] cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-[#e5e7eb] rounded accent-[#111827]" />
                <span>Email me with news and offers</span>
              </label>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-medium text-[#111827]">Shipping address</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  value={customerInfo.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={customerInfo.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
                />
              </div>

              <input
                type="text"
                placeholder="Company (optional)"
                value={customerInfo.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
              />

              <input
                type="text"
                placeholder="Address"
                value={customerInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
              />

              <input
                type="text"
                placeholder="Suburb"
                value={customerInfo.suburb}
                onChange={(e) => handleInputChange('suburb', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <select
                  value={customerInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base text-[#6d737d] col-span-2 sm:col-span-1"
                >
                  <option value="">Country/region</option>
                  <option value="Australia">Australia</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
                <select
                  value={customerInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base text-[#6d737d]"
                >
                  <option value="">State/territory</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                </select>
                <input
                  type="text"
                  placeholder="Postcode"
                  value={customerInfo.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
                />
              </div>

              <input
                type="tel"
                placeholder="Phone"
                value={customerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#e5e7eb] rounded text-sm sm:text-base"
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-medium text-[#111827]">Shipping method</h3>
              <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#e5e7eb]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#111827]">Standard Shipping</span>
                  <span className="text-sm font-medium text-[#111827]">$10.00</span>
                </div>
                <p className="text-xs text-[#6d737d] mt-1">5-7 business days</p>
              </div>
            </div>

            <div className="md:hidden space-y-4 sm:space-y-6 border-t border-[#e5e7eb] pt-4">
              <CartSummary />
            </div>
          </div>

          <CheckoutNavigation
            onBack={onBack}
            backText="Return to cart"
            onNext={handleNext}
            nextText={isUpdating ? "Updating..." : "Continue To Payment"}
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
