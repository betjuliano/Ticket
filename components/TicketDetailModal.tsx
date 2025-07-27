'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Bot, Forward, Archive } from 'lucide-react'
import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket'

interface TicketDetailModalProps {
  ticket: Ticket
  onClose: () => void
  onArchive: (ticketId: string) => Promise<void>
  onForward: (ticketId: string, assignedTo: string) => Promise<void>
  isLoading?: boolean
}

export function TicketDetailModal({ 
  ticket, 
  onClose, 
  onArchive, 
  onForward, 
  isLoading = false 
}: TicketDetailModalProps) {
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const handleAiSuggestion = useCallback(async () => {
    setShowAiPanel(true)
    setIsGeneratingAI(true)
    
    try {
      // Simular chamada para API de IA
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAiSuggestion(
        "Com base no problema relatado, sugiro verificar: 1) Se o usuário está usando as credenciais corretas, 2) Se não há bloqueio na conta, 3) Verificar logs do sistema de autenticação."
      )
    } catch (error) {
      setAiSuggestion('Erro ao gerar sugestão. Tente novamente.')
    } finally {
      setIsGeneratingAI(false)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-title"
    >
      <Card 
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ... resto do modal com melhorias de acessibilidade ... */}
      </Card>
    </div>
  )
}