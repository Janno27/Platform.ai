// types/ab-test.ts
interface Base {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface Variation extends Base {
  name: string
  description: string
  desktop_image_path?: string
  mobile_image_path?: string
  is_control: boolean
  order_index: number
}

export interface ExpectedResult {
  kpi_name: string
  improvement_percentage: number
}

export interface RoadmapItem {
  id: string
  country_code: string
  start_date?: Date
  status?: 'planned' | 'running' | 'completed' | 'cancelled'
}

export interface ABTestSummary extends Base {
  organization_id: string
  name: string
  type: 'ab_test' | 'personalization' | 'patch'
  status: 'draft' | 'ready' | 'running' | 'completed' | 'archived'
  hypothesis: string
  context: string
  roadmap: RoadmapItem[]
  expected_results: ExpectedResult[]
  variations: Variation[]
  owner_id: string
  created_by: string
  last_modified_by?: string
}

export interface TestVersion extends Base {
  test_id: string
  version_number: number
  hypothesis: string
  context: string
  type: 'ab_test' | 'personalization' | 'patch'
  status: 'draft' | 'ready' | 'running' | 'completed' | 'archived'
  roadmap: RoadmapItem[]
  expected_results: ExpectedResult[]
  variations: Variation[]
  created_by: string
}