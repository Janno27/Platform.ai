import { supabase } from '@/lib/supabase'

export const KanbanService = {
  async addColumn(organizationId: string, columnName: string) {
    // Ajouter une nouvelle valeur de statut pour l'organisation
    const { data, error } = await supabase
      .from('organization_test_statuses')
      .insert({
        organization_id: organizationId,
        status: columnName,
        order: 0 // Vous pouvez implémenter un système d'ordre si nécessaire
      })
      .select()

    if (error) throw error
    return data
  },

  async updateColumnName(organizationId: string, oldName: string, newName: string) {
    const { error } = await supabase
      .from('organization_test_statuses')
      .update({ status: newName })
      .match({ organization_id: organizationId, status: oldName })

    if (error) throw error
  },

  async deleteColumn(organizationId: string, columnName: string) {
    const { error } = await supabase
      .from('organization_test_statuses')
      .delete()
      .match({ organization_id: organizationId, status: columnName })

    if (error) throw error
  }
} 