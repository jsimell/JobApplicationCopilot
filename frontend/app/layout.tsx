import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import appLogo from '@/assets/appLogo.png'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Job Application Copilot - AI Assisted Job Application Tailoring',
  description:
    'Manage a comprehensive career profile and tailor job applications with an AI assistant.',
  icons: {
    icon: appLogo.src,
    apple: appLogo.src,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f8fb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="h-dvh overflow-hidden antialiased">
        {children}
      </body>
    </html>
  )
}
