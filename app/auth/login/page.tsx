// app/auth/login/page.tsx
import { Metadata } from 'next'
import AuthForm from '@/components/auth/authentification'

export const metadata: Metadata = {
  title: 'Login - AB Test Analyzer',
  description: 'Sign in to AB Test Analyzer to manage and analyze your A/B tests effectively',
}

export default function LoginPage() {
  return <AuthForm />
}