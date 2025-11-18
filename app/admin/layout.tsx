export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-50" style={{ margin: 0, maxWidth: 'none' }}>
      {children}
    </div>
  )
}

