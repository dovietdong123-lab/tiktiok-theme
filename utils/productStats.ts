'use client'

type SeedInput = number | string | undefined | null

const normalizeSeed = (seed: SeedInput) => {
  if (typeof seed === 'number' && !Number.isNaN(seed)) {
    return seed
  }

  if (typeof seed === 'string') {
    return seed.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0)
  }

  return Math.floor(Math.random() * 100000)
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const formatSoldLabel = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')}K+`
  }
  return `${value}+`
}

export const generateProductStats = (seed?: SeedInput) => {
  const normalizedSeed = normalizeSeed(seed)

  const ratingRandom = pseudoRandom(normalizedSeed)
  const soldRandom = pseudoRandom(normalizedSeed + 97)

  const rating = (4.9 + ratingRandom * 0.1).toFixed(1)
  const sold = Math.max(120, Math.floor(250 + soldRandom * 3500))

  return {
    rating,
    sold,
    soldLabel: formatSoldLabel(sold),
  }
}


