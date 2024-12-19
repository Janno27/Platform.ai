"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings2, ArrowRight, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Range {
  min: number
  max: number
}

interface RangeConfigModalProps {
  onSave: (ranges: Range[]) => void
}

export function RangeConfigModal({ onSave }: RangeConfigModalProps) {
  const [open, setOpen] = React.useState(false)
  const [ranges, setRanges] = React.useState<Range[]>([
    { min: 0, max: 2000 },
    { min: 2001, max: 3000 },
    { min: 3001, max: 4000 },
    { min: 4001, max: 5000 },
    { min: 5001, max: Infinity }
  ])
  const [errors, setErrors] = React.useState<{[key: string]: string}>({})

  const validateRanges = (newRanges: Range[]): boolean => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    newRanges.forEach((range, index) => {
      if (range.max <= range.min) {
        newErrors[`range-${index}`] = "Max value must be greater than min value"
        isValid = false
      }
      if (index > 0 && range.min !== newRanges[index - 1].max + 1) {
        newErrors[`range-${index}`] = "Ranges must be continuous"
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleMaxChange = (index: number, value: string) => {
    const newValue = parseInt(value)
    if (isNaN(newValue)) return

    const newRanges = [...ranges]
    newRanges[index] = { ...newRanges[index], max: newValue }
    
    if (index < newRanges.length - 1) {
      newRanges[index + 1] = { ...newRanges[index + 1], min: newValue + 1 }
    }

    setRanges(newRanges)
    validateRanges(newRanges)
  }

  const handleSave = () => {
    if (validateRanges(ranges)) {
      onSave(ranges)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Revenue Range Configuration</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure the revenue ranges for analysis. Ranges must be continuous and non-overlapping.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6 py-4">
            {ranges.map((range, index) => (
              <div key={index} className="relative">
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border bg-card",
                  errors[`range-${index}`] && "border-destructive"
                )}>
                  <Badge variant="outline" className="h-7 px-3 shrink-0">
                    Range {index + 1}
                  </Badge>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1.5">
                        Min Value (€)
                      </Label>
                      <Input
                        type="number"
                        value={range.min}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-6" />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1.5">
                        Max Value (€)
                      </Label>
                      <Input
                        type="number"
                        value={range.max === Infinity ? "∞" : range.max}
                        onChange={(e) => handleMaxChange(index, e.target.value)}
                        disabled={index === ranges.length - 1}
                        className={cn(
                          index === ranges.length - 1 && "bg-muted/50",
                          errors[`range-${index}`] && "border-destructive"
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {errors[`range-${index}`] && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors[`range-${index}`]}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}