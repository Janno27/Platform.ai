// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Page from '@/components/sidebar-08'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from "@/components/ui/tooltip"
import { NextUIProvider } from "@nextui-org/react"
import { ExperimentationProvider } from '@/providers/experimentation-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: 'AB Test Analyzer',
  description: 'Optimize your testing process with confidence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ExperimentationProvider>
            <TooltipProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NextUIProvider>
                  {children}
                </NextUIProvider>
              </ThemeProvider>
            </TooltipProvider>
          </ExperimentationProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
              className: 'border-border',
              success: {
                className: 'border-green-500 bg-green-50 dark:bg-green-950/20',
              },
              error: {
                className: 'border-red-500 bg-red-50 dark:bg-red-950/20',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}