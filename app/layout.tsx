import './globals.css'

export const metadata = {
  title: 'ValhallaOS - Sales Intelligence',
  description: 'Advanced Sales Performance Tracking System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{children}</body>
    </html>
  )
}
