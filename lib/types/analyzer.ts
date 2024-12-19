// Types de base pour les données
export interface OverallData {
  variation: string
  users: number
  user_add_to_carts: number
  [key: string]: any  // Pour permettre des métriques supplémentaires
}

export interface TransactionData {
  transaction_id: string
  variation: string
  revenue: number
  quantity: number
  item_name_simple?: string
  item_category2?: string
  device_category?: string
  [key: string]: any  // Pour permettre des champs supplémentaires
}

// Types pour les filtres
export interface AnalyzerFilters {
  device_category?: string[]
  item_category2?: string[]
  [key: string]: string[] | undefined  // Pour permettre des filtres supplémentaires
}

// Types pour les résultats
export interface MetricResult {
  value: number
  uplift?: number
  confidence?: number
}

export interface AnalysisResult {
  users: MetricResult
  add_to_cart_rate: MetricResult
  transaction_rate: MetricResult
  revenue: MetricResult
  highest_transaction?: TransactionDetail
  lowest_transaction?: TransactionDetail
  [key: string]: MetricResult | TransactionDetail | undefined  // Pour des métriques supplémentaires
}

export interface TransactionDetail {
  transaction_id: string
  revenue: number
  quantity: number
  main_product?: string
  item_categories?: string[]
} 