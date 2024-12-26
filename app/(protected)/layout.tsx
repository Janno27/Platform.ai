// app/(protected)/layout.tsx
import Page from '@/components/sidebar-08'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Page>{children}</Page>
}