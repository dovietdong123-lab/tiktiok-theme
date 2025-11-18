import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TikTiok Shop ok',
  description: 'E-commerce shop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white w-full relative">
        <div className="w-full max-w-[500px] mx-auto relative">
          {children}
        </div>
      </body>
    </html>
  )
}

