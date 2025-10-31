export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface CheckoutData {
  email: string;
  mobile: string;
  address: string;
  cardName: string;
  expiryDate: string;
  securityCode: string;
  postalCode: string;
}
