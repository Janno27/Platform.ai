"use client"

import { useState } from "react"
import { X, Plus, Search } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface UserManagementProps {
  users: User[]
  onAddUser: (userId: string) => Promise<void>
  onRemoveUser: (userId: string) => Promise<void>
}

export function UserManagement({ users, onAddUser, onRemoveUser }: UserManagementProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Simuler une liste d'utilisateurs disponibles
  const availableUsers: User[] = [
    // ... liste des utilisateurs disponibles
  ]

  const handleAddUser = async (userId: string) => {
    try {
      await onAddUser(userId)
      setOpen(false)
      toast.success("User added successfully")
    } catch (error) {
      toast.error("Failed to add user")
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      await onRemoveUser(userId)
      toast.success("User removed successfully")
    } catch (error) {
      toast.error("Failed to remove user")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {users.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div className="relative group">
                <Avatar className="border-2 border-background">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground">{user.role}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {availableUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleAddUser(user.id)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 