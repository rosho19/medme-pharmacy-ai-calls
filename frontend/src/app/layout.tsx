import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Specialty Pharmacies - AI Call Tool',
  description: 'AI-powered voice calling tool for specialty pharmacies to streamline patient outreach and delivery coordination.',
  keywords: ['specialty pharmacy', 'ai', 'voice calls', 'healthcare', 'patient communication'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
