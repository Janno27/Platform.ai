import { OverallData, TransactionData, AnalyzerFilters, AnalysisResult } from '../types/analyzer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AnalyzerResponse {
  success: boolean;
  data: {
    overall: AnalysisResult;
    transaction: {
      [key: string]: any;
    };
  };
  error?: string;
}

export class AnalyzerService {
  static async analyzeData(
    overallData: OverallData[],
    transactionData: TransactionData[],
    filters?: AnalyzerFilters,
    currency: string = 'EUR'
  ): Promise<AnalyzerResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overall_data: overallData,
          transaction_data: transactionData,
          filters,
          currency,
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Error analyzing data:', error)
      throw error
    }
  }
} 