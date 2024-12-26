// hooks/useABTest.ts
import { useState, useEffect } from 'react'
import { ABTestService } from '@/lib/services'
import type { ABTestSummary } from '@/types/ab-test'

export function useABTest(testId: string) {
  const [test, setTest] = useState<ABTestSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadTest() {
      try {
        const data = await ABTestService.getById(testId)
        setTest(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      loadTest()
    }
  }, [testId])

  return { test, loading, error }
}