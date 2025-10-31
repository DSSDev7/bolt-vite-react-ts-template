import { useCart } from '../contexts/CartContext';

export function CartSummary() {
  const { cart } = useCart();

  const formatPrice = (amount: number = 0) => {
    return (amount).toFixed(2);
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = cart?.tax_total || 0;
  const shipping = cart?.shipping_total || 0;
  const total = cart?.total || 0;
  const currencyCode = cart?.currency_code?.toUpperCase() || 'USD';

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {cartItems.map((item: any) => (
          <div key={item.id} className="flex gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={item.thumbnail || item.variant?.product?.thumbnail || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png'}
                alt={item.title || 'Product image'}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border border-[#e5e7eb]"
              />
              <span className="absolute -top-2 -right-2 bg-[#6d737d] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 flex justify-between min-w-0">
              <div className="flex-1 min-w-0 pr-2 self-center">
                <h4 className="text-xs sm:text-sm font-medium text-[#111827] truncate">{item.title || 'Product'}</h4>
                <p className="text-xs text-[#6d737d]">{item.variant?.title || item.subtitle || 'Product variant'}</p>
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#111827] whitespace-nowrap self-center">
                ${formatPrice(item.unit_price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-[#e5e7eb]">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#6d737d]">Subtotal</span>
          <span className="text-[#111827]">${formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#6d737d]">Shipping</span>
          {shipping > 0 ? (
            <span className="text-[#111827]">${formatPrice(shipping)}</span>
          ) : (
            <span className="text-[#6d737d] text-xs">Calculated at next step</span>
          )}
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
    </>
  );
}
