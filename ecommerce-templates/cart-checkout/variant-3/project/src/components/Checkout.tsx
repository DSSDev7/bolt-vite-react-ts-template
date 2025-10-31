import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { ChevronLeft } from 'lucide-react';
import { sdk } from '../lib/medusa-sdk';

/**
 * Two Step Cart Checkout - Checkout Page
 * A two-column e-commerce checkout page. The left column is a comprehensive, single-form
 * layout for all user information, including contact details, delivery address, shipping method,
 * and a secure payment section. The right column is a persistent, sticky order summary block
 * displaying the final cart items and a detailed cost breakdown.
 */

interface CheckoutProps {
  onBack: () => void;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  address: string;
  apartment: string;
  city: string;
  postal_code: string;
  phone: string;
  country: string;
}

export default function Checkout({ onBack }: CheckoutProps) {
  const { cart, refreshCart } = useCart();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    address: '',
    apartment: '',
    city: '',
    postal_code: '',
    phone: '',
    country: 'Pakistan',
  });
  const [emailNews, setEmailNews] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [textOffers, setTextOffers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const formatPrice = (amount: number = 0) => {
    return (amount / 100).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shippingCost = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart) {
      alert('No cart available');
      return;
    }

    setIsProcessing(true);
    try {
      // Update cart with customer information
      await sdk.store.cart.update(cart.id, {
        email: formData.email,
        shipping_address: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          company: formData.company,
          address_1: formData.address,
          address_2: formData.apartment,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          country_code: 'pk', // Default to Pakistan, you might want to map this
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
      <section className="min-h-screen bg-[#e5e7eb] text-[#111827] flex items-center justify-center">
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
            A confirmation email has been sent to {formData.email}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-section-type="Cart Checkout" className="min-h-screen bg-[#e5e7eb] text-[#111827]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-[#111827] mb-8 hover:opacity-70 transition-opacity">
          <ChevronLeft size={20} />
          <span>Back to Cart</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="order-2 lg:order-1 bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Contact</h2>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                />
                <label className="flex items-center gap-2 mt-3 text-sm">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Email me with news and offers</span>
                </label>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Delivery</h2>
                <div className="space-y-4">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23111827%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27/%3e%3c/svg%3e')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                    style={{ backgroundPosition: 'right 1rem center' }}
                  >
                    <option value="Pakistan">Pakistan</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="first_name"
                      placeholder="First name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    />
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Last name"
                      required
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    />
                  </div>

                  <input
                    type="text"
                    name="company"
                    placeholder="Company (optional)"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                  />

                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                  />

                  <input
                    type="text"
                    name="apartment"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    />
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="Postal code (optional)"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                    />
                  </div>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] text-[#111827]"
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Save this information for next time</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={textOffers}
                      onChange={(e) => setTextOffers(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Text me with news and offers</span>
                  </label>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Shipping method</h2>
                <div className="border border-[#6d737d] rounded p-4 flex justify-between items-center">
                  <span>Express Shipping - Home Delivery</span>
                  <span>${formatPrice(shippingCost)}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Payment</h2>
                <p className="text-sm text-[#6d737d] mb-4">
                  All transactions are secure and encrypted.
                </p>
                <div className="border border-[#6d737d] rounded overflow-hidden">
                  <div className="bg-[#e5e7eb] p-4 flex justify-between items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked
                        readOnly
                        className="w-4 h-4 accent-[#111827]"
                      />
                      <span className="font-medium">Manual Payment</span>
                    </label>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#6d737d]">
                      Click "Complete Payment" to place your order. No payment information is required at this time.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#6d737d] text-white py-4 rounded font-semibold text-lg hover:bg-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </button>

              <div className="flex justify-center gap-6 text-xs text-[#6d737d]">
                <a href="#" className="underline hover:text-[#111827] transition-colors">
                  Refund policy
                </a>
                <a href="#" className="underline hover:text-[#111827] transition-colors">
                  Privacy policy
                </a>
                <a href="#" className="underline hover:text-[#111827] transition-colors">
                  Terms of service
                </a>
              </div>
            </form>
          </div>

          <div className="order-1 lg:order-2 bg-white lg:bg-transparent p-6 lg:p-0 rounded shadow lg:shadow-none lg:sticky lg:top-8 h-[fit-content]">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-[#e5e7eb] space-y-6 mb-6">
              {cartItems.map((item: any) => {
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                        alt={item.title || 'Product'}
                        className="w-16 h-16 object-cover bg-[#e5e7eb] rounded"
                      />
                      <span className="absolute -top-2 -right-2 bg-[#111827] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{item.title || 'Product'}</h3>
                      <p className="text-xs text-[#6d737d]">
                        {item.variant?.title || item.subtitle || 'Product variant'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pb-6 border-b border-[#6d737d]">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>${formatPrice(shippingCost)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mt-6">
              <span>Total</span>
              <div className="text-right">
                <p className="text-xs text-[#6d737d] font-normal">{currencyCode}</p>
                <p>${formatPrice(total)}</p>
              </div>
            </div>

            <div className="mt-8 text-xs text-[#6d737d] space-y-2">
              <p>Taxes (VAT) already included in product prices above.</p>
              <p>
                Depending on your country, extra import taxes may be charged by the logistic company.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
