'use client'

import { useState, useEffect, useRef } from 'react'

interface MediaItem {
  id: number
  filename: string
  original_name: string
  url: string
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  alt_text: string | null
  folder_id: number | null
  created_at: string
}

interface Folder {
  id: number
  name: string
  parent_id: number | null
  media_count: number
  created_at: string
}

interface MediaLibraryProps {
  onSelect?: (url: string) => void
  onSelectMultiple?: (urls: string[]) => void
  isOpen?: boolean
  onClose?: () => void
  multiple?: boolean
}

export default function MediaLibrary({ onSelect, onSelectMultiple, isOpen = true, onClose, multiple = false }: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadFolders()
      loadMedia()
      if (!multiple) {
        setSelectedUrls([])
      }
    }
  }, [isOpen, currentFolderId, multiple])

  // Auto load when component mounts (for standalone page)
  useEffect(() => {
    if (isOpen) {
      loadFolders()
      loadMedia()
    }
  }, [])

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/media/folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setFolders(data.data)
      }
    } catch (err: any) {
      console.error('Error loading folders:', err)
    }
  }

  const loadMedia = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const url = currentFolderId
        ? `/api/admin/media?folder_id=${currentFolderId}`
        : '/api/admin/media'
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setMedia(data.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem('admin_token')
      const formData = new FormData()
      formData.append('file', file)
      if (currentFolderId) {
        formData.append('folder_id', currentFolderId.toString())
      }

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        loadMedia()
        loadFolders()
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'Upload error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        loadMedia()
        loadFolders()
      } else {
        alert('Lỗi: ' + data.error)
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    }
  }

  const handleCreateFolder = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!newFolderName.trim()) {
      setError('Vui lòng nhập tên thư mục')
      return
    }

    setCreatingFolder(true)
    setError(null)

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: currentFolderId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNewFolderName('')
        setShowCreateFolder(false)
        setError(null)
        await loadFolders()
      } else {
        setError(data.error || 'Tạo thư mục thất bại')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo thư mục')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa thư mục này? Tất cả ảnh trong thư mục sẽ được chuyển về thư mục gốc.')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/media/folders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        if (currentFolderId === id) {
          setCurrentFolderId(null)
        }
        loadFolders()
        loadMedia()
      } else {
        alert('Lỗi: ' + data.error)
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    }
  }

  // Only return null if explicitly closed (for modal mode)
  // For standalone page, isOpen defaults to true
  if (isOpen === false) return null

  // Check if this is modal mode (has onClose callback) or standalone page
  const isModalMode = !!onClose

  return (
    <div className={isModalMode ? "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" : "w-full h-full"}>
      <div className={`bg-white ${isModalMode ? 'rounded-lg shadow-xl max-w-7xl max-h-[90vh]' : ''} w-full flex flex-col ${isModalMode ? '' : 'h-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Thư viện ảnh</h2>
            {currentFolderId && (
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Về thư mục gốc
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📁 Tạo thư mục
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                uploading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Đang upload...' : '📤 Upload ảnh'}
            </label>
            {multiple && selectedUrls.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectMultiple) {
                    onSelectMultiple(selectedUrls)
                  }
                  if (onClose) {
                    onClose()
                  }
                  setSelectedUrls([])
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ✓ Chọn {selectedUrls.length} ảnh
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onClose) {
                  onClose()
                }
                setSelectedUrls([])
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ✕ Đóng
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateFolder(false)
                setNewFolderName('')
                setError(null)
              }
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Tạo thư mục mới</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCreateFolder(e)
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCreateFolder(false)
                    setNewFolderName('')
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateFolder(e)}
                  disabled={creatingFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingFolder ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Folders */}
          <div className="w-64 border-r overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Thư mục</h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  currentFolderId === null
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📂 Tất cả ảnh
              </button>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition group ${
                    currentFolderId === folder.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="flex-1 text-left flex items-center gap-2"
                  >
                    <span>📁</span>
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-gray-500">({folder.media_count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteFolder(folder.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Media Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {currentFolderId ? 'Thư mục này chưa có ảnh nào.' : 'Chưa có ảnh nào. Hãy upload ảnh đầu tiên!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.map((item) => {
                  const isSelected = selectedUrls.includes(item.url)
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative ${
                        multiple && isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (multiple) {
                          // Toggle selection
                          if (isSelected) {
                            setSelectedUrls(selectedUrls.filter((url) => url !== item.url))
                          } else {
                            setSelectedUrls([...selectedUrls, item.url])
                          }
                        } else {
                          // Single select - close immediately (if callbacks provided)
                          if (onSelect) {
                            onSelect(item.url)
                          }
                          if (onClose) {
                            onClose()
                          }
                        }
                      }}
                    >
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={item.url}
                          alt={item.alt_text || item.original_name}
                          className="w-full h-full object-cover"
                        />
                        {multiple && isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                            {multiple ? (isSelected ? 'Bỏ chọn' : 'Chọn') : 'Chọn'}
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate" title={item.original_name}>
                          {item.original_name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                          className="mt-1 text-xs text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
