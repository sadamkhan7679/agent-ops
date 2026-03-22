import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { cn } from "@/lib/utils"
import { APP_DATA } from "@/data/app.data"
import { createMetadata } from "@/lib/seo"
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c111d" },
  ],
}

export const metadata: Metadata = {
  ...createMetadata(),
  title: {
    default: APP_DATA.appName,
    template: `%s | ${APP_DATA.appName}`,
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>

        {process.env.NODE_ENV === "production" && (
          <>
            <GoogleAnalytics
              gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!}
            />
            <GoogleTagManager
              gtmId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!}
            />
          </>
        )}
      </body>
    </html>
  )
}
