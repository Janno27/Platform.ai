// hooks/useProtectedNavigation.ts
import { usePermissions } from './usePermissions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useProtectedNavigation() {
  const { checkPermission } = usePermissions()
  const router = useRouter()

  const navigateWithPermission = (path: string, requiredPermission: keyof Permission) => {
    if (checkPermission(requiredPermission)) {
      router.push(path)
    } else {
      toast.error("Access Denied", {
        description: "You don't have permission to access this resource"
      })
    }
  }

  return { navigateWithPermission }
}