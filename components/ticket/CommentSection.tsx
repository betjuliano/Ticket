'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  }
}

interface CommentSectionProps {
  ticketId: string
  canComment?: boolean
}

export function CommentSection({ ticketId, canComment = true }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const userRole = session?.user?.role
  const userId = session?.user?.id
  const canCreateInternal = userRole === 'ADMIN' || userRole === 'COORDINATOR'

  // Carregar comentários
  useEffect(() => {
    loadComments()
  }, [ticketId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/comments`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar comentários')
      }

      const data = await response.json()
      setComments(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
      toast.error('Erro ao carregar comentários')
    } finally {
      setIsLoading(false)
    }
  }

  // Criar novo comentário
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('Digite um comentário')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          isInternal: canCreateInternal ? isInternal : false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar comentário')
      }

      const data = await response.json()
      setComments(prev => [...prev, data.data])
      setNewComment('')
      setIsInternal(false)
      toast.success('Comentário adicionado com sucesso')
    } catch (error) {
      console.error('Erro ao criar comentário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar comentário')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Editar comentário
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Digite um comentário')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao editar comentário')
      }

      const data = await response.json()
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? data.data : comment
        )
      )
      setEditingId(null)
      setEditContent('')
      toast.success('Comentário editado com sucesso')
    } catch (error) {
      console.error('Erro ao editar comentário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao editar comentário')
    }
  }

  // Deletar comentário
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este comentário?')) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar comentário')
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId))
      toast.success('Comentário deletado com sucesso')
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar comentário')
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Comentários</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
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
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Comentários ({comments.length})
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de comentários */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>
                      {getInitials(comment.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{comment.user.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={getRoleBadgeColor(comment.user.role)}
                      >
                        {getRoleLabel(comment.user.role)}
                      </Badge>
                      {comment.isInternal && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Interno
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs">(editado)</span>
                        )}
                      </div>
                    </div>
                    
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Editar comentário..."
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim()}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    )}
                    
                    {/* Ações do comentário */}
                    {(userId === comment.user.id || userRole === 'ADMIN') && editingId !== comment.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(comment)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            ))
          )}
        </div>

        {/* Formulário para novo comentário */}
        {canComment && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Adicionar comentário</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Digite seu comentário..."
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
            
            {canCreateInternal && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                  disabled={isSubmitting}
                />
                <Label htmlFor="internal" className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Comentário interno (não visível para usuários)
                </Label>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar comentário'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

