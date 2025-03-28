import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: "نظام إدارة جداول العمل",
  description: "تطبيق لإدارة جداول العمل وتنظيم الورديات للموظفين",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cairo.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}



import './globals.css'