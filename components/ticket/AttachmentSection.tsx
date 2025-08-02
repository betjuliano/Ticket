'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Paperclip, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  Image, 
  FileText,
  X,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Attachment {
  id: string
  filename: string
  originalName: string
  filepath: string
  filesize: number
  mimetype: string
  isImage: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface AttachmentSectionProps {
  ticketId: string
  canUpload?: boolean
}

export function AttachmentSection({ ticketId, canUpload = true }: AttachmentSectionProps) {
  const { data: session } = useSession()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userId = session?.user?.id
  const userRole = session?.user?.role

  // Carregar anexos
  useEffect(() => {
    loadAttachments()
  }, [ticketId])

  const loadAttachments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/attachments`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar anexos')
      }

      const data = await response.json()
      setAttachments(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
      toast.error('Erro ao carregar anexos')
    } finally {
      setIsLoading(false)
    }
  }

  // Upload de arquivo
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validações básicas
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
      return
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)

      // Simular progresso (em produção, usar XMLHttpRequest para progresso real)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      setAttachments(prev => [data.data, ...prev])
      toast.success('Arquivo enviado com sucesso')
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Download de arquivo
  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Download iniciado')
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download')
    }
  }

  // Deletar anexo
  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Tem certeza que deseja deletar "${attachment.originalName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar anexo')
      }

      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
      toast.success('Anexo deletado com sucesso')
    } catch (error) {
      console.error('Erro ao deletar anexo:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar anexo')
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Utilitários
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimetype: string, isImage: boolean) => {
    if (isImage) return <Image className="h-5 w-5 text-blue-500" />
    if (mimetype.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (mimetype.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />
    if (mimetype.includes('excel') || mimetype.includes('sheet')) return <FileText className="h-5 w-5 text-green-600" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'COORDINATOR':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'COORDINATOR':
        return 'Coordenador'
      default:
        return 'Usuário'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Anexos</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Anexos ({attachments.length})
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de upload */}
        {canUpload && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Máximo 10MB • PDF, DOC, XLS, imagens, TXT
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              />
            </div>

            {/* Progresso do upload */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviando arquivo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Lista de anexos */}
        <div className="space-y-4">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum anexo ainda</p>
              {canUpload && (
                <p className="text-sm">Adicione arquivos para dar contexto ao chamado</p>
              )}
            </div>
          ) : (
            attachments.map((attachment) => (
              <div key={attachment.id} className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.mimetype, attachment.isImage)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {attachment.originalName}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getRoleBadgeColor(attachment.user.role)}
                      >
                        {getRoleLabel(attachment.user.role)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{formatFileSize(attachment.filesize)}</span>
                      <span>•</span>
                      <span>{attachment.user.name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(attachment.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(attachment)}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {(userId === attachment.user.id || userRole === 'ADMIN') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(attachment)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

