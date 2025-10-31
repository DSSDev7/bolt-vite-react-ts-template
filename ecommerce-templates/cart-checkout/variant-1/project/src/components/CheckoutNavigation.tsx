interface CheckoutNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backText?: string;
  nextText?: string;
}

export function CheckoutNavigation({ onBack, onNext, backText, nextText }: CheckoutNavigationProps) {
  return (
    <div className="flex-shrink-0 bg-white border-t border-[#e5e7eb] pt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {backText && (
          <button
            onClick={onBack}
            className="text-[#111827] hover:underline flex items-center justify-center sm:justify-start gap-1 text-xs sm:text-sm order-2 sm:order-1"
          >
            <span>&lt;</span>
            <span>{backText}</span>
          </button>
        )}
        {onNext && nextText && (
          <button
            onClick={onNext}
            className="bg-[#6d737d] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded text-sm sm:text-base font-medium hover:opacity-90 transition-opacity w-full sm:w-auto order-1 sm:order-2"
          >
            {nextText}
          </button>
        )}
      </div>
    </div>
  );
}
