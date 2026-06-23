import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import React from 'react'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Infinite Agent',
  description: 'AI Agent powered by SiliconFlow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${geist.className} bg-background text-foreground antialiased`}>
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  )
}
