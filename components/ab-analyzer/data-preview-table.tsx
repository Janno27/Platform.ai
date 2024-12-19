"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  EUR: "€",
  USD: "$",
  BRL: "R$",
  GBP: "£",
  JPY: "¥"
}

// Définition des colonnes à afficher pour chaque type
const COLUMNS_CONFIG = {
  transaction: [
    'variation',
    'device_category',
    'transaction_id',
    'item_category2',
    'quantity',
    'products_summary',
    'revenue'
  ],
  overall: [
    'variation',
    'sessions',
    'users',
    'revenue'
  ]
}

interface DataPreviewTableProps {
  data: any[]
  isLoading: boolean
  currency: string
  type: 'overall' | 'transaction'
}

export function DataPreviewTable({ data, isLoading, currency, type }: DataPreviewTableProps) {
  if (isLoading) {
    return <div>Chargement des données...</div>
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">Aucune donnée disponible</div>
  }

  // Filtrer les données pour n'avoir qu'une ligne par variation
  const filteredData = Object.values(data.reduce((acc: { [key: string]: any }, curr) => {
    if (curr.variation && !acc[curr.variation]) {
      acc[curr.variation] = curr
    }
    return acc
  }, {})).slice(0, 3)

  // Si aucune variation n'est trouvée, on prend les 3 premières lignes
  const finalData = filteredData.length > 0 ? filteredData : data.slice(0, 3)

  // Sélectionner les colonnes selon le type
  const selectedColumns = COLUMNS_CONFIG[type]

  const formatValue = (value: any, column: string) => {
    if (!value) return '-'

    if (column === 'transaction_id') {
      return value.toString().slice(0, 11) + (value.length > 11 ? '...' : '')
    }
    if (column === 'products_summary') {
      return value
    }
    if (column === 'quantity') {
      return parseInt(value).toLocaleString()
    }
    if (column.toLowerCase().includes('revenue')) {
      const symbol = CURRENCY_SYMBOLS[currency] || currency
      return `${symbol}${value?.toLocaleString()}`
    }
    if (column === 'variation') {
      return value.toString().toUpperCase()
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    if (column === 'item_category2') {
      const text = value.toString()
      return text.length > 15 ? `${text.slice(0, 15)}...` : text
    }
    return value.toString()
  }

  // Fonction pour obtenir le titre formaté de la colonne
  const getColumnTitle = (column: string) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Ajoutez ces styles à la cellule pour la colonne item_name_simple
  const getCellStyle = (columnName: string) => {
    if (columnName === 'item_category2') {
      return 'max-w-[150px] truncate'
    }
    return ''
  }

  return (
    <div className="relative w-full">
      <ScrollArea className="w-full rounded-md border">
        <div className="relative min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                {selectedColumns.map((column) => (
                  <TableHead 
                    key={column} 
                    className={cn(
                      "whitespace-nowrap px-4",
                      column === 'variation' && "font-semibold sticky left-0 bg-background z-10",
                      getCellStyle(column)
                    )}
                  >
                    {getColumnTitle(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalData.map((row, index) => (
                <TableRow key={index}>
                  {selectedColumns.map((column) => (
                    <TableCell 
                      key={column}
                      className={cn(
                        "px-4",
                        column === 'variation' && "font-medium sticky left-0 bg-background z-10",
                        column === 'transaction_id' && "font-mono text-sm",
                        getCellStyle(column)
                      )}
                      title={column === 'item_name_simple' ? row[column] : undefined}
                    >
                      {formatValue(row[column], column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
} 