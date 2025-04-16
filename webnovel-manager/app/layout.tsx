import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { QueryClientProvider } from "@/components/providers/query-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  title: "WebNovel Manager",
  description: "Manage and track your favorite webnovels and manhwas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WebNovel Manager",
  },
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        <link rel="icon" type="image/png" href="/placeholder-logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <QueryClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}


import './globals.css'