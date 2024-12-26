// lib/services/auth-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export interface SignUpData {
  email: string
  password: string
  name: string
  organizationName?: string
  hasOrganization?: boolean
}

export type AccountType = 'individual' | 'business'

export const AuthService = {
  async signUp({ 
    email, 
    password, 
    name, 
    organizationName, 
    hasOrganization = false 
  }: SignUpData) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // Déterminer le type de compte
      const accountType = organizationName ? 'business' : 'individual'

      // Créer l'utilisateur avec les metadata appropriées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            organizationName,
            accountType // Ajout explicite du type de compte
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user data returned')

      return { success: true, data: authData, accountType }

    } catch (error: any) {
      console.error('Error in signUp:', error)
      throw error
    }
  },

  async signIn(email: string, password: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data

    } catch (error) {
      console.error('Error in signIn:', error)
      throw error
    }
  },

  async signOut() {
    const supabase = createClientComponentClient<Database>()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  },

  async resetPassword(email: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (error) {
      console.error('Error in resetPassword:', error)
      throw error
    }
  },

  async resendVerificationEmail(email: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error in resendVerificationEmail:', error)
      throw error
    }
  },

  async updateUser(data: { password?: string, email?: string, data?: Record<string, any> }) {
    const supabase = createClientComponentClient<Database>()
    try {
      const { error } = await supabase.auth.updateUser(data)
      if (error) throw error
    } catch (error) {
      console.error('Error in updateUser:', error)
      throw error
    }
  },

  async getSession() {
    const supabase = createClientComponentClient<Database>()
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error in getSession:', error)
      throw error
    }
  },

  onAuthStateChange(callback: (event: { user: any | null, loading: boolean, error: Error | null }) => void) {
    const supabase = createClientComponentClient<Database>()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback({
        user: session?.user || null,
        loading: false,
        error: null
      })
    })
  }
}