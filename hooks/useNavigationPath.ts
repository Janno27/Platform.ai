import { usePathname } from 'next/navigation'
import { navigationConfig } from '@/lib/config/navigation'

type NavigationItem = {
  title: string
  url: string
  items?: NavigationItem[]
}

export function useNavigationPath() {
  const pathname = usePathname()
  
  const findNavigationItem = (
    items: NavigationItem[],
    path: string,
    breadcrumb: { title: string; url: string }[] = []
  ): { title: string; url: string }[] => {
    for (const item of items) {
      if (item.url === path) {
        return [...breadcrumb, { title: item.title, url: item.url }]
      }
      
      if (path.startsWith(item.url) && item.items) {
        const newBreadcrumb = [...breadcrumb, { title: item.title, url: item.url }]
        const result = findNavigationItem(item.items, path, newBreadcrumb)
        if (result.length) return result
      }
    }
    return breadcrumb
  }

  const breadcrumbs = findNavigationItem(navigationConfig.navMain, pathname)
  
  return breadcrumbs
} 