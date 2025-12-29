import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Header } from '@/components/shared/Header'
import { RoleProvider } from '@/contexts/RoleContext'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: 'ePower BPM',
  description: 'Business Process Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <TooltipProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </TooltipProvider>
        </RoleProvider>
      </body>
    </html>
  )
}
