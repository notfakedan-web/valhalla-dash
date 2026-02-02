import './globals.css'

export const metadata = {
  title: 'Valhalla Dashboard',
  description: 'Sales Intelligence Performance Tier 1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505]">{children}</body>
    </html>
  )
}
