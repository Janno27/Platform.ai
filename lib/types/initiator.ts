export interface ABTest {
  name: string
  hypothesis: string
  context: string
  controlDescription: string
  variations: {
    id: number
    description: string
    visuals?: string[]
  }[]
  kpis: {
    main: string
    secondary?: string
    tertiary?: string
  }
  targeting: {
    devices: string[]
    pages: string[]
    products: string[]
  }
  estimation: {
    audience: number
    conversion: number
    mde: number
    trafficAllocation: number
    confidence: number
    expectedLaunch: Date
    estimatedDuration?: number
  }
}

export type ABTestData = Partial<ABTest> 