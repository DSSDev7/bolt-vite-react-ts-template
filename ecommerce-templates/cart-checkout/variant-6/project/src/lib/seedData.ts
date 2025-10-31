import { supabase } from './supabase';

export const seedCartForSession = async (sessionId: string) => {
  const sampleItems = [
    {
      session_id: sessionId,
      product_name: 'Product 1',
      product_description: 'Brand Name • Category • Size Details',
      product_image: 'https://alphawebimages.nyc3.digitaloceanspaces.com/square&rectangular/600x400.png',
      price: 120,
      quantity: 1
    },
    {
      session_id: sessionId,
      product_name: 'Product 2',
      product_description: 'Brand Name • Category • Size Details',
      product_image: 'https://alphawebimages.nyc3.digitaloceanspaces.com/square&rectangular/600x400.png',
      price: 135,
      quantity: 2
    },
    {
      session_id: sessionId,
      product_name: 'Product 3',
      product_description: 'Brand Name • Category • Size Details',
      product_image: 'https://alphawebimages.nyc3.digitaloceanspaces.com/square&rectangular/600x400.png',
      price: 140,
      quantity: 1
    }
  ];

  const { data, error } = await supabase
    .from('cart_items')
    .insert(sampleItems)
    .select();

  if (error) {
    console.error('Error seeding cart:', error);
    return null;
  }

  return data;
};
