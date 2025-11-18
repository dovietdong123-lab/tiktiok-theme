'use client'

import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import MediaLibrary from './MediaLibrary'

// Import Quill CSS
import 'react-quill/dist/quill.snow.css'

// Dynamic import ReactQuill để tránh SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface ReactQuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function ReactQuillEditor({ value, onChange, placeholder = 'Nhập nội dung...' }: ReactQuillEditorProps) {
  const quillInstanceRef = useRef<any>(null)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [isModulesReady, setIsModulesReady] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [modulesKey, setModulesKey] = useState(0) // Key to force re-render when modules change
  
  // Modules configuration - initialize with imageResize placeholder
  const [modules, setModules] = useState<any>({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          setShowMediaLibrary(true)
        },
      },
    },
  })
  
  // Set mounted and register modules
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    setIsMounted(true)
    
    const registerQuillModules = async () => {
      try {
        // Import quill first
        const QuillModule = await import('quill')
        const Quill = QuillModule.default || QuillModule
        
        if (!Quill) {
          setIsModulesReady(true)
          return
        }
        
        // ✅ Register AlignStyle FIRST - must be before ReactQuill renders
        try {
          const AlignStyle = Quill.import('attributors/style/align')
          Quill.register(AlignStyle, true)
          console.log('✅ AlignStyle registered successfully')
        } catch (alignError) {
          console.warn('⚠️ Failed to register AlignStyle:', alignError)
        }
        
        // Check if imageResize already registered
        const quillAny = Quill as any
        if (quillAny.imports && quillAny.imports['modules/imageResize']) {
          // Already registered, just add to modules
          setModules((prev: any) => ({
            ...prev,
            imageResize: {
              parchment: Quill.import('parchment'),
              modules: ['Resize', 'DisplaySize', 'Toolbar'],
            },
          }))
          setModulesKey(prev => prev + 1) // Force re-render
          setIsModulesReady(true)
          return
        }
        
        // Try to import and register imageResize
        try {
          const ImageResizeModule = await import('quill-image-resize-module-react') as any
          
          // Handle different export formats
          let ImageResize = null
          if (ImageResizeModule.default) {
            ImageResize = ImageResizeModule.default
          } else if (typeof ImageResizeModule === 'function') {
            ImageResize = ImageResizeModule
          } else if (ImageResizeModule.ImageResize) {
            ImageResize = ImageResizeModule.ImageResize
          }
          
          // Check if it's a valid constructor/class
          if (ImageResize && (typeof ImageResize === 'function' || typeof ImageResize === 'object')) {
            Quill.register('modules/imageResize', ImageResize, true)
            console.log('✅ ImageResize module registered successfully')
            
            // Update modules to include imageResize
            setModules((prev: any) => ({
              ...prev,
              imageResize: {
                parchment: Quill.import('parchment'),
                modules: ['Resize', 'DisplaySize', 'Toolbar'],
              },
            }))
            setModulesKey(prev => prev + 1) // Force re-render
          }
        } catch (imageResizeError) {
          console.warn('⚠️ Failed to load imageResize module:', imageResizeError)
        }
        
        setIsModulesReady(true)
      } catch (error) {
        console.error('Failed to load Quill modules:', error)
        setIsModulesReady(true) // Still ready, just without extra modules
      }
    }
    
    registerQuillModules()
  }, [])

  // Get cached Quill instance
  const getQuillInstance = useCallback(() => {
    return quillInstanceRef.current || null
  }, [])

  const cacheQuillInstance = useCallback((quill: any) => {
    if (quill) {
      quillInstanceRef.current = quill
    }
  }, [])

  const handleImageSelect = useCallback((url: string) => {
    setShowMediaLibrary(false)
    
    // Use setTimeout to ensure Quill is ready
    setTimeout(() => {
      const quill = getQuillInstance()
      
      if (quill) {
        try {
          // Get current selection or use end of document
          let range = quill.getSelection(true)
          if (!range) {
            // If no selection, insert at the end
            const length = quill.getLength()
            range = { index: length - 1, length: 0 }
          }
          
          // Insert image
          quill.insertEmbed(range.index, 'image', url, 'user')
          
          // Move cursor after image
          quill.setSelection(range.index + 1, 0)
          
          // Update value - trigger onChange manually
          setTimeout(() => {
            const newContent = quill.root.innerHTML
            onChange(newContent)
          }, 50)
        } catch (error) {
          console.error('Error inserting image:', error)
          // Fallback: insert HTML directly
          const currentContent = value || ''
          const imgTag = `<img src="${url}" alt="" style="max-width: 100%; height: auto;" />`
          onChange(currentContent + imgTag)
        }
      } else {
        console.error('Quill instance not found')
        // Fallback: insert HTML directly
        const currentContent = value || ''
        const imgTag = `<img src="${url}" alt="" style="max-width: 100%; height: auto;" />`
        onChange(currentContent + imgTag)
      }
    }, 150)
  }, [getQuillInstance, onChange, value])


  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'align',
      'link',
      'image',
      'width',
      'height',
    ],
    []
  )

  const handleChange = useCallback(
    (content: string, editorInstance?: any) => {
      // ✅ FIX 3: Get actual HTML from Quill to ensure align styles are included
      // ReactQuill's content parameter may not include align styles
      // Using quill.root.innerHTML ensures we get the full HTML with all styles
      try {
        const quill = editorInstance || getQuillInstance()
        if (quill && quill.root) {
          cacheQuillInstance(quill)
          // Use root.innerHTML to get HTML with all styles (including text-align)
          const actualHTML = quill.root.innerHTML || content
          onChange(actualHTML)
        } else {
          // Fallback to content if Quill instance not available yet
          onChange(content)
        }
      } catch (error) {
        console.warn('Error getting HTML from Quill:', error)
        // Fallback to content
        onChange(content)
      }
    },
    [onChange, getQuillInstance, cacheQuillInstance]
  )

  // Normalize value to always be a string
  const normalizedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return ''
    }
    return String(value)
  }, [value])
  
  // Don't render until mounted and modules ready (client-side only)
  if (!isMounted || !isModulesReady) {
    return (
      <div className="rounded-lg bg-white p-4 border border-gray-300" style={{ minHeight: '200px' }}>
        <p className="text-gray-500">Đang tải editor...</p>
      </div>
    )
  }

  // Render editor with all modules ready
  return (
    <div className="rounded-lg bg-white">
      <ReactQuill
        key={`quill-${modulesKey}`} // Force re-render when modules change
        theme="snow"
        value={normalizedValue}
        onChange={(content, delta, source, editor) => handleChange(content, editor)}
        onFocus={(_range, _source, quill) => cacheQuillInstance(quill)}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight: '200px' }}
        bounds="self"
        preserveWhitespace={true}
      />
      
      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleImageSelect}
          multiple={false}
        />
      )}
    </div>
  )
}

