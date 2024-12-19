import { url } from "inspector"
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
  KanbanSquare,
  GitFork,
  Database,
} from "lucide-react"

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
    },
    {
      name: "Sales & Marketing",
      url: "/projects/sales",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "/projects/travel",
      icon: Map,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
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