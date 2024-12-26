// app/root-layout-client.tsx
'use client'

import Page from '@/components/sidebar-08'
import { usePathname } from 'next/navigation'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    return children
  }

  return <Page>{children}</Page>
}