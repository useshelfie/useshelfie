"use client"

import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
// import { Input } from "@/components/ui/input" // Removed unused import
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { toast } from "sonner"

// --- Types ---
export interface FileWithPreview extends File {
  preview: string
}

interface ProductImageUploadProps {
  newImageFiles: FileWithPreview[]
  setNewImageFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  errors?: string[] // Optional: Pass specific image errors
}

// --- Helper Function ---
const MAX_FILES = 5
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// --- Component ---
export function ProductImageUpload({ newImageFiles, setNewImageFiles, errors }: ProductImageUploadProps) {
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      const currentTotalFiles = newImageFiles.length + acceptedFiles.length

      if (currentTotalFiles > MAX_FILES) {
        toast.error(`Cannot upload more than ${MAX_FILES} images in total.`)
        // Optionally trim the accepted files list if needed
        acceptedFiles = acceptedFiles.slice(0, MAX_FILES - newImageFiles.length)
      }

      const filesWithPreview = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      setNewImageFiles((prevFiles) => [...prevFiles, ...filesWithPreview])
      setRejectedFiles(fileRejections.map((r: any) => r.file)) // Store rejected files info

      // Display errors for rejected files
      fileRejections.forEach((rejection: any) => {
        rejection.errors.forEach((error: any) => {
          toast.error(`Image Error: ${rejection.file.name}`, {
            description: error.message,
          })
        })
      })
    },
    [newImageFiles, setNewImageFiles]
  )

  const removeFile = (index: number) => {
    setNewImageFiles((prevFiles) => {
      const fileToRemove = prevFiles[index]
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview) // Clean up blob URL
      }
      return prevFiles.filter((_, i) => i !== index)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"], // Add GIF if needed
    },
    maxSize: MAX_SIZE_BYTES,
    maxFiles: MAX_FILES, // Enforce max files here too
  })

  // Cleanup object URLs on component unmount
  React.useEffect(() => {
    return () => newImageFiles.forEach((file) => URL.revokeObjectURL(file.preview))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
        }`}>
        <input {...getInputProps()} name="new_images" /> {/* Ensure name matches form handling */}
        {isDragActive ? (
          <p>Drop the images here ...</p>
        ) : (
          <p>Drag 'n' drop some images here, or click to select files</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Up to {MAX_FILES} images, {MAX_SIZE_MB}MB each. Allowed: PNG, JPG, WEBP, GIF
        </p>
      </div>

      {/* Display specific backend errors passed via props */}
      {errors && errors.length > 0 && (
        <div className="text-destructive text-sm space-y-1">
          {errors.map((error, index) => (
            <p key={`prop-err-${index}`}>{error}</p>
          ))}
        </div>
      )}

      {/* Display previews of uploaded images */}
      {newImageFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {newImageFiles.map((file, index) => (
            <div key={file.name + index} className="relative group border rounded-md overflow-hidden">
              <Image
                src={file.preview}
                alt={`Preview ${file.name}`}
                width={100}
                height={100}
                className="object-cover w-full h-24"
                onLoad={() => {
                  // Optional: You might not need to revoke here if cleanup is robust
                  // URL.revokeObjectURL(file.preview); // Revoke after load? Careful with state updates
                }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation() // Prevent dropzone activation
                  removeFile(index)
                }}>
                <X className="h-3 w-3" />
                <span className="sr-only">Remove image {file.name}</span>
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                {file.name} ({formatBytes(file.size)})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optionally display rejected files information */}
      {/* {rejectedFiles.length > 0 && (
        <div className="mt-4 text-destructive text-sm">
          <p>Some files were rejected:</p>
          <ul>
            {rejectedFiles.map((file, index) => (
              <li key={`rej-${index}`}>
                {file.name} ({formatBytes(file.size)}) - Check size or type.
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  )
}
