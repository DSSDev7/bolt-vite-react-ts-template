interface CartItem {
  id: number;
  name: string;
  details: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartTotals {
  subtotal: number;
  shipping: number;
  taxRate: number;
  tax: number;
  total: number;
}

export function calculateCartTotals(cartItems: CartItem[]): CartTotals {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 10.0;
  const taxRate = 0.091;
  const tax = (subtotal + shipping) * taxRate;
  const total = subtotal + shipping;

  return {
    subtotal,
    shipping,
    taxRate,
    tax,
    total,
  };
}
