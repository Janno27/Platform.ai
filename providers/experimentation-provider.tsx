// providers/experimentation-provider.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ABTestSummary, Variation, ExpectedResult, RoadmapItem } from '@/types/ab-test'

interface ExperimentationContextType {
  isExperimentationSummaryVisible: boolean
  setExperimentationSummaryVisible: (visible: boolean) => void
  formData: Partial<ABTestSummary>
  updateFormData: (data: Partial<ABTestSummary>) => void
  clearFormData: () => void
  // Helpers spécifiques
  updateVariations: (variations: Variation[]) => void
  updateExpectedResults: (results: ExpectedResult[]) => void
  updateRoadmap: (roadmap: RoadmapItem[]) => void
  // État des modifications
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

const initialFormData: Partial<ABTestSummary> = {
  type: 'ab_test',
  status: 'draft',
  variations: [],
  expected_results: [],
  roadmap: []
}

const ExperimentationContext = createContext<ExperimentationContextType | undefined>(undefined)

export function ExperimentationProvider({ children }: { children: React.ReactNode }) {
  const [isExperimentationSummaryVisible, setExperimentationSummaryVisible] = useState(false)
  const [formData, setFormData] = useState<Partial<ABTestSummary>>(initialFormData)
  const [isDirty, setIsDirty] = useState(false)

  const updateFormData = useCallback((data: Partial<ABTestSummary>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data }
      console.log('Updated form data:', newData)
      return newData
    })
    setIsDirty(true)
  }, [])

  const clearFormData = useCallback(() => {
    setFormData(initialFormData)
    setIsDirty(false)
  }, [])

  // Helpers spécifiques pour des mises à jour plus ciblées
  const updateVariations = useCallback((variations: Variation[]) => {
    setFormData(prev => ({ ...prev, variations }))
    setIsDirty(true)
  }, [])

  const updateExpectedResults = useCallback((expected_results: ExpectedResult[]) => {
    setFormData(prev => ({ ...prev, expected_results }))
    setIsDirty(true)
  }, [])

  const updateRoadmap = useCallback((roadmap: RoadmapItem[]) => {
    setFormData(prev => ({ ...prev, roadmap }))
    setIsDirty(true)
  }, [])

  const value = {
    isExperimentationSummaryVisible,
    setExperimentationSummaryVisible,
    formData,
    updateFormData,
    clearFormData,
    updateVariations,
    updateExpectedResults,
    updateRoadmap,
    isDirty,
    setIsDirty
  }

  return (
    <ExperimentationContext.Provider value={value}>
      {children}
    </ExperimentationContext.Provider>
  )
}

export function useExperimentation() {
  const context = useContext(ExperimentationContext)
  if (!context) {
    throw new Error('useExperimentation must be used within a ExperimentationProvider')
  }
  return context
}