import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FileError, type FileRejection, useDropzone } from 'react-dropzone'

const supabase = createClient()

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

// Add type for upload response mapping
type UploadResponse = {
  originalName: string
  uploadedPath?: string // Full path used in storage (e.g., "folder/12345-original.png")
  error?: string
}

type UseSupabaseUploadOptions = {
  /**
   * Name of bucket to upload files to in your Supabase project
   */
  bucketName: string
  /**
   * Folder to upload files to in the specified bucket within your Supabase project.
   *
   * Defaults to uploading files to the root of the bucket
   *
   * e.g If specified path is `test`, your file will be uploaded as `test/file_name`
   */
  path?: string
  /**
   * Allowed MIME types for each file upload (e.g `image/png`, `text/html`, etc). Wildcards are also supported (e.g `image/*`).
   *
   * Defaults to allowing uploading of all MIME types.
   */
  allowedMimeTypes?: string[]
  /**
   * Maximum upload size of each file allowed in bytes. (e.g 1000 bytes = 1 KB)
   */
  maxFileSize?: number
  /**
   * Maximum number of files allowed per upload.
   */
  maxFiles?: number
  /**
   * The number of seconds the asset is cached in the browser and in the Supabase CDN.
   *
   * This is set in the Cache-Control: max-age=<seconds> header. Defaults to 3600 seconds.
   */
  cacheControl?: number
  /**
   * When set to true, the file is overwritten if it exists.
   *
   * When set to false, an error is thrown if the object already exists. Defaults to `false`
   */
  upsert?: boolean
}

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  // Errors still refer to original file name for UI clarity
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  // Successes now store the final uploaded path/name
  const [successes, setSuccesses] = useState<string[]>([])

  const isSuccess = useMemo(() => {
    // Determine overall success based on if all *attempted* files succeeded
    const attemptedUploadCount = files.length; // Or filter based on files without initial errors?
    // This logic might need refinement depending on desired "success" definition (e.g., partial success ok?)
    // For now, consider success if loading is done, no errors remain, and successes match files count.
    return !loading && errors.length === 0 && successes.length > 0 && successes.length === files.filter(f => f.errors.length === 0).length;
  }, [errors.length, successes.length, files, loading])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          ; (file as FileWithPreview).preview = URL.createObjectURL(file)
            ; (file as FileWithPreview).errors = []
          return file as FileWithPreview
        })

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        ; (file as FileWithPreview).preview = URL.createObjectURL(file)
          ; (file as FileWithPreview).errors = errors
        return file as FileWithPreview
      })

      const newFiles = [...files, ...validFiles, ...invalidFiles].slice(0, maxFiles); // Enforce maxFiles limit

      setFiles(newFiles)
      // Clear successes/errors when new files are dropped
      setSuccesses([])
      setErrors([])
    },
    [files, setFiles, maxFiles]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    // maxFiles handled manually in onDrop to allow replacing files
    multiple: maxFiles !== 1,
  })

  const onUpload = useCallback(async () => {
    setLoading(true)
    setErrors([]) // Clear previous errors before new attempt
    setSuccesses([]) // Clear previous successes

    const filesToUpload = files.filter((f) => f.errors.length === 0)

    if (filesToUpload.length === 0) {
      setLoading(false)
      return; // Nothing valid to upload
    }

    const responses = await Promise.all(
      filesToUpload.map(async (file): Promise<UploadResponse> => {
        // Generate unique name
        const uniqueName = `${Date.now()}-${file.name.replace(/\\s+/g, '_')}`; // Replace spaces for safety
        const uploadPath = !!path ? `${path}/${uniqueName}` : uniqueName;

        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(uploadPath, file, {
              cacheControl: cacheControl.toString(),
              upsert,
            })

          if (error) {
            console.error(`Upload Error (${file.name}):`, error)
            return { originalName: file.name, error: error.message }
          } else {
            console.log(`Upload Success (${file.name}):`, uploadPath)
            return { originalName: file.name, uploadedPath: uploadPath }
          }
        } catch (catchError: any) {
          console.error(`Upload Exception (${file.name}):`, catchError)
          return { originalName: file.name, error: catchError.message || 'An unexpected error occurred during upload.' }
        }
      })
    )

    // Process responses
    const responseErrors = responses
      .filter((res): res is { originalName: string, error: string } => !!res.error)
      .map(res => ({ name: res.originalName, message: res.error }));

    const responseSuccesses = responses
      .filter((res): res is { originalName: string, uploadedPath: string } => !!res.uploadedPath)
      .map(res => res.uploadedPath); // Store the final uploaded path

    setErrors(responseErrors)
    setSuccesses(responseSuccesses)
    setLoading(false)

  }, [files, path, bucketName, cacheControl, upsert, maxFiles]) // Include maxFiles dependency

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files]) // Depend only on files array identity

  return {
    files,
    setFiles,
    successes, // Contains final uploaded paths
    isSuccess,
    loading,
    errors, // Contains errors linked to original filenames
    setErrors, // Allow manual error setting if needed
    onUpload,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

export { useSupabaseUpload, type UseSupabaseUploadOptions, type UseSupabaseUploadReturn }
