import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getConfidenceLevel(confidence: number): { label: string, color: string } {
  if (confidence >= 95) {
    return { label: 'Statistically Significant', color: 'text-green-500' }
  }
  if (confidence >= 90) {
    return { label: 'Partially Significant', color: 'text-yellow-500' }
  }
  return { label: 'Not Significant', color: 'text-muted-foreground' }
}
