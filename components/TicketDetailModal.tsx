'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Bot, Forward, Archive } from 'lucide-react';
import { Ticket } from '@/types/ticket';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onArchive: (ticketId: string) => Promise<void>;
  onForward: (ticketId: string, assignedTo: string) => Promise<void>;
  isLoading?: boolean;
}

export function TicketDetailModal({
  ticket,
  onClose,
  onArchive,
  onForward,
  isLoading = false,
}: TicketDetailModalProps) {
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAiSuggestion = useCallback(async () => {
    setShowAiPanel(true);
    setIsGeneratingAI(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiSuggestion(
        'Com base no problema relatado, sugiro verificar: 1) Se o usuário está usando as credenciais corretas, 2) Se não há bloqueio na conta, 3) Verificar logs do sistema de autenticação.'
      );
    } catch (error) {
      setAiSuggestion('Erro ao gerar sugestão. Tente novamente.');
    } finally {
      setIsGeneratingAI(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-title"
    >
      <Card
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700"
        onClick={e => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle
            id="ticket-title"
            className="text-xl font-semibold text-white"
          >
            {ticket.title}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{ticket.status}</Badge>
            <Badge variant="secondary">{ticket.priority}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-300">{ticket.description}</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <User className="w-4 h-4" /> {ticket.user.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <Mail className="w-4 h-4" /> {ticket.user.email}
            </div>
            {ticket.user.phone && (
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Phone className="w-4 h-4" /> {ticket.user.phone}
              </div>
            )}
          </div>

          {showAiPanel && (
            <Textarea
              value={aiSuggestion}
              readOnly
              className="bg-neutral-800 border-neutral-700 text-neutral-200"
            />
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={() => onArchive(ticket.id)}
              disabled={isLoading}
              variant="outline"
            >
              <Archive className="w-4 h-4 mr-1" /> Arquivar
            </Button>
            <Button
              onClick={() => onForward(ticket.id, ticket.assignedTo || '')}
              disabled={isLoading}
            >
              <Forward className="w-4 h-4 mr-1" /> Encaminhar
            </Button>
            <Button
              onClick={handleAiSuggestion}
              disabled={isGeneratingAI}
              variant="secondary"
            >
              <Bot className="w-4 h-4 mr-1" /> Sugestão IA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
