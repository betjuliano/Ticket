'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface MinIOFileUploadProps {
  ticketId: string;
  userId: string;
  onUploadComplete?: (attachment: Attachment) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // em bytes
  allowedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function MinIOFileUpload({
  ticketId,
  userId,
  onUploadComplete,
  onUploadError,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  multiple = false,
  className,
}: MinIOFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Obter ícone baseado no tipo de arquivo
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxFileSize) {
      return `Arquivo muito grande. Máximo permitido: ${formatFileSize(maxFileSize)}`;
    }

    // Verificar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido: ${file.type}`;
    }

    return null;
  };

  // Upload de arquivo
  const uploadFile = async (file: File): Promise<void> => {
    const validation = validateFile(file);
    if (validation) {
      throw new Error(validation);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    formData.append('userId', userId);

    // Simular progresso (já que FormData não tem evento de progresso nativo)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const response = await fetch('/api/attachments/upload-minio', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }

      if (result.success) {
        toast.success(`Arquivo "${file.name}" enviado com sucesso!`);
        onUploadComplete?.(result.attachment);
      } else {
        throw new Error(result.error || 'Erro desconhecido no upload');
      }
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  // Manipular seleção de arquivos
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);

      if (!multiple && fileArray.length > 1) {
        throw new Error('Apenas um arquivo é permitido');
      }

      for (const file of fileArray) {
        await uploadFile(file);

        // Reset progress entre arquivos
        if (fileArray.length > 1) {
          setUploadProgress(0);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro no upload';
      console.error('Erro no upload:', error);
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manipular input de arquivo
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
  };

  // Manipular drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  // Abrir seletor de arquivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Área de upload */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          {dragOver
            ? 'Solte os arquivos aqui'
            : 'Clique para selecionar ou arraste arquivos aqui'}
        </p>
        <p className="text-xs text-muted-foreground">
          Máximo: {formatFileSize(maxFileSize)} • Tipos:{' '}
          {allowedTypes.map(type => type.split('/')[1]).join(', ')}
        </p>
      </div>

      {/* Input oculto */}
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        disabled={uploading}
        multiple={multiple}
        accept={allowedTypes.join(',')}
        className="hidden"
      />

      {/* Barra de progresso */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando arquivo...</span>
            <span className="text-muted-foreground">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Botão alternativo */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={openFileSelector}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
        </Button>
      </div>
    </div>
  );
}

// Componente para exibir lista de anexos
interface AttachmentListProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onDelete?: (attachment: Attachment) => void;
  className?: string;
}

export function AttachmentList({
  attachments,
  onDownload,
  onDelete,
  className,
}: AttachmentListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  if (attachments.length === 0) {
    return (
      <div className={cn('text-center py-4 text-muted-foreground', className)}>
        Nenhum anexo encontrado
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map(attachment => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(attachment.filename)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attachment.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)} •
                {new Date(attachment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDownload(attachment)}
              >
                Download
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(attachment)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
