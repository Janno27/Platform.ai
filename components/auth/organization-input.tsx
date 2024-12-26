// components/auth/organization-input.tsx
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AuthService } from '@/lib/services/auth-service'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrganizationInputProps {
  value: string
  onChange: (value: string) => void
}

export function OrganizationInput({ value, onChange }: OrganizationInputProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (value.length > 2) {
      AuthService.suggestOrganizations(value).then(setSuggestions)
    }
  }, [value])

  return (
    <div className="space-y-2">
      <Label htmlFor="organization">Organization Name (Optional)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            id="organization"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your company name"
          />
        </PopoverTrigger>
        {suggestions.length > 0 && (
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((org) => (
                  <CommandItem
                    key={org}
                    onSelect={() => {
                      onChange(org)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === org ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {org}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}