import { useEffect, useState } from 'react'
import { HttpTypes } from '@medusajs/types'
import { sdk } from '../lib/medusa-sdk'

export interface MappedProduct {
  id: string
  name: string
  details: string
  price: number
  image: string
  variantId: string
}

export const useProducts = () => {
  const [products, setProducts] = useState<MappedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        // Get default region for pricing
        const { regions } = await sdk.store.region.list()
        const defaultRegion = regions[0]

        if (!defaultRegion) {
          throw new Error('No regions available')
        }

        // Fetch products with pricing info
        const { products: medusaProducts } = await sdk.store.product.list({
          limit: 100,
          fields: '*variants.calculated_price',
          region_id: defaultRegion.id,
        })

        // Map MedusaJS products to component structure
        const mappedProducts: MappedProduct[] = medusaProducts
          .filter(product => product.variants && product.variants.length > 0)
          .map(product => {
            const firstVariant = product.variants![0]
            const price = firstVariant.calculated_price?.calculated_amount
              ? firstVariant.calculated_price.calculated_amount / 100
              : 0

            return {
              id: product.id!,
              name: product.title || 'Untitled Product',
              details: product.subtitle || product.description || 'No description',
              price,
              image: product.thumbnail || product.images?.[0]?.url || 'https://alphawebimages.nyc3.digitaloceanspaces.com/placeholder/600x600.png',
              variantId: firstVariant.id!,
            }
          })

        setProducts(mappedProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching products from MedusaJS:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}
