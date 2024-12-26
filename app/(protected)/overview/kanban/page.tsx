"use client"

import { KanbanBoard } from "@/components/kanban/kanban-board"
import { useOrganization } from "@/hooks/useOrganization"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function KanbanPage() {
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])

  useEffect(() => {
    if (organization?.id) {
      loadData()
    }
  }, [organization?.id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Charger les tests
      const { data: testsData, error: testsError } = await supabase
        .from('ab_tests_summary')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })

      if (testsError) throw testsError

      // Extraire les statuts uniques
      const uniqueStatuses = [...new Set(testsData.map(test => test.status))]
      
      setTests(testsData)
      setColumns(uniqueStatuses)
    } catch (error) {
      console.error('Error loading kanban data:', error)
      toast.error('Failed to load kanban data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleColumnAdd = async (columnName: string) => {
    try {
      setColumns(prev => [...prev, columnName])
      toast.success('Column added successfully')
    } catch (error) {
      console.error('Error adding column:', error)
      toast.error('Failed to add column')
    }
  }

  const handleColumnDelete = async (columnName: string) => {
    try {
      setColumns(prev => prev.filter(col => col !== columnName))
      toast.success('Column deleted successfully')
    } catch (error) {
      console.error('Error deleting column:', error)
      toast.error('Failed to delete column')
    }
  }

  const handleColumnReorder = async (newOrder: string[]) => {
    try {
      setColumns(newOrder)
      toast.success('Columns reordered successfully')
    } catch (error) {
      console.error('Error reordering columns:', error)
      toast.error('Failed to reorder columns')
    }
  }

  const handleCardMove = async (testId: string, newStatus: string) => {
    try {
      // Mettre à jour le statut dans Supabase
      const { error } = await supabase
        .from('ab_tests_summary')
        .update({ status: newStatus })
        .eq('id', testId)

      if (error) throw error

      // Mettre à jour l'état local
      setTests(prev => 
        prev.map(test => 
          test.id === testId ? { ...test, status: newStatus } : test
        )
      )

      toast.success('Test status updated successfully')
    } catch (error) {
      console.error('Error moving card:', error)
      toast.error('Failed to update test status')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6">
      <KanbanBoard
        tests={tests}
        columns={columns}
        onColumnAdd={handleColumnAdd}
        onColumnDelete={handleColumnDelete}
        onColumnReorder={handleColumnReorder}
        onCardMove={handleCardMove}
      />
    </div>
  )
} 