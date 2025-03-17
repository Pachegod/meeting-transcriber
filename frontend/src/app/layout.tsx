import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meeting Transcriber - Transcrição e Análise de Reuniões',
  description: 'Plataforma para gravação, transcrição e análise de reuniões com integração ao RD Station.',
  keywords: 'transcrição, reuniões, análise, gravação, RD Station, português brasileiro',
  authors: [{ name: 'Meeting Transcriber Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm">
            <div className="container mx-auto">
              <p>© {new Date().getFullYear()} Meeting Transcriber. Todos os direitos reservados.</p>
            </div>
          </footer>
        </ErrorBoundary>
      </body>
    </html>
  )
}