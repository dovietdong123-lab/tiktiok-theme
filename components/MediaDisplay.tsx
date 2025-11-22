'use client'

import { useMemo } from 'react'

interface MediaDisplayProps {
  url: string
  alt?: string
  className?: string
  onMouseEnter?: (e: React.MouseEvent<HTMLVideoElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLVideoElement>) => void
  controls?: boolean // For video controls
  autoPlay?: boolean // For video autoplay on hover
}

// Helper function to check if URL is a video (moved outside component for performance)
function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return false
  
  const lowerUrl = trimmedUrl.toLowerCase()
  
  // Check by file extension (more precise check first)
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.quicktime', '.m4v', '.flv']
  const hasVideoExtension = videoExtensions.some(ext => {
    // Check if URL ends with extension or has extension before query params
    return lowerUrl.endsWith(ext) || 
           lowerUrl.includes(ext + '?') || 
           lowerUrl.includes(ext + '&') ||
           lowerUrl.includes(ext + '#')
  })
  
  if (hasVideoExtension) return true
  
  // Check by URL pattern (common video hosting patterns)
  const videoPatterns = ['/video/', 'video/', 'mime_type=video', 'type=video', 'content-type=video']
  return videoPatterns.some(pattern => lowerUrl.includes(pattern))
}

export default function MediaDisplay({ 
  url, 
  alt = '', 
  className = '', 
  onMouseEnter, 
  onMouseLeave,
  controls = false,
  autoPlay = true
}: MediaDisplayProps) {
  // Memoize video check to avoid recalculating on every render
  const isVideo = useMemo(() => isVideoUrl(url), [url])
  
  // Validate URL format
  const isValidUrl = useMemo(() => {
    if (!url || typeof url !== 'string') return false
    try {
      // Basic URL validation - allow relative URLs and absolute URLs
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return true
      }
      // Allow blob URLs
      if (url.startsWith('blob:')) {
        return true
      }
      return false
    } catch {
      return false
    }
  }, [url])
  
  if (!isValidUrl) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <span className="text-xs text-gray-500">Invalid URL</span>
      </div>
    )
  }
  
  if (isVideo) {
    return (
      <video
        src={url}
        className={className}
        muted
        playsInline
        controls={controls}
        preload="metadata"
        onMouseEnter={autoPlay ? (onMouseEnter || ((e) => {
          const video = e.currentTarget
          video.play().catch(() => {
            // Silently fail if autoplay is blocked
          })
        })) : undefined}
        onMouseLeave={autoPlay ? (onMouseLeave || ((e) => {
          const video = e.currentTarget
          video.pause()
          video.currentTime = 0
        })) : undefined}
        onError={(e) => {
          // Handle video load errors gracefully
          console.warn('Video failed to load:', url)
        }}
      />
    )
  }

  return (
    <img
      src={url}
      alt={alt || ''}
      className={className}
      onError={(e) => {
        // Handle image load errors gracefully
        const target = e.currentTarget as HTMLImageElement
        target.style.display = 'none'
      }}
      loading="lazy"
    />
  )
}

