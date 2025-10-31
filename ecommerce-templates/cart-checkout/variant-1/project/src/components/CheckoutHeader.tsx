interface CheckoutHeaderProps {
  currentStep: 'cart' | 'information' | 'payment';
}

export function CheckoutHeader({ currentStep }: CheckoutHeaderProps) {
  return (
    <div className="border-b border-[#e5e7eb] pb-3 sm:pb-4">
      <h1 className="text-base sm:text-lg font-medium text-[#111827] mb-2">Store Name</h1>
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#6d737d] overflow-x-auto">
        <span className={currentStep === 'cart' ? 'text-[#111827]' : ''}>Cart</span>
        <span>&gt;</span>
        <span className={currentStep === 'information' ? 'text-[#111827]' : ''}>Checkout</span>
        <span>&gt;</span>
        <span className={currentStep === 'payment' ? 'text-[#111827]' : ''}>Payment</span>
      </div>
    </div>
  );
}
