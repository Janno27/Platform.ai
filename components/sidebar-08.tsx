"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Command,
  CreditCard,
  Folder,
  Frame,
  LifeBuoy,
  LogOut,
  Map,
  MoreHorizontal,
  PieChart,
  Send,
  Settings2,
  Share,
  Sparkles,
  SquareTerminal,
  Trash2,
  Building2,
  Users2,
  Shield,
  ArrowLeft,
  Search,
  Plus,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { navigationConfig } from "@/lib/config/navigation"
import { useNavigationPath } from "@/hooks/useNavigationPath"
import * as React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useExperimentation } from '@/providers/experimentation-provider'
import { ABTestService } from '@/lib/services'
import { useToast } from "@/components/ui/use-toast"
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/hooks/useAuth'
import type { ABTestSummary } from '@/types/ab-test'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { usePermissions } from '@/hooks/usePermissions'
import type { NavItem } from '@/lib/config/navigation'
import { RequirePermission } from '@/components/auth/require-permission'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const settingsNavigation = {
  title: "Settings",
  icon: Settings2,
  url: "/settings",
  requiredPermission: "settings_management",
  items: [
    {
      title: "Organization",
      icon: Building2,
      items: [
        {
          title: "Super Admin Management",
          url: "/settings/organization/super-admin",
          requiredPermission: "organization_management"
        },
        {
          title: "Admin Management",
          url: "/settings/organization/admin",
          requiredPermission: "organization_management"
        },
        {
          title: "User Management",
          url: "/settings/organization/users",
          requiredPermission: "user_management"
        }
      ]
    }
  ]
}

export default function Page({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isInitiator = pathname.includes("/playground/initiator")
  const data = navigationConfig
  const breadcrumbs = useNavigationPath()
  const { isExperimentationSummaryVisible, formData, isDirty, setIsDirty } = useExperimentation()
  const { organization } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { checkPermission } = usePermissions()
  const isKanbanPage = pathname.includes('/overview/kanban')
  const [isSearchFocused, setIsSearchFocused] = React.useState(false)

  console.log('Current organization:', organization)
  console.log('Experimentation visible:', isExperimentationSummaryVisible)
  console.log('Form data:', formData)

  const [openMenus, setOpenMenus] = React.useState<{ [key: string]: boolean }>({})

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault()
    router.push(url)
  }

  const handleSave = async () => {
    try {
      if (!organization?.id) {
        toast({ title: "Error", description: "No organization found" })
        return
      }

      if (!user?.id) {
        toast({ title: "Error", description: "No user found" })
        return
      }

      const result = await ABTestService.createOrUpdate({
        ...formData,
        organization_id: organization.id,
        owner_id: user.id,
        created_by: user.id,
        last_modified_by: user.id,
        status: 'draft',
      } as ABTestSummary)

      setIsDirty(false)
      toast({ title: "Success", description: "Test saved as draft" })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save test",
        variant: "destructive"
      })
    }
  }

  const handleValidate = async () => {
    try {
      if (!organization?.id) {
        toast({ title: "Error", description: "No organization found" })
        return
      }

      if (!user?.id) {
        toast({ title: "Error", description: "No user found" })
        return
      }

      const result = await ABTestService.createOrUpdate({
        ...formData,
        organization_id: organization.id,
        owner_id: user.id,
        created_by: user.id,
        last_modified_by: user.id,
        status: 'ready',
      } as ABTestSummary)

      setIsDirty(false)
      toast({ title: "Success", description: "Test validated successfully" })
      router.push('/dashboard')
    } catch (error) {
      console.error('Validation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to validate test",
        variant: "destructive"
      })
    }
  }

  const handleReset = () => {
    setIsExperimentationSummaryVisible(false)
  }

  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.requiredPermission || checkPermission(item.requiredPermission)) {
        if (item.items) {
          item.items = filterNavItems(item.items)
        }
        return true
      }
      return false
    })
  }

  const filteredProjects = data.projects.filter(project => 
    !project.requiredPermission || checkPermission(project.requiredPermission)
  )

  const renderNavItem = (item: NavItem, index?: number) => {
    const content = item.separator ? (
      <Separator key={`sep-${index}`} className="my-4" />
    ) : (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={item.isActive}
        open={openMenus[item.title]}
        onOpenChange={(open) => {
          setOpenMenus(prev => ({
            ...prev,
            [item.title]: open
          }))
        }}
      >
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={item.title}>
            <a 
              href={item.url}
              onClick={(e) => handleNavigation(e, item.url)}
            >
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
          {item.items?.length ? (
            <>
              <CollapsibleTrigger asChild>
                <SidebarMenuAction className="data-[state=open]:rotate-90">
                  <ChevronRight />
                  <span className="sr-only">Toggle</span>
                </SidebarMenuAction>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a 
                          href={subItem.url}
                          onClick={(e) => handleNavigation(e, subItem.url)}
                        >
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </>
          ) : null}
        </SidebarMenuItem>
      </Collapsible>
    );

    return item.requiredPermission ? (
      <RequirePermission 
        key={item.title} 
        permission={item.requiredPermission}
        fallback={null}
      >
        {content}
      </RequirePermission>
    ) : content;
  };

  const renderProjectItem = (item: typeof data.projects[0]) => {
    const content = (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild>
          <a href={item.url}>
            <item.icon />
            <span>{item.name}</span>
          </a>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <MoreHorizontal />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48"
            side="bottom"
            align="end"
          >
            <DropdownMenuItem>
              <Folder className="text-muted-foreground" />
              <span>View Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="text-muted-foreground" />
              <span>Share Project</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Trash2 className="text-muted-foreground" />
              <span>Delete Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );

    return item.requiredPermission ? (
      <RequirePermission 
        key={item.name}
        permission={item.requiredPermission}
        fallback={null}
      >
        {content}
      </RequirePermission>
    ) : content;
  };

  const isSettingsPage = pathname.startsWith('/settings')

  const renderNavigation = () => {
    if (isSettingsPage) {
      return (
        <>
          <SidebarHeader>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push('/overview')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenu>
                {settingsNavigation.items.map((section) => (
                  <Collapsible
                    key={section.title}
                    open={openMenus[section.title]}
                    onOpenChange={(open) => {
                      setOpenMenus(prev => ({
                        ...prev,
                        [section.title]: open
                      }))
                    }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip={section.title}>
                        <section.icon className="h-4 w-4" />
                        <span>{section.title}</span>
                      </SidebarMenuButton>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="data-[state=open]:rotate-90">
                          <ChevronRight className="h-4 w-4" />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {section.items.map((item) => (
                            (!item.requiredPermission || checkPermission(item.requiredPermission)) && (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton
                                  onClick={() => router.push(item.url)}
                                  className={pathname === item.url ? "bg-accent" : ""}
                                >
                                  <span>{item.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </>
      )
    }

    return (
      <>
        <SidebarHeader>
          <div className="flex items-center justify-between px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Acme Inc</span>
                      <span className="truncate text-xs">Enterprise</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <ThemeToggle />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Experimentation</SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item, index) => renderNavItem(item, index))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              {filteredProjects.map(renderProjectItem)}
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MoreHorizontal />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild size="sm">
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={data.user.avatar}
                        alt={data.user.name}
                      />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs">
                        {data.user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={data.user.avatar}
                          alt={data.user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          CN
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {data.user.name}
                        </span>
                        <span className="truncate text-xs">
                          {data.user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Sparkles />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/settings/organization')}>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Organization
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    try {
                      await supabase.auth.signOut()
                      router.push('/auth/login')
                    } catch (error) {
                      console.error('Error signing out:', error)
                      toast({
                        title: "Error",
                        description: "An error occurred while signing out.",
                        variant: "destructive"
                      })
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="z-40">
        {renderNavigation()}
      </Sidebar>
      <SidebarInset className="z-40">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 px-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
            </div>

            <div className="flex items-center justify-between flex-1 gap-4">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item.url}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{item.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.url}>
                            {item.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              {isKanbanPage && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 text-xs font-medium",
                      "hover:bg-transparent hover:text-foreground/80",
                      "hover:[text-shadow:0_0_10px_rgba(0,0,0,0.2)]",
                      "dark:hover:[text-shadow:0_0_10px_rgba(255,255,255,0.2)]",
                      "transition-all duration-200"
                    )}
                    onClick={() => router.push('/playground/initiator')}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Experimentation
                  </Button>
                  <div className={cn(
                    "relative transition-all duration-200",
                    isSearchFocused ? "w-[300px]" : "w-[200px]"
                  )}>
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      className={cn(
                        "pl-8 h-9 bg-muted/40 border-muted",
                        "focus:bg-background focus:border-input",
                        "transition-all duration-200"
                      )}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      onChange={(e) => {
                        window.dispatchEvent(
                          new CustomEvent('kanban-search', { 
                            detail: e.target.value 
                          })
                        )
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {isExperimentationSummaryVisible && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="rounded-full hover:underline hover:bg-transparent"
                onClick={handleReset}
                disabled={!isDirty}
              >
                Reset
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full border hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black"
                onClick={handleSave}
                disabled={!isDirty}
              >
                Save
              </Button>
              <Button 
                variant="default" 
                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleValidate}
                disabled={!isDirty}
              >
                Validate
              </Button>
            </div>
          )}
        </header>
        <div className="flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}