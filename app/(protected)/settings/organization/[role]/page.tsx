// app/(protected)/settings/organization/[role]/page.tsx
import ClientRolePage from './client-page'

export default function RolePage({ 
  params 
}: { 
  params: { role: string } 
}) {
  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto">
      <ClientRolePage role={params.role} />
    </div>
  )
}