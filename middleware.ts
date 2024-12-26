// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth-service'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Vérifier l'authentification
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    // Récupérer l'organization_id depuis un cookie ou une autre source
    const organizationId = request.cookies.get('organizationId')?.value

    if (organizationId) {
      // Synchroniser l'utilisateur si nécessaire
      await AuthService.syncUser(session.user.id, organizationId)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}