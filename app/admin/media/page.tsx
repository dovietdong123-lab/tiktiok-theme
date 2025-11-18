'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import MediaLibrary from '@/components/admin/MediaLibrary'

export default function MediaPage() {
  return (
    <AdminLayout title="Thư viện ảnh">
      <MediaLibrary multiple={true} />
    </AdminLayout>
  )
}

