import { Permission } from '@/types/role'
import {
  SquareTerminal,
  BookOpen,
  Settings2,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  LayoutDashboard,
  Database,
} from "lucide-react"

// Définir l'interface pour la navigation
interface NavItem {
  title: string
  url: string
  icon: any
  requiredPermission?: keyof Permission
  items?: NavItem[]
  isActive?: boolean
}

export const navigationConfig = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/overview",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Kanban",
          url: "/overview/kanban",
        },
        {
          title: "Roadmap",
          url: "/overview/roadmap",
        },
      ]
    },
    {
      title: "Playground",
      url: "/playground",
      icon: SquareTerminal,
      items: [
        {
          title: "A/B Initiator",
          url: "/playground/initiator",
          icon: "beaker",
          items: [],
        },
        {
          title: "A/B Analyzer",
          url: "/playground/analyzer",
          icon: "chart",
          items: [],
        },
      ],
    },
    {
      title: "Database",
      url: "/database",
      icon: Database,
    },
    {
      separator: true,
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpen,
      items: [
        {
          title: "Library",
          url: "/documentation/library",
        },
        {
          title: "Best Practices",
          url: "/documentation/practices",
        },
        {
          title: "Templates",
          url: "/documentation/templates",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/projects/design",
      icon: Frame,
      requiredPermission: "test_management"
    },
    {
      name: "Sales & Marketing",
      url: "/projects/sales",
      icon: PieChart,
      requiredPermission: "test_management"
    },
    {
      name: "Travel",
      url: "/projects/travel",
      icon: Map,
      requiredPermission: "test_management"
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      requiredPermission: "settings_management",
      items: [
        {
          title: "Organization",
          url: "/settings/organization",
          requiredPermission: "organization_management"
        },
        {
          title: "Users",
          url: "/settings/users",
          requiredPermission: "user_management"
        }
      ],
    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
    },
  ],
} 