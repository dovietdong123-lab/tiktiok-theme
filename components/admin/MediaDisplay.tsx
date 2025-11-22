'use client'

interface MediaDisplayProps {
  url: string
  alt?: string
  className?: string
  onMouseEnter?: (e: React.MouseEvent<HTMLVideoElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLVideoElement>) => void
}

export default function MediaDisplay({ url, alt = '', className = '', onMouseEnter, onMouseLeave }: MediaDisplayProps) {
  // Check if URL is a video by extension or mime type
  const isVideo = (url: string): boolean => {
    if (!url) return false
    const lowerUrl = url.toLowerCase()
    
    // Check by file extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.quicktime', '.m4v', '.flv']
    if (videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'))) {
      return true
    }
    
    // Check by URL pattern (common video hosting patterns)
    if (lowerUrl.includes('/video/') || 
        lowerUrl.includes('video/') ||
        lowerUrl.includes('mime_type=video') ||
        lowerUrl.includes('type=video')) {
      return true
    }
    
    return false
  }

  if (isVideo(url)) {
    return (
      <video
        src={url}
        className={className}
        muted
        playsInline
        onMouseEnter={onMouseEnter || ((e) => {
          const video = e.currentTarget
          video.play().catch(() => {})
        })}
        onMouseLeave={onMouseLeave || ((e) => {
          const video = e.currentTarget
          video.pause()
          video.currentTime = 0
        })}
      />
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
    />
  )
}

