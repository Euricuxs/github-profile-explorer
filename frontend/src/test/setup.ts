import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// React Testing Library decides whether fake timers are installed by looking
// for a global `jest` object (it calls `jest.advanceTimersByTime` when it
// finds one). Vitest exposes `vi` instead, so we provide the single method
// RTL needs under the name it looks for.
const globalWithJest = globalThis as typeof globalThis & {
  jest?: { advanceTimersByTime: (ms: number) => void }
}

globalWithJest.jest = {
  advanceTimersByTime: (ms: number) => {
    vi.advanceTimersByTime(ms)
  },
}

// React Testing Library only registers its automatic cleanup when a global
// `afterEach` exists. This project runs Vitest without `globals: true`, so
// the cleanup is registered explicitly here.
afterEach(() => {
  cleanup()
})
