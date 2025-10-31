import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { HttpTypes } from '@medusajs/types'
import { sdk } from '../lib/medusa-sdk'

type CartContextType = {
  cart?: HttpTypes.StoreCart
  setCart: (cart: HttpTypes.StoreCart | undefined) => void
  refreshCart: () => void
  addToCart: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | null>(null)

type CartProviderProps = {
  children: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<HttpTypes.StoreCart | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initCart = async () => {
      try {
        const cartId = localStorage.getItem('cart_id')
        
        if (!cartId) {
          // Get default region (you may want to allow user selection)
          const { regions } = await sdk.store.region.list()
          const defaultRegion = regions[0]
          
          if (!defaultRegion) {
            console.error('No regions available')
            setLoading(false)
            return
          }

          // Create new cart
          const { cart: newCart } = await sdk.store.cart.create({
            region_id: defaultRegion.id,
          })
          
          localStorage.setItem('cart_id', newCart.id)
          setCart(newCart)
        } else {
          // Retrieve existing cart
          const { cart: existingCart } = await sdk.store.cart.retrieve(cartId, {
            fields: '+items.*, +shipping_methods.*',
          })
          setCart(existingCart)
        }
      } catch (error) {
        console.error('Error initializing cart:', error)
        // Clear invalid cart ID
        localStorage.removeItem('cart_id')
      } finally {
        setLoading(false)
      }
    }

    initCart()
  }, [])

  const addToCart = async (variantId: string, quantity: number) => {
    const cartId = cart?.id || localStorage.getItem('cart_id')
    if (!cartId) {
      console.error('No cart available')
      return
    }

    try {
      const { cart: updatedCart } = await sdk.store.cart.createLineItem(cartId, {
        variant_id: variantId,
        quantity,
      })
      setCart(updatedCart)
    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    const cartId = cart?.id || localStorage.getItem('cart_id')
    if (!cartId) return

    try {
      const { cart: updatedCart } = await sdk.store.cart.updateLineItem(
        cartId,
        itemId,
        { quantity }
      )
      setCart(updatedCart)
    } catch (error) {
      console.error('Error updating item quantity:', error)
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    const cartId = cart?.id || localStorage.getItem('cart_id')
    if (!cartId) return

    try {
      const { parent: updatedCart } = await sdk.store.cart.deleteLineItem(
        cartId,
        itemId
      )
      setCart(updatedCart as HttpTypes.StoreCart)
    } catch (error) {
      console.error('Error removing item:', error)
      throw error
    }
  }

  const refreshCart = () => {
    localStorage.removeItem('cart_id')
    setCart(undefined)
    setLoading(true)
    // Re-initialize cart
    window.location.reload()
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
