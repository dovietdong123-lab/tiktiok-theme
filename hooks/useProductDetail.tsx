'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ProductDetailContextType {
  isOpen: boolean
  productId: number | null
  openProductDetail: (id: number) => void
  closeProductDetail: () => void
}

const ProductDetailContext = createContext<ProductDetailContextType | undefined>(undefined)

export function ProductDetailProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [productId, setProductId] = useState<number | null>(null)

  const openProductDetail = (id: number) => {
    setProductId(id)
    setIsOpen(true)
  }

  const closeProductDetail = () => {
    setIsOpen(false)
    setProductId(null)
  }

  return (
    <ProductDetailContext.Provider value={{ isOpen, productId, openProductDetail, closeProductDetail }}>
      {children}
    </ProductDetailContext.Provider>
  )
}

export function useProductDetail() {
  const context = useContext(ProductDetailContext)
  if (!context) {
    throw new Error('useProductDetail must be used within ProductDetailProvider')
  }
  return context
}

