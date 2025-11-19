'use client'

import { useEffect, useState } from 'react'

type CountKey = 'review' | 'sold'

const COUNT_CONFIG: Record<
  CountKey,
  { storageKey: string; ttl: number; generator: () => number }
> = {
  review: {
    storageKey: 'tiktiok_customer_review_count',
    ttl: 10 * 60 * 1000,
    generator: () => Math.floor(Math.random() * 2001) + 3000,
  },
  sold: {
    storageKey: 'tiktiok_sold_count',
    ttl: 10 * 60 * 1000,
    generator: () => Math.floor(Math.random() * (35000 - 23000 + 1)) + 23000,
  },
}

type SchedulerState = {
  value: number | null
  timestamp: number | null
  timeoutId: number | null
  listeners: Set<(value: number) => void>
}

const schedulerState: Record<CountKey, SchedulerState> = {
  review: { value: null, timestamp: null, timeoutId: null, listeners: new Set() },
  sold: { value: null, timestamp: null, timeoutId: null, listeners: new Set() },
}

const readStoredPayload = (key: CountKey) => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COUNT_CONFIG[key].storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.value !== 'number' || typeof parsed?.timestamp !== 'number') return null
    return parsed as { value: number; timestamp: number }
  } catch (error) {
    console.warn('Failed to read stored count', error)
    return null
  }
}

const writeAndBroadcast = (key: CountKey) => {
  if (typeof window === 'undefined') {
    return { value: 0, timestamp: Date.now() }
  }

  const value = COUNT_CONFIG[key].generator()
  const payload = { value, timestamp: Date.now() }

  try {
    window.localStorage.setItem(COUNT_CONFIG[key].storageKey, JSON.stringify(payload))
  } catch (error) {
    console.warn('Failed to store random count', error)
  }

  const state = schedulerState[key]
  state.value = value
  state.timestamp = payload.timestamp
  state.listeners.forEach((listener) => listener(value))

  return payload
}

const startScheduler = (key: CountKey, delay: number) => {
  const state = schedulerState[key]
  const config = COUNT_CONFIG[key]

  if (state.timeoutId !== null || typeof window === 'undefined') return

  const schedule = (wait: number) => {
    state.timeoutId = window.setTimeout(() => {
      writeAndBroadcast(key)
      schedule(config.ttl)
    }, wait)
  }

  schedule(delay)
}

const stopSchedulerIfUnused = (key: CountKey) => {
  const state = schedulerState[key]
  if (state.listeners.size === 0 && state.timeoutId !== null && typeof window !== 'undefined') {
    window.clearTimeout(state.timeoutId)
    state.timeoutId = null
  }
}

export const useRandomizedCount = (key: CountKey) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const state = schedulerState[key]
    state.listeners.add(setCount)

    let payload = readStoredPayload(key)

    if (payload && Date.now() - payload.timestamp < COUNT_CONFIG[key].ttl) {
      state.value = payload.value
      state.timestamp = payload.timestamp
      setCount(payload.value)
      startScheduler(key, Math.max(COUNT_CONFIG[key].ttl - (Date.now() - payload.timestamp), 0))
    } else {
      payload = writeAndBroadcast(key)
      setCount(payload.value)
      startScheduler(key, COUNT_CONFIG[key].ttl)
    }

    return () => {
      state.listeners.delete(setCount)
      stopSchedulerIfUnused(key)
    }
  }, [key])

  return count
}

export const formatCountAsK = (value: number) => {
  if (!value) return '0'
  const formatted = (value / 1000).toFixed(1).replace('.', ',')
  return `${formatted}K`
}

