// lib/services/ab-test-service.ts
import { supabase } from '@/lib/supabase'
import { ABTestSummary, TestVersion } from '@/types/ab-test'

export const ABTestService = {
  async createOrUpdate(data: Omit<ABTestSummary, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating/Updating test with data:', data)
    
    try {
      // 1. Créer ou mettre à jour le test summary
      const { data: test, error: testError } = await supabase
        .from('ab_tests_summary')
        .upsert([{
          organization_id: data.organization_id,
          name: data.name,
          type: data.type,
          status: data.status,
          hypothesis: data.hypothesis,
          context: data.context,
          roadmap: data.roadmap,
          expected_results: data.expected_results,
          variations: data.variations,
          owner_id: data.owner_id,
          created_by: data.created_by,
          last_modified_by: data.last_modified_by
        }])
        .select()
        .single()

      if (testError) {
        console.error('Error creating test summary:', testError)
        throw testError
      }

      // 2. Créer la nouvelle version
      const { data: version, error: versionError } = await supabase
        .from('test_versions')
        .insert([{
          test_id: test.id,
          version_number: 1, // À incrémenter si version existante
          hypothesis: data.hypothesis,
          context: data.context,
          type: data.type,
          status: data.status,
          roadmap: data.roadmap,
          expected_results: data.expected_results,
          variations: data.variations,
          created_by: data.created_by
        }])
        .select()
        .single()

      if (versionError) {
        console.error('Error creating version:', versionError)
        throw versionError
      }

      return { test, version }
    } catch (error) {
      console.error('Error in createOrUpdate:', error)
      throw error
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('ab_tests_summary')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ABTestSummary
  },

  async getAllByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('ab_tests_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ABTestSummary[]
  },

  async getVersionsByTestId(testId: string) {
    const { data, error } = await supabase
      .from('test_versions')
      .select('*')
      .eq('test_id', testId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return data as TestVersion[]
  }
}