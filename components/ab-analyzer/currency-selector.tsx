"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  EUR: "€",
  USD: "$",
  BRL: "R$",
  GBP: "£",
  JPY: "¥"
}

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
          <SelectItem key={code} value={code}>
            {code} ({symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 