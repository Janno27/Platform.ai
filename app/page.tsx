// app/page.tsx
import { redirect } from 'next/navigation'

export default async function Home() {
  // Ici, vous pouvez ajouter la logique pour vérifier l'authentification
  const isAuthenticated = false // À implémenter avec votre logique d'auth

  if (!isAuthenticated) {
    redirect('/auth/login')
  }

  return redirect('/dashboard')
}