import type { Metadata } from 'next'
import './globals.css'
import Page from '@/components/sidebar-08'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from "@/components/ui/tooltip"
import dotenv from 'dotenv';
import { NextUIProvider } from "@nextui-org/react"

dotenv.config();

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full">
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextUIProvider>
              <Page>{children}</Page>
            </NextUIProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
