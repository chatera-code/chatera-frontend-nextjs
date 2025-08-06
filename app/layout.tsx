import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimized font import as per Next.js best practices
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Modern RAG App',
  description: 'A sleek, modern UI for a RAG-based chat application.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}