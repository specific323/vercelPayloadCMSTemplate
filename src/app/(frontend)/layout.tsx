import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Vercel Payload Neon',
    default: 'Vercel Payload Neon',
  },
  description: 'A PayloadCMS + Next.js + Vercel Neon example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
            Payload + Neon
          </a>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={{ textDecoration: 'none', color: '#4b5563' }}>首頁</a>
            <a href="/posts" style={{ textDecoration: 'none', color: '#4b5563' }}>文章</a>
            <a href="/admin" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 500 }}>管理後台 →</a>
          </nav>
        </header>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          {children}
        </main>
        <footer style={{ borderTop: '1px solid #e5e7eb', padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          Built with PayloadCMS + Next.js + Vercel Neon
        </footer>
      </body>
    </html>
  )
}
