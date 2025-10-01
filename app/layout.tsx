import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Secret Scraper",
  description: "From GitHub repos to Product Hunt launches — trends amplified by AI, delivered straight to your CMS.",
  generator: 'Rohan Sharma',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Secret Scraper',
    siteName: 'secret-scraper',
    url: 'https://secret-scraper.vercel.app/',
    description:
      'From GitHub repos to Product Hunt launches — trends amplified by AI, delivered straight to your CMS.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Secret Scraper',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secret Scraper',
    description:
      'From GitHub repos to Product Hunt launches — trends amplified by AI, delivered straight to your CMS.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="flex-1">
            {children}
          </main>
          {/** Dynamically import Footer to avoid SSR issues if any **/}
          {(() => {
            const Footer = require("@/components/footer").Footer;
            return <Footer />;
          })()}
        </ThemeProvider>
      </body>
    </html>
  )
}
