'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Edit,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { CommentSection } from '@/components/ticket/CommentSection'
import { AttachmentSection } from '@/components/ticket/AttachmentSection'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
    role: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
    role: string
  }
  comments: Array<{
    id: string
    content: string
    isInternal: boolean
    createdAt: string
    author: {
      id: string
      name: string
      email: string
      role: string
    }
  }>
  attachments: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    createdAt: string
    uploadedBy: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const ticketId = params.id as string

  // Carregar dados do ticket
  useEffect(() => {
    if (ticketId) {
      loadTicket()
    }
  }, [ticketId])

  const loadTicket = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Ticket não encontrado')
          router.push('/tickets')
          return
        }
        throw new Error('Erro ao carregar ticket')
      }

      const data = await response.json()
      setTicket(data.data)
    } catch (error) {
      console.error('Erro ao carregar ticket:', error)
      toast.error('Erro ao carregar dados do ticket')
    } finally {
      setIsLoading(false)
    }
  }

  // Funções auxiliares
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'OPEN': 'Aberto',
      'IN_PROGRESS': 'Em Andamento',
      'WAITING_FOR_USER': 'Aguardando Usuário',
      'WAITING_FOR_THIRD_PARTY': 'Aguardando Terceiros',
      'RESOLVED': 'Resolvido',
      'CLOSED': 'Fechado',
      'CANCELLED': 'Cancelado'
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'LOW': 'Baixa',
      'MEDIUM': 'Média',
      'HIGH': 'Alta',
      'URGENT': 'Urgente'
    }
    return labels[priority] || priority
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'TECHNICAL_SUPPORT': 'Suporte Técnico',
      'ACCOUNT_ACCESS': 'Acesso à Conta',
      'SYSTEM_ERROR': 'Erro do Sistema',
      'FEATURE_REQUEST': 'Solicitação de Funcionalidade',
      'DOCUMENTATION': 'Documentação',
      'OTHER': 'Outros'
    }
    return labels[category] || category
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Ticket não encontrado</p>
        <Button onClick={() => router.push('/tickets')} className="mt-4">
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/tickets')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-gray-600">#{ticket.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={getStatusBadgeColor(ticket.status)}
          >
            {getStatusLabel(ticket.status)}
          </Badge>
          <Badge 
            variant="secondary" 
            className={getPriorityBadgeColor(ticket.priority)}
          >
            {getPriorityLabel(ticket.priority)}
          </Badge>
        </div>
      </div>

      {/* Informações principais */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Chamado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Categoria</p>
              <p className="text-sm">{getCategoryLabel(ticket.category)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Criado por</p>
              <p className="text-sm">{ticket.createdBy.name}</p>
              <p className="text-xs text-gray-500">{ticket.createdBy.email}</p>
            </div>
            {ticket.assignedTo && (
              <div>
                <p className="text-sm font-medium text-gray-600">Atribuído para</p>
                <p className="text-sm">{ticket.assignedTo.name}</p>
                <p className="text-xs text-gray-500">{ticket.assignedTo.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Criado em</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(ticket.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Descrição</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para comentários e anexos */}
      <Tabs defaultValue="comments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentários ({ticket.comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Anexos ({ticket.attachments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments">
          <CommentSection 
            ticketId={ticket.id} 
            comments={ticket.comments}
            onCommentAdded={loadTicket}
          />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentSection 
            ticketId={ticket.id} 
            attachments={ticket.attachments}
            onAttachmentAdded={loadTicket}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

