'use client'

type NumericInput = number | string | null | undefined

type VariantLike = {
  price?: NumericInput
  regular?: NumericInput
  regular_price?: NumericInput
  discount?: NumericInput
}

type AttributeValueLike = {
  value?: string
  price?: NumericInput
  regular?: NumericInput
  discount?: NumericInput
}

type AttributeLike = {
  name?: string
  values?: AttributeValueLike[]
}

type PricingEntry = {
  price?: number
  regular?: number
  discount?: number
}

const toNumber = (value: NumericInput): number | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const normalized = trimmed
      .replace(/[^0-9,.\-]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const parseAttributes = (raw: any): AttributeLike[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const buildAttributeEntries = (rawAttributes: any): PricingEntry[] => {
  const attributes = parseAttributes(rawAttributes)
  const entries: PricingEntry[] = []
  attributes.forEach((attr) => {
    if (!attr || !Array.isArray(attr.values)) return
    attr.values.forEach((val) => {
      if (!val) return
      const price = toNumber(val.price)
      const regular = toNumber(val.regular)
      const discount = toNumber(val.discount)
      if (price !== undefined || regular !== undefined || discount !== undefined) {
        entries.push({ price, regular, discount })
      }
    })
  })
  return entries
}

const buildVariantEntries = (variants?: VariantLike[] | null): PricingEntry[] => {
  if (!variants || !Array.isArray(variants) || variants.length === 0) return []
  return variants
    .map((variant) => ({
      price: toNumber(variant.price),
      regular: toNumber(variant.regular ?? variant.regular_price),
      discount: toNumber(variant.discount),
    }))
    .filter(
      (entry) =>
        entry.price !== undefined || entry.regular !== undefined || entry.discount !== undefined
    )
}

const pickEntryForPrice = (entries: PricingEntry[], targetPrice: number) => {
  return (
    entries.find((entry) => entry.price !== undefined && entry.price === targetPrice) ?? null
  )
}

export const getDisplayPricing = (product: {
  price?: NumericInput
  regular?: NumericInput
  regular_price?: NumericInput
  discount?: NumericInput
  variants?: VariantLike[]
  attributes?: any
}) => {
  const basePrice = toNumber(product?.price)
  const baseRegular = toNumber(product?.regular ?? product?.regular_price)
  const baseDiscount = toNumber(product?.discount)

  let entries = buildVariantEntries(product?.variants)
  if (entries.length === 0) {
    entries = buildAttributeEntries(product?.attributes)
  }
  if (entries.length === 0) {
    entries = [
      {
        price: basePrice,
        regular: baseRegular,
        discount: baseDiscount,
      },
    ]
  }

  const priceValues = entries
    .map((entry) => entry.price)
    .filter((value): value is number => value !== undefined)

  const price =
    priceValues.length > 0
      ? Math.min(...priceValues)
      : basePrice !== undefined
      ? basePrice
      : 0
  const priceMax =
    priceValues.length > 0
      ? Math.max(...priceValues)
      : basePrice !== undefined
      ? basePrice
      : 0

  const priceEntry = pickEntryForPrice(entries, price) ?? {
    price: basePrice,
    regular: baseRegular,
    discount: baseDiscount,
  }

  let regularCandidate = priceEntry.regular ?? baseRegular ?? price
  if (regularCandidate < price) {
    regularCandidate = price
  }

  const regular = priceMax > price ? priceMax : regularCandidate

  let discount = priceEntry.discount ?? baseDiscount
  if ((discount === undefined || Number.isNaN(discount)) && regular > 0 && price < regular) {
    discount = Math.max(0, Math.round(((regular - price) / regular) * 100))
  }

  return {
    price,
    priceMax,
    regular,
    discount: discount ?? 0,
  }
}


