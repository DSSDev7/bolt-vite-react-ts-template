export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  product?: Product;
}

export interface OrderFormData {
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
  shipping_method: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_company: string;
  billing_address: string;
  billing_apartment: string;
  billing_city: string;
  billing_postal_code: string;
  billing_phone: string;
  billing_country: string;
}
