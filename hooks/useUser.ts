"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface UserDetails {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: string
  initials?: string
}

interface UseUserReturn {
  user: User | null
  userDetails: UserDetails | null
  isLoading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer la session utilisateur
        const { data: { user }, error: sessionError } = await supabase.auth.getUser()
        if (sessionError) throw sessionError
        
        if (user) {
          // Récupérer les détails de l'utilisateur depuis la table profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (profileError) throw profileError

          // Créer les initiales à partir du nom complet
          const initials = profile.full_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase() || user.email?.[0].toUpperCase() || '?'

          setUser(user)
          setUserDetails({
            id: user.id,
            email: user.email!,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            role: profile.role,
            initials
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'))
        console.error('Error loading user:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        getUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserDetails(null)
      }
    })

    getUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    userDetails,
    isLoading,
    error
  }
} 