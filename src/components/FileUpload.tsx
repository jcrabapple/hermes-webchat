import { useState, useRef } from 'react'
import { Paperclip } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div 
      className={`relative ${isDragging ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*,text/*,application/pdf"
      />
      <button
        type="button"
        onClick={() => fileInputRef?.current?.click()}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        aria-label="Attach file"
      >
        <Paperclip size={20} />
      </button>
      
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 border-2 border-dashed border-blue-500 rounded-lg">
          <p className="text-blue-700 dark:text-blue-300">Drop file here</p>
        </div>
      )}
    </div>
  )
}